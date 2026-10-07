import {
  multiFactor,
  MultiFactorResolver,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  MultiFactorInfo,
} from "firebase/auth";
import { auth } from "../firebase";

export interface MfaEligibility {
  eligible: boolean;
  reason?: "phone_only" | "email_unverified" | "anonymous" | "no_provider";
  message?: string;
}

/**
 * Checks whether the current authenticated user can enroll in Multi-Factor Authentication.
 * In Firebase Authentication:
 * - Phone-authenticated accounts already use Phone SMS OTP as their primary factor, so Firebase does not support SMS MFA on them.
 * - Email/Password accounts require email verification before MFA enrollment can proceed.
 * - Anonymous accounts do not support MFA.
 */
export function checkMfaEligibility(user: User | null): MfaEligibility {
  if (!user) {
    return {
      eligible: false,
      reason: "no_provider",
      message: "No authenticated user found. Please sign in first.",
    };
  }

  if (user.isAnonymous) {
    return {
      eligible: false,
      reason: "anonymous",
      message: "Guest/Anonymous accounts cannot configure Two-Factor Authentication. Please sign in with an email account.",
    };
  }

  const providers = user.providerData.map((p) => p.providerId);

  // If the user's only provider is phone authentication
  if (providers.length > 0 && providers.every((p) => p === "phone")) {
    return {
      eligible: false,
      reason: "phone_only",
      message:
        "Your account is secured via Phone SMS OTP. Since SMS verification is already your primary sign-in factor, additional SMS Multi-Factor Authentication (MFA) cannot be added.",
    };
  }

  // If the user has an email/password account and email is not verified
  if (providers.includes("password") && !user.emailVerified) {
    return {
      eligible: false,
      reason: "email_unverified",
      message: "Firebase requires your email to be verified before enabling Two-Factor Authentication.",
    };
  }

  return { eligible: true };
}

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;
let currentContainerId: string | null = null;

/**
 * Cleanly removes and purges any previous reCAPTCHA instance and widget from the DOM.
 */
export function resetRecaptchaVerifier(containerId = "auth-recaptcha-container"): void {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // Ignore if not rendered yet
    }
    activeRecaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (container && container.parentNode) {
    // Clone and replace element to completely purge grecaptcha internal element references
    const newContainer = document.createElement("div");
    newContainer.id = containerId;
    container.parentNode.replaceChild(newContainer, container);
  }
  currentContainerId = null;
}

/**
 * Initializes or reuses a RecaptchaVerifier for Phone Auth / MFA.
 */
export function getRecaptchaVerifier(containerId = "auth-recaptcha-container"): RecaptchaVerifier {
  let container = document.getElementById(containerId);

  // If already rendered in this same container and valid, reuse it!
  if (activeRecaptchaVerifier && currentContainerId === containerId && container && container.children.length > 0) {
    return activeRecaptchaVerifier;
  }

  // Otherwise, reset any stale widget first
  resetRecaptchaVerifier(containerId);

  container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }

  activeRecaptchaVerifier = new RecaptchaVerifier(auth, container, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired, resetting...");
      resetRecaptchaVerifier(containerId);
    },
  });

  currentContainerId = containerId;
  return activeRecaptchaVerifier;
}

export type SignInResult =
  | { success: true; user: User; mfaRequired: false }
  | {
      success: false;
      mfaRequired: true;
      resolver: MultiFactorResolver;
      verificationId: string;
      phoneHint: string;
    };

/**
 * Sign in with Email and Password with automatic Multi-Factor Authentication challenge handling.
 */
export async function signInWithEmailAndHandleMfa(
  email: string,
  pass: string,
  containerId = "auth-recaptcha-container"
): Promise<SignInResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: userCredential.user, mfaRequired: false };
  } catch (error: any) {
    if (error.code === "auth/multi-factor-auth-required") {
      const resolver = getMultiFactorResolver(auth, error);
      const phoneHint = resolver.hints.find(
        (hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID
      );

      if (!phoneHint) {
        throw new Error("Multi-factor authentication is required, but no enrolled phone was found.");
      }

      try {
        const verifier = getRecaptchaVerifier(containerId);
        const phoneAuthProvider = new PhoneAuthProvider(auth);

        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
          {
            multiFactorHint: phoneHint,
            session: resolver.session,
          },
          verifier
        );

        return {
          success: false,
          mfaRequired: true,
          resolver,
          verificationId,
          phoneHint: phoneHint.displayName || (phoneHint as any).phoneNumber || "your registered phone",
        };
      } catch (phoneErr) {
        resetRecaptchaVerifier(containerId);
        throw phoneErr;
      }
    }

    throw error;
  }
}

/**
 * Complete MFA sign-in with the received SMS OTP verification code.
 */
export async function confirmMfaSignIn(
  resolver: MultiFactorResolver,
  verificationId: string,
  verificationCode: string
): Promise<User> {
  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  const userCredential = await resolver.resolveSignIn(assertion);
  return userCredential.user;
}

/**
 * Resend SMS OTP for an active MFA sign-in challenge.
 */
export async function resendMfaSignInOtp(
  resolver: MultiFactorResolver,
  containerId = "auth-recaptcha-container"
): Promise<string> {
  const phoneHint = resolver.hints.find(
    (hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID
  );
  if (!phoneHint) {
    throw new Error("No phone factor available to resend code.");
  }

  try {
    const verifier = getRecaptchaVerifier(containerId);
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    return await phoneAuthProvider.verifyPhoneNumber(
      {
        multiFactorHint: phoneHint,
        session: resolver.session,
      },
      verifier
    );
  } catch (err) {
    resetRecaptchaVerifier(containerId);
    throw err;
  }
}

/**
 * Direct Phone Sign-In (Sends SMS OTP directly to phone).
 */
export async function sendPhoneLoginOtp(
  phoneNumber: string,
  containerId = "auth-recaptcha-container"
): Promise<ConfirmationResult> {
  try {
    const verifier = getRecaptchaVerifier(containerId);
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (err) {
    resetRecaptchaVerifier(containerId);
    throw err;
  }
}

/**
 * Confirm direct Phone OTP and sign in.
 */
export async function confirmPhoneLoginOtp(
  confirmationResult: ConfirmationResult,
  verificationCode: string
): Promise<User> {
  const result = await confirmationResult.confirm(verificationCode);
  return result.user;
}

/**
 * Get all enrolled MFA factors for the currently logged-in user.
 */
export function getEnrolledMfaFactors(user: User): MultiFactorInfo[] {
  try {
    return multiFactor(user).enrolledFactors;
  } catch {
    return [];
  }
}

/**
 * Send an SMS OTP to enroll a new phone number into MFA for the logged-in user.
 */
export async function sendMfaEnrollmentOtp(
  user: User,
  phoneNumber: string,
  containerId = "auth-recaptcha-container"
): Promise<string> {
  const eligibility = checkMfaEligibility(user);
  if (!eligibility.eligible) {
    const error: any = new Error(eligibility.message || "Account not eligible for MFA.");
    error.code = eligibility.reason === "phone_only" ? "auth/unsupported-first-factor" : "auth/unverified-email";
    throw error;
  }

  try {
    const session = await multiFactor(user).getSession();
    const verifier = getRecaptchaVerifier(containerId);
    const phoneAuthProvider = new PhoneAuthProvider(auth);

    return await phoneAuthProvider.verifyPhoneNumber(
      {
        phoneNumber,
        session,
      },
      verifier
    );
  } catch (err) {
    resetRecaptchaVerifier(containerId);
    throw err;
  }
}

/**
 * Confirm SMS OTP and finalize MFA enrollment for the logged-in user.
 */
export async function confirmMfaEnrollment(
  user: User,
  verificationId: string,
  verificationCode: string,
  factorName = "Mobile Phone"
): Promise<void> {
  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  await multiFactor(user).enroll(assertion, factorName);
}

/**
 * Unenroll (disable) an MFA factor for the user.
 */
export async function unenrollMfaFactor(user: User, factorUid: string): Promise<void> {
  await multiFactor(user).unenroll(factorUid);
}


import React, { useState, useEffect } from "react";
import { User, MultiFactorInfo, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  CheckCircle,
  X,
  Loader2,
  Lock,
  ArrowRight,
  AlertCircle,
  Mail,
  RefreshCw,
  Info
} from "lucide-react";
import {
  getEnrolledMfaFactors,
  sendMfaEnrollmentOtp,
  confirmMfaEnrollment,
  unenrollMfaFactor,
  checkMfaEligibility,
  MfaEligibility
} from "../services/mfaAuth";

interface MfaSettingsModalProps {
  user: User;
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const MfaSettingsModal: React.FC<MfaSettingsModalProps> = ({
  user,
  isDarkMode,
  isOpen,
  onClose,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [factors, setFactors] = useState<MultiFactorInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"status" | "phone" | "otp">("status");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email verification state
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [refreshingUser, setRefreshingUser] = useState(false);
  const [eligibility, setEligibility] = useState<MfaEligibility>({ eligible: true });

  const refreshUserDataAndFactors = (targetUser = currentUser) => {
    try {
      const el = checkMfaEligibility(targetUser);
      setEligibility(el);
      const enrolled = getEnrolledMfaFactors(targetUser);
      setFactors(enrolled);
    } catch (e) {
      console.error("Error refreshing factors:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const activeUser = auth.currentUser || user;
      setCurrentUser(activeUser);
      refreshUserDataAndFactors(activeUser);
      setStep("status");
      setError(null);
      setSuccessMsg(null);
      setPhoneNumber(activeUser.phoneNumber || "");
      setOtpCode("");
      setEmailSent(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const providers = currentUser.providerData.map((p) => p.providerId);
  const isPhoneOnlyUser = providers.length > 0 && providers.every((p) => p === "phone");
  const isEmailUser = providers.includes("password");

  const handleSendVerificationEmail = async () => {
    setError(null);
    setSuccessMsg(null);
    setSendingEmail(true);

    try {
      await sendEmailVerification(currentUser);
      setEmailSent(true);
      setSuccessMsg(`Verification email sent to ${currentUser.email}. Please check your inbox and click the verification link.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a minute before requesting another verification email.");
      } else {
        setError(err.message || "Failed to send verification email. Please try again.");
      }
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReloadUser = async () => {
    setError(null);
    setRefreshingUser(true);

    try {
      await currentUser.reload();
      if (auth.currentUser) {
        setCurrentUser(auth.currentUser);
        const newEl = checkMfaEligibility(auth.currentUser);
        setEligibility(newEl);
        if (auth.currentUser.emailVerified) {
          setSuccessMsg("Email successfully verified! You can now configure Two-Factor Authentication.");
        } else {
          setError("Email is still not marked as verified. Please make sure you clicked the link in your email and try again.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Could not refresh account status. Please try signing out and signing back in.");
    } finally {
      setRefreshingUser(false);
    }
  };

  const handleSendEnrollmentCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Pre-check eligibility
    const el = checkMfaEligibility(currentUser);
    if (!el.eligible) {
      setError(el.message || "This account is not eligible for MFA.");
      setLoading(false);
      return;
    }

    // Validate phone number format (must start with +)
    const cleanedPhone = phoneNumber.trim();
    if (!cleanedPhone.startsWith("+") || cleanedPhone.length < 8) {
      setError("Please include your country code starting with '+' (e.g., +919876543210 or +1234567890)");
      setLoading(false);
      return;
    }

    try {
      const vId = await sendMfaEnrollmentOtp(currentUser, cleanedPhone, "mfa-enroll-recaptcha");
      setVerificationId(vId);
      setStep("otp");
    } catch (err: any) {
      console.error("MFA Enrollment Error:", err);
      if (err.code === "auth/unsupported-first-factor") {
        if (isPhoneOnlyUser) {
          setError(
            "Your account signs in via Phone OTP, which is already your primary SMS verification method. Firebase does not support SMS MFA on phone-first accounts."
          );
        } else if (isEmailUser && !currentUser.emailVerified) {
          setError(
            "Email verification is required by Firebase before enrolling in 2FA. Please verify your email first."
          );
        } else {
          setError(
            "MFA is not enabled for this project or first factor. Please ensure Multi-Factor Authentication (Identity Platform) is enabled in your Firebase Console under Authentication > Settings."
          );
        }
      } else if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please ensure you included the country code (e.g., +91... or +1...).");
      } else if (err.code === "auth/operation-not-allowed") {
        setError(
          "SMS Multi-Factor Authentication is not enabled in your Firebase Console. Please enable Phone provider and Multi-Factor Authentication under Authentication > Settings."
        );
      } else if (err.code === "auth/requires-recent-login") {
        setError("This security change requires a recent login. Please sign out and sign back in before configuring 2FA.");
      } else if (err.code === "auth/quota-exceeded") {
        setError("SMS quota for this project has been exceeded. Please try again later or add test phone numbers in Firebase Console.");
      } else {
        setError(err.message || "Failed to send verification SMS. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await confirmMfaEnrollment(currentUser, verificationId, otpCode.trim(), "Mobile Phone");
      setSuccessMsg("Two-Factor Authentication (MFA) successfully activated!");
      refreshUserDataAndFactors();
      setStep("status");
    } catch (err: any) {
      console.error(err);
      setError("Incorrect or expired OTP verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (factorUid: string) => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.")) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await unenrollMfaFactor(currentUser, factorUid);
      setSuccessMsg("Two-Factor Authentication disabled.");
      refreshUserDataAndFactors();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setError("Please sign out and sign back in to modify your security settings.");
      } else {
        setError(err.message || "Could not disable 2FA.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isMfaActive = factors.length > 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div id="mfa-enroll-recaptcha"></div>

      <div
        className={`w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all ${
          isDarkMode
            ? "border-[#383832] bg-[#22221F] text-[#E0E0D5]"
            : "border-slate-100 bg-white text-slate-800"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#383832]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Two-Factor Authentication (2FA)</h2>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Multi-Factor Security with SMS OTP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-[#383832] text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border dark:border-rose-900">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border dark:border-emerald-900">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Status Screen */}
        {step === "status" && (
          <div className="mt-5 space-y-4">
            {/* SCENARIO 1: USER IS SIGNED IN WITH PHONE OTP ONLY */}
            {isPhoneOnlyUser ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    isDarkMode
                      ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                      : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <ShieldCheck size={28} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Phone SMS Authentication Active</p>
                    <p className="text-xs opacity-80 mt-1 leading-relaxed">
                      You are signed in with{" "}
                      <span className="font-semibold underline">
                        {currentUser.phoneNumber || "your mobile phone"}
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                    isDarkMode
                      ? "border-[#383832] bg-[#2D2D2A] text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                    <Info size={16} className="text-sky-500 shrink-0" />
                    <span>Why can't I enroll a second SMS factor?</span>
                  </div>
                  <p>
                    Your primary authentication is already <strong>Phone OTP</strong>. Every time you sign in, Firebase sends a secure 6-digit SMS code to your phone.
                  </p>
                  <p>
                    Because SMS verification is already your primary authentication factor, your account already has SMS OTP security. Firebase Multi-Factor Authentication (MFA) is strictly designed to add SMS codes on top of <em>Password</em> or <em>Social</em> logins, not phone-first logins.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full py-3 rounded-xl text-xs font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-[#4A4A3F] hover:bg-[#383832] text-white"
                      : "border-slate-200 hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  Close
                </button>
              </div>
            ) : eligibility.reason === "email_unverified" ? (
              /* SCENARIO 2: EMAIL UNVERIFIED (REQUIRED FOR MFA) */
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    isDarkMode
                      ? "bg-amber-950/20 border-amber-800/40 text-amber-300"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <AlertCircle size={28} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Email Verification Required</p>
                    <p className="text-xs opacity-80 mt-1 leading-relaxed">
                      Firebase requires your email address (
                      <span className="font-semibold">{currentUser.email}</span>) to be verified before enabling Two-Factor Authentication.
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                    isDarkMode
                      ? "border-[#383832] bg-[#2D2D2A] text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <p>
                    To ensure you never get locked out of your account, please verify your email before adding SMS Two-Factor Authentication.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendVerificationEmail}
                    disabled={sendingEmail}
                    className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  >
                    {sendingEmail ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={15} />
                        <span>{emailSent ? "Resend Verification Email" : "Send Verification Email"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReloadUser}
                    disabled={refreshingUser}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                      isDarkMode
                        ? "border-[#4A4A3F] hover:bg-[#383832] text-slate-300"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <RefreshCw size={14} className={refreshingUser ? "animate-spin" : ""} />
                    <span>{refreshingUser ? "Checking..." : "I've Verified My Email (Check Status)"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SCENARIO 3: STANDARD MFA STATUS (ACTIVE OR CAN ENROLL) */
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                    isMfaActive
                      ? isDarkMode
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                        : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : isDarkMode
                      ? "bg-[#2D2D2A] border-[#383832] text-slate-300"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  {isMfaActive ? (
                    <ShieldCheck size={28} className="text-emerald-500 shrink-0" />
                  ) : (
                    <ShieldAlert size={28} className="text-amber-500 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {isMfaActive ? "2FA Protection Enabled" : "2FA Protection Not Configured"}
                    </p>
                    <p className="text-xs opacity-80 mt-0.5">
                      {isMfaActive
                        ? "Your account requires an SMS OTP code on every login."
                        : "Add an extra layer of defense with a one-time SMS verification code."}
                    </p>
                  </div>
                </div>

                {isMfaActive ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Enrolled Factors:
                    </p>
                    {factors.map((factor) => (
                      <div
                        key={factor.uid}
                        className={`flex items-center justify-between p-3.5 rounded-xl border ${
                          isDarkMode ? "border-[#383832] bg-[#2D2D2A]" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Smartphone size={18} className="text-sky-500" />
                          <div>
                            <p className="text-xs font-medium">{factor.displayName || "Phone SMS"}</p>
                            <p className="text-[11px] text-slate-400">
                              {(factor as any).phoneNumber || "Verified Phone"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDisableMfa(factor.uid)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          Disable
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setStep("phone");
                      }}
                      className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      <span>Enable Two-Factor Authentication</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: Phone Input */}
        {step === "phone" && (
          <form onSubmit={handleSendEnrollmentCode} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Your Phone Number</label>
              <div className="relative">
                <Smartphone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="tel"
                  placeholder="+1 555-0100 or +91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                    isDarkMode
                      ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 text-white"
                      : "bg-slate-50 border-slate-200 focus:border-sky-500 text-slate-900"
                  }`}
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Must include country code starting with '+' (e.g. +91, +1, +44). You will receive an SMS with a 6-digit OTP.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("status")}
                className={`flex-1 py-3 rounded-xl text-xs font-semibold border transition-colors ${
                  isDarkMode
                    ? "border-[#4A4A3F] hover:bg-[#383832]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : "Send SMS OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Step: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleConfirmEnrollment} className="mt-5 space-y-4">
            <div className="text-center pb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter the 6-digit code sent to <span className="font-semibold text-slate-700 dark:text-slate-200">{phoneNumber}</span>
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className={`w-full py-3.5 px-4 text-center font-mono text-xl tracking-[0.4em] rounded-xl border outline-none transition-all ${
                  isDarkMode
                    ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 text-white"
                    : "bg-slate-50 border-slate-200 focus:border-sky-500 text-slate-900"
                }`}
                required
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className={`flex-1 py-3 rounded-xl text-xs font-semibold border transition-colors ${
                  isDarkMode
                    ? "border-[#4A4A3F] hover:bg-[#383832]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : "Verify & Activate"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  signInWithEmailAndHandleMfa,
  confirmMfaSignIn,
  resendMfaSignInOtp,
  sendPhoneLoginOtp,
  confirmPhoneLoginOtp,
  resetRecaptchaVerifier
} from "../services/mfaAuth";
import type { MultiFactorResolver, ConfirmationResult } from "firebase/auth";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";

export const AuthForm = ({ isDarkMode }: { isDarkMode: boolean }) => {
  // Mode selection: "email" or "phone"
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [isLogin, setIsLogin] = useState(true);

  // Sign in / Sign up form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phone direct OTP login state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);

  // MFA 2-Step Verification state
  const [isMfaActive, setIsMfaActive] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaVerificationId, setMfaVerificationId] = useState("");
  const [phoneHint, setPhoneHint] = useState("");

  // Common OTP state
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Start cooldown timer for OTP resends
  const startCooldown = (seconds = 30) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle Email & Password Submit (Sign In or Sign Up)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // --- SIGN IN FLOW ---
        const result = await signInWithEmailAndHandleMfa(email, password, "auth-recaptcha-container");
        if (result.mfaRequired) {
          // MFA challenge triggered! Transition to OTP verification
          setMfaResolver(result.resolver);
          setMfaVerificationId(result.verificationId);
          setPhoneHint(result.phoneHint);
          setIsMfaActive(true);
          setOtpCode("");
          startCooldown(30);
        }
      } else {
        // --- CREATE ACCOUNT (SIGN UP) FLOW ---
        // 1. Validate full name
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }

        // 2. Validate phone number format
        const cleanedPhone = signupPhone.trim();
        if (!cleanedPhone.startsWith("+") || cleanedPhone.length < 8) {
          setError("Please enter a valid phone number with country code (e.g. +91 9876543210 or +1 555-0100).");
          setLoading(false);
          return;
        }

        // 3. Validate password length
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        // 4. Validate matching passwords
        if (password !== confirmPassword) {
          setError("Passwords do not match. Please re-enter matching passwords.");
          setLoading(false);
          return;
        }

        // 5. Create account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // 6. Update user's profile with Full Name
        await updateProfile(user, {
          displayName: fullName.trim()
        });

        // 7. Save user details to Firestore
        try {
          await setDoc(doc(db, "users", user.uid), {
            fullName: fullName.trim(),
            displayName: fullName.trim(),
            email: email.trim(),
            phoneNumber: cleanedPhone,
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Could not save profile record in Firestore:", dbErr);
        }

        // 8. Send verification email so user can enable MFA
        try {
          await sendEmailVerification(user);
        } catch (evErr) {
          console.warn("Could not send initial verification email:", evErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid email address or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters long.");
      } else {
        setError(err.message || "Failed to authenticate. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA OTP Verification
  const handleVerifyMfaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver || !mfaVerificationId) return;

    setError(null);
    setLoading(true);

    try {
      await confirmMfaSignIn(mfaResolver, mfaVerificationId, otpCode.trim());
    } catch (err: any) {
      console.error(err);
      setError("Incorrect or expired OTP verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Resending MFA OTP
  const handleResendMfaOtp = async () => {
    if (!mfaResolver || resendCooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const newVId = await resendMfaSignInOtp(mfaResolver, "auth-recaptcha-container");
      setMfaVerificationId(newVId);
      startCooldown(30);
    } catch (err: any) {
      console.error(err);
      setError("Failed to resend OTP. Please try again in a few moments.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Direct Phone OTP Sign-In (Request OTP)
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleaned = phoneNumber.trim();
    if (!cleaned.startsWith("+") || cleaned.length < 8) {
      setError("Please include your country code starting with '+' (e.g. +91 9876543210 or +1 555-0100)");
      setLoading(false);
      return;
    }

    try {
      const confirmation = await sendPhoneLoginOtp(cleaned, "auth-recaptcha-container");
      setPhoneConfirmation(confirmation);
      setOtpCode("");
      startCooldown(30);
    } catch (err: any) {
      console.error(err);
      resetRecaptchaVerifier("auth-recaptcha-container");
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number. Ensure you included the country code (e.g. +1 or +91).");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("SMS is not enabled for this region in your Firebase Console. Please enable the Phone provider and allow India (+91) under Authentication > SMS Region Policy (or use a test phone number).");
      } else {
        setError(err.message || "Failed to send verification SMS. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Direct Phone OTP Confirmation
  const handleConfirmPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneConfirmation) return;

    setError(null);
    setLoading(true);

    try {
      await confirmPhoneLoginOtp(phoneConfirmation, otpCode.trim());
    } catch (err: any) {
      console.error(err);
      setError("Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetAllStates = () => {
    setError(null);
    setIsMfaActive(false);
    setMfaResolver(null);
    setPhoneConfirmation(null);
    setOtpCode("");
    resetRecaptchaVerifier("auth-recaptcha-container");
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="auth-recaptcha-container"></div>

      {error && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
            isDarkMode
              ? "bg-red-900/30 text-red-300 border border-red-800/60"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* --- SCENARIO 1: MFA 2-STEP VERIFICATION SCREEN --- */}
      {isMfaActive ? (
        <form onSubmit={handleVerifyMfaOtp} className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="text-center py-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <ShieldCheck size={26} />
            </div>
            <h3 className={`text-lg font-bold font-serif ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
              Two-Step Verification
            </h3>
            <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Enter the 6-digit authentication code sent to <br />
              <span className={`font-semibold ${isDarkMode ? "text-sky-300" : "text-sky-700"}`}>
                {phoneHint || "your registered phone"}
              </span>
            </p>
          </div>

          <div className="flex flex-col text-left">
            <label className={`text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              Authentication Code (OTP)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className={`w-full py-3.5 px-4 text-center font-mono text-xl tracking-[0.4em] rounded-xl border transition-all focus:ring-2 outline-none ${
                isDarkMode
                  ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                  : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
              }`}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Sign In"}
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleResendMfaOtp}
              disabled={loading || resendCooldown > 0}
              className={`flex items-center gap-1 font-medium transition-colors ${
                resendCooldown > 0
                  ? "text-slate-400 cursor-not-allowed"
                  : isDarkMode
                  ? "text-sky-400 hover:text-sky-300"
                  : "text-sky-600 hover:text-sky-700"
              }`}
            >
              <RefreshCw size={12} className={resendCooldown > 0 ? "" : "hover:rotate-45 transition-transform"} />
              <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend OTP"}</span>
            </button>

            <button
              type="button"
              onClick={resetAllStates}
              className={`flex items-center gap-1 font-medium transition-colors ${
                isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ArrowLeft size={12} />
              <span>Back to Login</span>
            </button>
          </div>
        </form>
      ) : phoneConfirmation ? (
        /* --- SCENARIO 2: DIRECT PHONE OTP CONFIRMATION SCREEN --- */
        <form onSubmit={handleConfirmPhoneOtp} className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="text-center py-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Smartphone size={24} />
            </div>
            <h3 className={`text-lg font-bold font-serif ${isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"}`}>
              Enter Verification Code
            </h3>
            <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              We sent a 6-digit OTP to <br />
              <span className={`font-semibold ${isDarkMode ? "text-sky-300" : "text-sky-700"}`}>
                {phoneNumber}
              </span>
            </p>
          </div>

          <div className="flex flex-col text-left">
            <label className={`text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              6-Digit SMS Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className={`w-full py-3.5 px-4 text-center font-mono text-xl tracking-[0.4em] rounded-xl border transition-all focus:ring-2 outline-none ${
                isDarkMode
                  ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                  : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
              }`}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Sign In"}
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleSendPhoneOtp}
              disabled={loading || resendCooldown > 0}
              className={`flex items-center gap-1 font-medium transition-colors ${
                resendCooldown > 0
                  ? "text-slate-400 cursor-not-allowed"
                  : isDarkMode
                  ? "text-sky-400 hover:text-sky-300"
                  : "text-sky-600 hover:text-sky-700"
              }`}
            >
              <RefreshCw size={12} />
              <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}</span>
            </button>

            <button
              type="button"
              onClick={() => setPhoneConfirmation(null)}
              className={`flex items-center gap-1 font-medium transition-colors ${
                isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ArrowLeft size={12} />
              <span>Change Number</span>
            </button>
          </div>
        </form>
      ) : (
        /* --- SCENARIO 3: STANDARD LOGIN & SIGN UP FORM --- */
        <>
          {/* Method Selector Tabs (Only when signing in) */}
          {isLogin && (
            <div className={`flex rounded-xl p-1 border mb-1 ${isDarkMode ? "bg-[#1C1C19] border-[#383832]" : "bg-slate-100/80 border-slate-200"}`}>
              <button
                type="button"
                onClick={() => { setAuthMethod("email"); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === "email"
                    ? isDarkMode
                      ? "bg-[#2D2D2A] text-white shadow-sm"
                      : "bg-white text-slate-800 shadow-sm"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Mail size={14} />
                <span>Email & Password</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod("phone"); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === "phone"
                    ? isDarkMode
                      ? "bg-[#2D2D2A] text-white shadow-sm"
                      : "bg-white text-slate-800 shadow-sm"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone size={14} />
                <span>Phone OTP</span>
              </button>
            </div>
          )}

          {authMethod === "email" || !isLogin ? (
            /* EMAIL SIGN IN OR FULL SIGN UP FORM */
            <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-3.5">
              {/* Full Name field (Sign Up only) */}
              {!isLogin && (
                <div className="flex flex-col text-left">
                  <label className={`text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all focus:ring-2 outline-none text-sm ${
                        isDarkMode
                          ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                          : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
                      }`}
                      required
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Email Address field */}
              <div className="flex flex-col text-left">
                <label className={`text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all focus:ring-2 outline-none text-sm ${
                      isDarkMode
                        ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                        : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Phone Number field (Sign Up only) */}
              {!isLogin && (
                <div className="flex flex-col text-left">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Phone Number
                    </label>
                    <span className="text-[10px] text-sky-500 font-medium">For OTP Verification</span>
                  </div>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 9876543210 or +1 555-0100"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all focus:ring-2 outline-none text-sm ${
                        isDarkMode
                          ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                          : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
                      }`}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Include country code starting with '+' (e.g. +91, +1).
                  </p>
                </div>
              )}

              {/* Password field */}
              <div className="flex flex-col text-left">
                <label className={`text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-all focus:ring-2 outline-none text-sm ${
                      isDarkMode
                        ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                        : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field (Sign Up only) */}
              {!isLogin && (
                <div className="flex flex-col text-left">
                  <label className={`text-xs font-semibold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-all focus:ring-2 outline-none text-sm ${
                        confirmPassword && password !== confirmPassword
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                          : confirmPassword && password === confirmPassword
                          ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                          : isDarkMode
                          ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                          : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-[11px] text-emerald-500 flex items-center gap-1 mt-1">
                      <CheckCircle2 size={12} />
                      <span>Passwords match</span>
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1.5 py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>{isLogin ? "Sign In with Email" : "Create Account"}</span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleAuthMode}
                className={`w-full text-xs font-medium transition-colors pt-1 ${
                  isDarkMode ? "text-sky-400 hover:text-sky-300" : "text-sky-600 hover:text-sky-700"
                }`}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </form>
          ) : (
            /* PHONE OTP LOGIN */
            <form onSubmit={handleSendPhoneOtp} className="w-full flex flex-col gap-4">
              <div className="flex flex-col text-left">
                <label className={`text-xs font-semibold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Phone Number
                </label>
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 9876543210 or +1 555-0100"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:ring-2 outline-none text-sm ${
                      isDarkMode
                        ? "bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]"
                        : "bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900"
                    }`}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Include country code with '+' (e.g. +91, +1, +44). An SMS OTP will be sent.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                className="w-full mt-1 py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Send Login OTP"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};


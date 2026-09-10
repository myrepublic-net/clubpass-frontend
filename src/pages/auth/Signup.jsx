import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { requestEmailOtp, requestPhoneOtp, signup, verifyEmailOtp, verifyPhoneOtp } from "../../api/auth.js";
import AuthField from "../../components/auth/AuthField.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import InfoModal from "../../components/auth/InfoModal.jsx";
import OtpInput from "../../components/auth/OtpInput.jsx";
import useOtpFlow from "../../hooks/useOtpFlow.js";
import { PRIVACY_POLICY, TERMS_OF_USE } from "./legalCopy.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODE = "+65";

const PASSWORD_RULES = [
  { label: "Eight characters minimum", test: (pw) => pw.length >= 8 },
  { label: "One lowercase character", test: (pw) => /[a-z]/.test(pw) },
  { label: "One uppercase character", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function formatPhone(digits) {
  return digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4, 8)}` : digits;
}

/** "Expires in: Ns" / expired state shared by the email and phone OTP steps. */
function OtpPanel({ flow, onComplete }) {
  return (
    <div className="auth-otp-panel">
      <OtpInput value={flow.code} onChange={flow.setCode} onComplete={onComplete} disabled={flow.verifying} />
      {flow.expired ? (
        <p className="auth-otp-expiry is-expired">Code expired — request a new one.</p>
      ) : (
        <p className="auth-otp-expiry">Expires in: {flow.secondsLeft}s</p>
      )}
      {flow.error && <p className="auth-field-error auth-otp-error">{flow.error}</p>}
    </div>
  );
}

export default function Signup() {
  const [step, setStep] = useState("account"); // account -> phone -> final -> success
  const [legalModal, setLegalModal] = useState(null); // null | "terms" | "privacy"

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const emailOtp = useOtpFlow({ requestOtp: requestEmailOtp, verifyOtp: verifyEmailOtp });
  const phoneOtp = useOtpFlow({ requestOtp: requestPhoneOtp, verifyOtp: verifyPhoneOtp });

  // Each OTP step advances the wizard the moment its code checks out.
  useEffect(() => {
    if (emailOtp.verified && step === "account") setStep("phone");
  }, [emailOtp.verified, step]);

  useEffect(() => {
    if (phoneOtp.verified && step === "phone") setStep("final");
  }, [phoneOtp.verified, step]);

  const canRequestEmailOtp = username.trim().length >= 3 && EMAIL_RE.test(email);
  const canRequestPhoneOtp = phoneDigits.length >= 8;
  const passwordChecks = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
  const passwordValid = passwordChecks.every((rule) => rule.met);
  const canSubmit = passwordValid && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitError("");
    setSubmitting(true);
    try {
      await signup({
        username,
        email,
        phoneNumber: `${COUNTRY_CODE}${phoneDigits}`,
        password,
        referralCode: referralCode.trim() || undefined,
        promoCode: promoCode.trim() || undefined,
        marketingOptIn,
      });
      setStep("success");
    } catch (error) {
      setSubmitError(error?.message ?? "Couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const loginFooter = (
    <p className="auth-switch">
      Have an account? <Link to="/login">LOG IN NOW</Link>
    </p>
  );

  if (step === "success") {
    return (
        
      <AuthLayout>
         <img
        src="/images/rl-full-icon.png"
        alt="Account successfully created"
        className="auth-success-image"
      />
      <div className="auth-card-head">
         <h1>Account successfully <br/>created!</h1>
        <p>Onwards!</p>
      </div>
       
        
        {/* <p className="auth-success-text">Welcome aboard, {username}. You can log in now.</p> */}
        <Link to="/login" className="auth-cta auth-cta-link">
          Continue to log in
        </Link>
      </AuthLayout>
    );
  }

  if (step === "account") {
    return (
      <AuthLayout title="Create Account" subtitle="Let's get you started.">
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <AuthField
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            action={
              <button
                type="button"
                className="auth-field-action"
                disabled={!canRequestEmailOtp || emailOtp.sending}
                onClick={() => emailOtp.request({ username, email })}
              >
                {emailOtp.sending ? "Sending…" : emailOtp.expired ? "Resend" : "Get OTP"}
              </button>
            }
          />

          {emailOtp.sent && (
            <div>
              <label className="auth-otp-label">Enter OTP</label>
              <OtpPanel flow={emailOtp} onComplete={(code) => emailOtp.verify(code)} />
            </div>
          )}
        </form>
        {loginFooter}
      </AuthLayout>
    );
  }

  if (step === "phone") {
    return (
      <AuthLayout title="Almost There!" subtitle="We can't wait to welcome you.">
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <AuthField
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            autoComplete="tel-national"
            prefix={phoneDigits ? COUNTRY_CODE : null}
            value={formatPhone(phoneDigits)}
            onChange={(event) => setPhoneDigits(event.target.value.replace(/\D/g, "").slice(0, 8))}
            action={
              <button
                type="button"
                className="auth-field-action"
                disabled={!canRequestPhoneOtp || phoneOtp.sending}
                onClick={() => phoneOtp.request(`${COUNTRY_CODE}${phoneDigits}`)}
              >
                {phoneOtp.sending ? "Sending…" : phoneOtp.expired ? "Resend" : "Get OTP"}
              </button>
            }
          />

          {phoneOtp.sent && (
            <div>
              <label className="auth-otp-label">Enter OTP</label>
              <OtpPanel flow={phoneOtp} onComplete={(code) => phoneOtp.verify(code)} />
            </div>
          )}
        </form>
        {loginFooter}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Final step!" subtitle="Your adventure begins now.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onFocus={() => setPasswordTouched(true)}
          onChange={(event) => setPassword(event.target.value)}
          suffix={
            <button
              type="button"
              className="auth-field-icon-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {passwordTouched && (
          <ul className="auth-password-rules">
            {passwordChecks.map((rule) => (
              <li key={rule.label} className={rule.met ? "is-met" : ""}>
                {rule.label}
              </li>
            ))}
          </ul>
        )}

        <AuthField
          label="Referral Code (optional)"
          name="referralCode"
          value={referralCode}
          onChange={(event) => setReferralCode(event.target.value)}
        />
        <AuthField
          label="Promo Code (optional)"
          name="promoCode"
          value={promoCode}
          onChange={(event) => setPromoCode(event.target.value)}
        />

        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
          />
          <span>I agree to receive marketing materials, news, and updates from Clubpass</span>
        </label>

        {submitError && <p className="auth-field-error">{submitError}</p>}

        <button type="submit" className="auth-cta" disabled={!canSubmit}>
          {submitting ? "Signing Up…" : "Sign Up Now"}
        </button>

        <p className="auth-legal-fine">
          By signing up, you agree to our{" "}
          <button type="button" className="auth-legal-link" onClick={() => setLegalModal("terms")}>
            Terms of Use
          </button>{" "}
          and{" "}
          <button type="button" className="auth-legal-link" onClick={() => setLegalModal("privacy")}>
            Privacy Policy
          </button>
        </p>
      </form>

      {legalModal === "terms" && (
        <InfoModal title="Terms of Use" onClose={() => setLegalModal(null)}>
          {TERMS_OF_USE}
        </InfoModal>
      )}
      {legalModal === "privacy" && (
        <InfoModal title="Privacy Policy" onClose={() => setLegalModal(null)}>
          {PRIVACY_POLICY}
        </InfoModal>
      )}
    </AuthLayout>
  );
}

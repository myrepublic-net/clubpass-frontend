import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

import { completePasswordReset, requestPasswordReset, verifyPasswordReset } from "../../api/auth.js";
import AuthField from "../../components/auth/AuthField.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import { PASSWORD_RULES } from "./passwordRules.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reward Land never says whether the email has an account, so neither do we.
const SENT_MESSAGE = "If an account exists for this email, a reset code has been sent to it.";

/**
 * Forgot password: email -> code -> new password -> done. Styled like the
 * login and signup cards. Nothing here signs the member in; the last step
 * sends them to log in with the new password, and on to wherever they were
 * heading before (router state, same as Login).
 */
export default function ForgotPassword() {
  const location = useLocation();

  const [step, setStep] = useState("email"); // email -> code -> password -> done
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const passwordChecks = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
  const passwordValid = passwordChecks.every((rule) => rule.met);

  /** Runs one step with the busy flag and error handling every step shares. */
  const run = async (work) => {
    setError("");
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (event) => {
    event?.preventDefault();
    if (!EMAIL_RE.test(email.trim()) || busy) return;

    run(async () => {
      await requestPasswordReset(email.trim());
      setCode("");
      setNotice(SENT_MESSAGE);
      setStep("code");
    });
  };

  const checkCode = (event) => {
    event.preventDefault();
    if (!code.trim() || busy) return;

    run(async () => {
      await verifyPasswordReset(email.trim(), code.trim());
      setNotice("");
      setStep("password");
    });
  };

  const savePassword = (event) => {
    event.preventDefault();
    if (!passwordValid || busy) return;

    run(async () => {
      await completePasswordReset({ email: email.trim(), otp: code.trim(), password });
      setStep("done");
    });
  };

  /** A failed code or an expired window can only be fixed with a new code. */
  const startOver = () => {
    setStep("email");
    setCode("");
    setPassword("");
    setError("");
    setNotice("");
  };

  if (step === "done") {
    return (
      <AuthLayout title="Password Reset" subtitle="Your password has been changed. Please log in with your new password.">
        <Link to="/login" state={location.state} className="auth-cta auth-cta-link">
          Log In
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle={
        step === "email"
          ? "Enter your account email and we'll send you a reset code."
          : step === "code"
            ? "Enter the reset code from your email."
            : "Choose a new password."
      }
    >
      {step === "email" && (
        <form className="auth-form" onSubmit={sendCode}>
          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error && <p className="auth-field-error">{error}</p>}

          <button type="submit" className="auth-cta" disabled={!EMAIL_RE.test(email.trim()) || busy}>
            {busy ? "Sending…" : "Send Reset Code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form className="auth-form" onSubmit={checkCode}>
          {notice && <p className="auth-success-text">{notice}</p>}

          <AuthField
            label="Reset Code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
          />

          {error && <p className="auth-field-error">{error}</p>}

          <button type="submit" className="auth-cta" disabled={!code.trim() || busy}>
            {busy ? "Checking…" : "Verify Code"}
          </button>

          <p className="auth-legal-fine">
            Didn't get it? Check your spam folder, or{" "}
            <button type="button" className="auth-legal-link" onClick={startOver}>
              use a different email
            </button>
            .
          </p>
        </form>
      )}

      {step === "password" && (
        <form className="auth-form" onSubmit={savePassword}>
          <AuthField
            label="New Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
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

          <ul className="auth-password-rules">
            {passwordChecks.map((rule) => (
              <li key={rule.label} className={rule.met ? "is-met" : ""}>
                {rule.label}
              </li>
            ))}
          </ul>

          {error && (
            <p className="auth-field-error">
              {error}{" "}
              <button type="button" className="auth-legal-link" onClick={startOver}>
                Request a new code
              </button>
            </p>
          )}

          <button type="submit" className="auth-cta" disabled={!passwordValid || busy}>
            {busy ? "Saving…" : "Reset Password"}
          </button>
        </form>
      )}

      <p className="auth-switch">
        Remembered it? <Link to="/login" state={location.state}>LOG IN</Link>
      </p>
    </AuthLayout>
  );
}

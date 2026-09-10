import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { login } from "../../api/auth.js";
import AuthField from "../../components/auth/AuthField.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";

/**
 * No reference screenshot was given for this one — styled to match the
 * signup card (same background, card, fields and button) since there's no
 * design spec for login yet.
 */
export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError("");
    setSubmitting(true);
    try {
      await login({ identifier, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message ?? "Couldn't log you in. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to your Clubpass account.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          label="Email"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        <AuthField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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

        {error && <p className="auth-field-error">{error}</p>}

        <button type="submit" className="auth-cta" disabled={!canSubmit}>
          {submitting ? "Logging In…" : "Log In"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/signup">SIGN UP NOW</Link>
      </p>
    </AuthLayout>
  );
}

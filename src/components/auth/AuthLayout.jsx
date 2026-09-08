import "../../css/auth.css";

/** Full-bleed bg_welcome_auth.png behind a centered white card. Shared by Login and Signup. */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-card-head">
          
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}

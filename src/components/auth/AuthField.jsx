/**
 * A bordered input box with its label sitting inside the box, top-left —
 * the style used throughout the signup/login cards. `action` renders a
 * clickable slot on the right (e.g. "GET OTP"); `suffix` renders a plain one
 * (e.g. the password show/hide toggle).
 */
export default function AuthField({
  label,
  action,
  suffix,
  prefix,
  error,
  className = "",
  ...inputProps
}) {
  return (
    // <div className={`auth-field ${error ? "has-error" : ""} ${className}`} >
    //   <div className="auth-field-box">
    //     {prefix && <span className="auth-field-prefix">{prefix}</span>}
    //     <div className="auth-field-control">
    //       <label className="auth-field-label">{label}</label>
    //       <input  className="auth-field-input" {...inputProps} />
    //     </div>
    //     {action}
    //     {suffix}
    //   </div>
    //   {error && <p className="auth-field-error">{error}</p>}
    // </div>




<div className={`auth-field ${error ? "has-error" : ""} ${className}`}>
  <div className="auth-field-box">
    {prefix && <span className="auth-field-prefix">{prefix}</span>}

    <div
      className={`auth-field-control ${
        inputProps.value || inputProps.defaultValue ? "has-value" : ""
      }`}
    >
      <label className="auth-field-label">{label}</label>

      <input
        className="auth-field-input"
        {...inputProps}
      />
    </div>

    {action}
    {suffix}
  </div>

  {error && <p className="auth-field-error">{error}</p>}
</div>
  );
}

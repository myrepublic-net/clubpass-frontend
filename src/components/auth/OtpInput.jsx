import { useEffect, useRef } from "react";

/**
 * Six single-digit boxes acting as one OTP field. Typing, backspace, arrow
 * keys and pasting a full code all move focus the way a native OTP field
 * would. Calls onComplete as soon as the 6th digit lands.
 */
export default function OtpInput({ length = 6, value, onChange, onComplete, disabled }) {
  const boxRefs = useRef([]);

  useEffect(() => {
    if (value.length === 0) boxRefs.current[0]?.focus();
  }, [value.length]);

  const setDigit = (index, digit) => {
    const next = value.split("");
    next[index] = digit;
    const joined = next.join("").slice(0, length);
    onChange(joined);
    if (joined.length === length) onComplete?.(joined);
  };

  const handleChange = (index, event) => {
    const digits = event.target.value.replace(/\D/g, "");
    if (!digits) {
      setDigit(index, "");
      return;
    }

    if (digits.length > 1) {
      // Pasted or autofilled — spread across the remaining boxes.
      const joined = (value.slice(0, index) + digits).slice(0, length);
      onChange(joined);
      boxRefs.current[Math.min(joined.length, length - 1)]?.focus();
      if (joined.length === length) onComplete?.(joined);
      return;
    }

    setDigit(index, digits);
    boxRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) boxRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < length - 1) boxRefs.current[index + 1]?.focus();
  };

  return (
    <div className="auth-otp-boxes">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (boxRefs.current[index] = el)}
          className="auth-otp-box"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[index] ?? ""}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
        />
      ))}
    </div>
  );
}

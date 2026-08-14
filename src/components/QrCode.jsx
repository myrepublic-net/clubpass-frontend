import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders `value` as a QR image. The value itself is never rendered as text —
 * the boarding link is only ever readable by scanning.
 */
export default function QrCode({
  value,
  size = 200,
  label = "Boarding QR code",
  errorCorrectionLevel = "M",
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!value) return;

    let cancelled = false;
    setFailed(false);

    QRCode.toDataURL(value, {
      // Render at 2× so it stays crisp on retina screens.
      width: size * 2,
      margin: 1,
      errorCorrectionLevel,
      color: { dark: "#191024ff", light: "#ffffffff" },
    }).then(
      (url) => {
        if (!cancelled) setSrc(url);
      },
      (error) => {
        console.error("QR render failed", error);
        if (!cancelled) setFailed(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [value, size, errorCorrectionLevel]);

  if (failed) return <p className="cpq-fallback">Couldn't render your QR code. Please reload.</p>;

  return (
    <img
      className="cpq-img"
      src={src}
      width={size}
      height={size}
      alt={label}
      style={{ visibility: src ? "visible" : "hidden" }}
    />
  );
}

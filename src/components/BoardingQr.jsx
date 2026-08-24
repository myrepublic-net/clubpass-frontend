import { useMemo } from "react";

import QrCode from "./QrCode.jsx";
import { useClubpassUser } from "./clubpassUserContext.js";
import { buildScanLink } from "../api/clubpassUser.js";

/**
 * The member's boarding QR: a link carrying a token that only lives a minute,
 * rather than the boarding code itself. UserGate keeps the token fresh, so this
 * just redraws whenever a new one lands.
 */
export default function BoardingQr({ size = 196, label = "Your Clubpass boarding QR code" }) {
  const { user } = useClubpassUser();
  const link = useMemo(() => buildScanLink(user), [user?.userName, user?.token]);

  if (!link) {
    return <p className="cpq-fallback">No nights left on this pass.</p>;
  }

  // A link is a lot more data than a 6-digit code, so the lowest error
  // correction keeps the modules chunky enough to scan off a phone screen.
  return <QrCode value={link} size={size} label={label} errorCorrectionLevel="L" />;
}

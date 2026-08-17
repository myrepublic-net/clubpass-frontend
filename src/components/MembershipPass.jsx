import BoardingQr from "./BoardingQr.jsx";
import { useScanCountdown } from "./clubpassUserContext.js";
import "../css/membership-pass.css";

const dateFormat = new Intl.DateTimeFormat("en-SG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

/** The boarding pass a subscribed member sees — QR only, never the raw code.
 *  The QR carries a short-lived link, so it refreshes itself while on screen. */
export default function MembershipPass({ user }) {
  const secondsToRefresh = useScanCountdown();

  return (
    <div className="cpp-pass">
      <div className="cpp-head">
        <span className="cpp-badge">
          <i />
          Active
        </span>

        {secondsToRefresh > 0 && (
          <span className="cpp-refresh" title="Time until this pass fetches a new code">
            <i aria-hidden="true">↻</i>
            {secondsToRefresh}s
          </span>
        )}

        <b>{user.userName}</b>
      </div>

      <div className="cpp-qr">
        <BoardingQr size={232} />
      </div>

      <p className="cpp-hint">Show this to the driver at boarding.</p>

      <div className="cpp-meta">
        <div>
          <b>{user.tripLeft ?? 0}</b>
          <span>nights left</span>
        </div>
        <div>
          <b>{formatDate(user.paidOn)}</b>
          <span>member since</span>
        </div>
      </div>
    </div>
  );
}

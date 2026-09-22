import { useEffect } from "react";

import "../css/event-tickets.css";

const REWARD_LAND_APP = "https://rewardland.onelink.me/EwIe/start";

/**
 * "Redeem Your R Coins" — the same sheet the Order Confirmed screen opens
 * (same markup and event-tickets.css classes), for pages outside the ticket
 * flow. Closes on Escape or a tap outside.
 */
export default function RCoinsSheet({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="evt-sheet-overlay"
      role="presentation"
      onClick={onClose}
      // The sheet's teal comes from a variable set on .evt-page, which pages
      // outside the ticket flow don't have.
      style={{ "--evt-teal": "#1FDBDA" }}
    >
      <div
        className="evt-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Redeem your R Coins"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <span className="evt-sheet-grip" aria-hidden="true" />

        <img className="evt-sheet-art" src="/images/r-coin.png" alt="" />

        <h2>Redeem Your R Coins</h2>
        <p>Use the Reward Land app to redeem your r coins at 170+ partner brands.</p>

        <a className="evt-sheet-cta" href={REWARD_LAND_APP} target="_blank" rel="noopener noreferrer">
          Open Reward Land App
        </a>
      </div>
    </div>
  );
}

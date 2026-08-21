import { useCallback, useState } from "react";

import BoardingQr from "./BoardingQr.jsx";
import PickupSheet from "./PickupSheet.jsx";
import { useClubpassUser, useScanCountdown } from "./clubpassUserContext.js";
import { cancelSubscription } from "../api/subscribe.js";
import {
  DROPOFFS,
  PICKUPS,
  PLAN,
  SCHEDULE,
  SUPPORT_URL,
  TRACKING_URL,
} from "../data/homeExpress.js";
import "../css/member-dashboard.css";

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

/**
 * What the member is told their membership is doing, from the billing state the
 * Lambda writes. Four internal states collapse into the three a member cares
 * about: is it running, did they stop it, or does it need their attention.
 */
function membershipStatus(user) {
  switch (user?.billingStatus) {
    case "cancelled":
      return { label: "Cancelled", tone: "off" };
    case "lapsed":
      // A charge that actually failed — the membership is at risk.
      return { label: "Payment issue", tone: "bad" };
    default:
      // "manual-renewal" lands here on purpose: the payment went through and
      // the membership is running. Nothing was saved to charge next month,
      // which is a renewal problem, not a payment one — saying "payment issue"
      // straight after a successful payment reads as "your money didn't
      // arrive". The subscription card carries the actual caveat.
      return { label: "Active", tone: "good" };
  }
}

function Section({ title, children, action }) {
  return (
    <section className="cmd-section">
      <div className="cmd-section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * The member's home once they've paid: their pass, where the coach stops, what
 * they're paying and how to stop paying it.
 *
 * `onRestart` reopens the subscribe sheet — a cancelled membership can't be
 * un-cancelled at PayPal, so restarting means subscribing again.
 */
export default function MemberDashboard({ onRestart }) {
  const { userName, user, setUser } = useClubpassUser();
  const secondsToRefresh = useScanCountdown();

  const [openPickup, setOpenPickup] = useState(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelState, setCancelState] = useState({ status: "idle" });

  const status = membershipStatus(user);
  const cancelled = user?.billingStatus === "cancelled";

  // Paid up, but with no saved payment method behind it.
  const noAutoRenew = user?.billingStatus === "manual-renewal";

  const cancel = useCallback(async () => {
    setCancelState({ status: "working" });

    try {
      const { accessEndsOn } = await cancelSubscription({
        subscriptionId: user?.subscriptionId,
        userName,
      });

      // The record now says cancelled; reflect it without a round trip, since
      // the pass on screen reads straight off this object.
      setUser({ ...user, billingStatus: "cancelled" });
      setCancelState({ status: "done", accessEndsOn });
    } catch (error) {
      console.error("ClubPass cancel failed", error);
      setCancelState({ status: "error", message: error.message });
    }
  }, [user, userName, setUser]);

  // Cancelling stops the renewal; the nights already paid for run to the date
  // the next payment would have been taken.
  const accessEndsOn = cancelState.accessEndsOn ?? user?.nextBillingOn;

  return (
    <div className="cmd-page">
      <title>Your ClubPass | Home Express</title>

      <div className="cmd-shell">
        {/* ============ 1. Welcome ============ */}
        <header className="cmd-hero">
          <p className="cmd-eyebrow">ClubPass · Home Express</p>
          <h1>Welcome back, {userName}</h1>

          <span className={`cmd-status cmd-status--${status.tone}`}>
            <i aria-hidden="true" />
            {status.label}
          </span>
        </header>

        {/* ============ 2. Membership QR ============ */}
        <Section
          title="Your boarding pass"
          action={
            secondsToRefresh > 0 && (
              <span className="cmd-refresh" title="Time until this pass fetches a new code">
                ↻ {secondsToRefresh}s
              </span>
            )
          }
        >
          <div className="cmd-card cmd-qr-card">
            <BoardingQr size={220} />
            <p className="cmd-qr-hint">Show this to the driver at boarding.</p>

            <div className="cmd-qr-meta">
              <div>
                <b>{user?.tripLeft ?? 0}</b>
                <span>nights left</span>
              </div>
              <div>
                <b>{formatDate(user?.paidOn)}</b>
                <span>member since</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ============ 4. Live tracking ============ */}
        <Section title="On the night">
          <a
            className={`cmd-btn cmd-track${TRACKING_URL ? "" : " is-disabled"}`}
            href={TRACKING_URL || undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={TRACKING_URL ? undefined : "true"}
          >
            Track bus
          </a>
          <p className="cmd-note">
            {TRACKING_URL
              ? "Opens live tracking in a new tab."
              : "Live tracking link isn't configured yet."}
          </p>
        </Section>

        {/* ============ 3. Route & schedule ============ */}
        <Section title="Route & schedule">
          <div className="cmd-card">
            <div className="cmd-schedule">
              <b>{SCHEDULE.nights}</b>
              <span>{SCHEDULE.window}</span>
              <span>{SCHEDULE.cadence}</span>
            </div>

            <h3 className="cmd-leg">City pick-ups</h3>
            <p className="cmd-note">Tap a stop for the exact spot and directions.</p>

            <ul className="cmd-stops">
              {PICKUPS.map((pickup) => (
                <li key={pickup.id}>
                  <button type="button" className="cmd-stop" onClick={() => setOpenPickup(pickup)}>
                    <span className="cmd-stop-time">{pickup.time}</span>
                    <span className="cmd-stop-name">{pickup.name}</span>
                    <span className="cmd-stop-chevron" aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="cmd-leg">Drop-offs</h3>
            <ul className="cmd-drops">
              {DROPOFFS.map((stop) => (
                <li key={stop.id}>{stop.name}</li>
              ))}
            </ul>
          </div>
        </Section>

        {/* ============ 5. Subscription ============ */}
        <Section title="Your subscription">
          <div className="cmd-card">
            <dl className="cmd-facts">
              <div>
                <dt>Plan</dt>
                <dd>{PLAN.name}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>
                  {PLAN.currency === "SGD" ? "S$" : `${PLAN.currency} `}
                  {PLAN.price}
                </dd>
              </div>
              <div>
                <dt>Billing cycle</dt>
                <dd>{PLAN.cycle}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{formatDate(user?.paidOn)}</dd>
              </div>
              <div>
                <dt>{cancelled ? "Access ends" : "Next renewal"}</dt>
                <dd>{formatDate(accessEndsOn)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{status.label}</dd>
              </div>
            </dl>

            {noAutoRenew && (
              <p className="cmd-note cmd-note-warn">
                Auto-renew isn't set up for this payment method, so this month won't renew on its
                own. Subscribe again before it runs out to keep your nights.
              </p>
            )}
          </div>
        </Section>

        {/* ============ 6. Manage ============ */}
        <Section title="Manage membership">
          <div className="cmd-card">
            {cancelled ? (
              <>
                <p className="cmd-note">
                  Your membership is cancelled. You can keep riding until{" "}
                  <b>{formatDate(accessEndsOn)}</b> — after that the pass stops working.
                </p>
                <button type="button" className="cmd-btn" onClick={onRestart}>
                  Restart membership
                </button>
              </>
            ) : !manageOpen ? (
              <button
                type="button"
                className="cmd-btn cmd-btn-quiet"
                onClick={() => setManageOpen(true)}
              >
                Cancel membership
              </button>
            ) : (
              <>
                <p className="cmd-note">
                  Cancelling stops the next payment. You keep your nights until{" "}
                  <b>{formatDate(accessEndsOn)}</b>, and nothing is charged after that.
                </p>

                {cancelState.status === "error" && (
                  <p className="cmd-error">{cancelState.message}</p>
                )}

                <div className="cmd-row">
                  <button
                    type="button"
                    className="cmd-btn cmd-btn-quiet"
                    onClick={() => setManageOpen(false)}
                    disabled={cancelState.status === "working"}
                  >
                    Keep membership
                  </button>
                  <button
                    type="button"
                    className="cmd-btn cmd-btn-danger"
                    onClick={cancel}
                    disabled={cancelState.status === "working"}
                  >
                    {cancelState.status === "working" ? "Cancelling…" : "Confirm cancel"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* ============ 7. Help ============ */}
        <Section title="Help & support">
          <a
            className="cmd-card cmd-help"
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <b>Home Express FAQ</b>
              <small>Boarding, billing and route questions</small>
            </span>
            <span className="cmd-stop-chevron" aria-hidden="true">›</span>
          </a>
        </Section>
      </div>

      <PickupSheet pickup={openPickup} onClose={() => setOpenPickup(null)} />
    </div>
  );
}

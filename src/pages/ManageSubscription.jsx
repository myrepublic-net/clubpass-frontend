import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import { cancelSubscription, reactivateMembership } from "../api/subscribe.js";
import SubscribeModal from "../components/SubscribeModal.jsx";
import UserMenu from "../components/UserMenu.jsx";
import { ClubpassUserContext } from "../components/clubpassUserContext.js";
import "../css/profile.css";
import "../css/manage-subscription.css";

const PLAN_NAME = "ClubPass Member";
const PLAN_PRICE = import.meta.env.VITE_CLUBPASS_PRICE ?? "17.90";

const BENEFITS_LOST = [
  "30% discount on standard admission",
  "3X R Coin multipliers",
  "Access to free express ride home",
];

/** How the payment method was taken, in the member's words. */
const METHOD_LABELS = {
  card: "Debit or credit card",
  paypal: "PayPal",
  googlepay: "Google Pay",
  applepay: "Apple Pay",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

/**
 * Managing an existing membership: what's being charged, cancelling it, and
 * picking it back up. Reached from the profile — the Home Express page at
 * /clubpass-app isn't part of this journey.
 */
export default function ManageSubscription() {
  const navigate = useNavigate();
  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  const [user, setUser] = useState(null);
  // manage -> cancel -> ended. A membership already cancelled opens on "ended".
  const [step, setStep] = useState("manage");
  const [cancelState, setCancelState] = useState({ status: "idle" });
  const [resubscribeOpen, setResubscribeOpen] = useState(false);
  const [reactivateState, setReactivateState] = useState({ status: "idle", message: "" });

  useEffect(() => {
    if (!session?.user?.username) return;

    let cancelled = false;
    resolveClubpassUser(session.user).then(
      (record) => {
        if (cancelled) return;
        setUser(record);
        if (record?.billingStatus === "cancelled") setStep("ended");
      },
      (error) => console.error("ClubPass user lookup failed", error),
    );
    return () => { cancelled = true; };
  }, [session]);

  if (!userName) return <Navigate to="/login" state={{ from: "/membership" }} replace />;

  const endsOn = cancelState.accessEndsOn ?? user?.accessEndsOn ?? user?.nextBillingOn;

  /**
   * Resumes the membership they cancelled — no charge while the paid period is
   * still running. Only when that isn't possible (period over, or a PayPal
   * subscription that can't be restarted) does it fall back to checkout.
   */
  const reactivate = async () => {
    setReactivateState({ status: "working", message: "" });

    try {
      const result = await reactivateMembership({ userName, accessToken: session?.token });

      if (result.needsPayment) {
        setReactivateState({ status: "idle", message: "" });
        setResubscribeOpen(true);
        return;
      }

      if (result.user) setUser(result.user);
      setCancelState({ status: "idle" });
      setReactivateState({ status: "idle", message: "" });
      setStep("manage");
    } catch (error) {
      console.error("ClubPass reactivate failed", error);
      setReactivateState({
        status: "error",
        message: error?.message ?? "We couldn't reactivate your membership. Please try again.",
      });
    }
  };

  const confirmCancel = async () => {
    setCancelState({ status: "working" });

    try {
      const { accessEndsOn } = await cancelSubscription({
        userName,
        accessToken: session?.token,
      });

      // Reflect it locally rather than re-reading; the page shows this record.
      setUser((prev) => ({ ...prev, billingStatus: "cancelled", accessEndsOn, nextBillingOn: null }));
      setCancelState({ status: "done", accessEndsOn });
      setStep("ended");
    } catch (error) {
      console.error("ClubPass cancel failed", error);
      setCancelState({ status: "error", message: error.message });
    }
  };

  const header = (title) => (
    <header className="prf-header">
      <button
        type="button"
        className="prf-back"
        onClick={() => (step === "manage" ? navigate("/profile") : setStep("manage"))}
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <h1>{title}</h1>
      <UserMenu userName={userName} />
    </header>
  );

  if (step === "cancel") {
    return (
      <div className="prf-page">
        {header("Cancel Membership")}

        <div className="prf-body">
          <h2 className="ms-title">Are you sure?</h2>
          <p className="ms-lede">
            Your premium benefits will remain active until the end of your current billing cycle
            on {formatDate(endsOn)}.
          </p>

          <div className="ms-warn">
            <p className="ms-warn-head">Benefits you will lose:</p>
            <ul>
              {BENEFITS_LOST.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>

          {cancelState.status === "error" && <p className="ms-error">{cancelState.message}</p>}

          <button
            type="button"
            className="ms-btn ms-btn--danger"
            onClick={confirmCancel}
            disabled={cancelState.status === "working"}
          >
            {cancelState.status === "working" ? "Cancelling…" : "Cancel membership"}
          </button>

          <button
            type="button"
            className="ms-btn ms-btn--keep"
            onClick={() => navigate("/profile")}
            disabled={cancelState.status === "working"}
          >
            Keep membership
          </button>
        </div>
      </div>
    );
  }

  if (step === "ended") {
    return (
      <div className="prf-page">
        {header("Subscription Status")}

        <div className="prf-body">
          <div className="ms-ending">
            <p className="ms-ending-head">Membership ending</p>
            <h2>Ending on {formatDate(endsOn)}</h2>
            <p>
              You can continue utilizing your premium member rates and earning coins until this
              date.
            </p>
          </div>

          <div className="ms-reactivate">
            <b>Changed your mind?</b>
            <p>Reactivate at any time to preserve your billing cycle and continuous savings.</p>
          </div>

          {reactivateState.status === "error" && (
            <p className="ms-error" role="alert">{reactivateState.message}</p>
          )}

          <button
            type="button"
            className="ms-btn ms-btn--teal"
            disabled={reactivateState.status === "working"}
            onClick={reactivate}
          >
            {reactivateState.status === "working" ? "Reactivating…" : "Reactivate membership"}
          </button>
        </div>

        <ClubpassUserContext.Provider
          value={{ userName, user, profile: session?.user ?? null, setUser }}
        >
          <SubscribeModal
            open={resubscribeOpen}
            onClose={() => {
              setResubscribeOpen(false);
              // Paying again puts them back on a live membership.
              if (isPaid(user)) navigate("/profile");
            }}
            withUpsell
          />
        </ClubpassUserContext.Provider>
      </div>
    );
  }

  return (
    <div className="prf-page">
      {header("Manage Subscription")}

      <div className="prf-body">
        <div className="ms-plan">
          <p className="ms-plan-head">Current plan</p>

          <div className="ms-plan-row">
            <b className="ms-plan-name">{PLAN_NAME}</b>
            <b className="ms-plan-price">${PLAN_PRICE}/mo</b>
          </div>

          <dl className="ms-facts">
            <div>
              <dt>Next Billing Date</dt>
              <dd>{formatDate(user?.nextBillingOn)}</dd>
            </div>
            <div>
              <dt>Payment Method</dt>
              <dd>{METHOD_LABELS[user?.payMethod] ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <button type="button" className="ms-cancel-link" onClick={() => setStep("cancel")}>
          Cancel membership
        </button>
      </div>
    </div>
  );
}

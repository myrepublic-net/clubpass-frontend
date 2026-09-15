import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ArrowLeft, Check } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import UserMenu from "../components/UserMenu.jsx";
import "../css/profile.css";

const PERKS = [
  "Save 30% on all ticket bookings",
  "Earn 3X R Coins on check-ins",
  "Unlimited free Clarke Quay express rides",
];

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
 * What the membership is doing, in the member's terms. Same three states
 * MemberDashboard collapses billingStatus into.
 */
function membershipStatus(user, paid) {
  if (!paid) return "Free account";

  switch (user?.billingStatus) {
    case "cancelled":
      return "Cancelled";
    case "lapsed":
      return "Payment issue";
    default:
      return "Active member";
  }
}

/** Reached from the account menu in any header. */
export default function Profile() {
  const navigate = useNavigate();
  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!session?.user?.username) return;

    let cancelled = false;
    resolveClubpassUser(session.user).then(
      (record) => { if (!cancelled) setUser(record); },
      (error) => { console.error("ClubPass user lookup failed", error); },
    );
    return () => { cancelled = true; };
  }, [session]);

  // Nothing to show without an account.
  if (!userName) return <Navigate to="/login" state={{ from: "/profile" }} replace />;

  const paid = isPaid(user);
  const status = membershipStatus(user, paid);

  return (
    <div className="prf-page">
      <header className="prf-header">
        <button
          type="button"
          className="prf-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1>My Membership</h1>
        <UserMenu userName={userName} />
      </header>

      <div className="prf-body">
        <div className={`prf-card${paid ? " is-member" : ""}`}>
          <div>
            <b className="prf-name">{userName}</b>
            <span className="prf-id">ID: {user?.documentId ? `CP-${user.documentId}` : "—"}</span>
          </div>
          <span className="prf-status">{status}</span>
        </div>

        <div className="prf-stats">
          <div className="prf-stat">
            <span>R Coin Balance</span>
            {/* No balance is stored anywhere yet — see the note in the PR. */}
            <b className="prf-coins">—</b>
          </div>
          <div className="prf-stat">
            <span>Next Renewal</span>
            <b>{formatDate(user?.nextBillingOn)}</b>
          </div>
        </div>

        <h2 className="prf-perks-head">Your Premium Perks</h2>
        <ul className="prf-perks">
          {PERKS.map((perk) => (
            <li key={perk}>
              <Check size={18} />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <Link className="prf-manage" to="/clubpass-app">
          {paid ? "Manage subscription" : "Become a member"}
        </Link>
      </div>
    </div>
  );
}

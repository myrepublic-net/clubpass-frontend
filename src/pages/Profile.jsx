import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";

import { fetchPointsBalance, readMemberSession } from "../api/auth.js";
import { isPaid, resolveClubpassUser } from "../api/clubpassUser.js";
import RCoinsSheet from "../components/RCoinsSheet.jsx";
import SubscribeModal from "../components/SubscribeModal.jsx";
import UserMenu from "../components/UserMenu.jsx";
import { ClubpassUserContext } from "../components/clubpassUserContext.js";
import "../css/profile.css";

/** `lead` is the part the design picks out in teal. */
const PERKS = [
  { lead: "", text: "Up to 50% off all tickets" },
  { lead: "3X R Coins Multiplier" },
  { lead: "", text: "Access to Clubpass Home Express" },
  { lead: "", text: "Free Entry tickets for selected events " },
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
    case "suspended":
      return "Payment issue";
    default:
      return "CLUBPASS MEMBER";
  }
}

/** Reached from the account menu in any header. */
export default function Profile() {
  const navigate = useNavigate();
  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState({ status: "loading", balance: null });

  // Joining happens in the same sheet the home page uses, rather than sending
  // anyone off to another screen. It reads its member off context, which this
  // page isn't inside, so that's supplied around the sheet below.
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [coinsSheetOpen, setCoinsSheetOpen] = useState(false);

  const subscribeUser = useMemo(
    () => ({ userName: userName ?? "", user, profile: session?.user ?? null, setUser }),
    [userName, user, session],
  );

  useEffect(() => {
    if (!session?.user?.username) return;

    let cancelled = false;
    resolveClubpassUser(session.user).then(
      (record) => { if (!cancelled) setUser(record); },
      (error) => { console.error("ClubPass user lookup failed", error); },
    );
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (!session?.user?.username) return;

    let cancelled = false;
    fetchPointsBalance().then(
      (balance) => { if (!cancelled) setCoins({ status: "ready", balance }); },
      (error) => {
        console.error("R Coin balance failed to load", error);
        if (!cancelled) setCoins({ status: "error", balance: null });
      },
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
        <h1>My Account</h1>
        <UserMenu userName={userName} />
      </header>

      <div className="prf-body">
        <div className="prf-in-text">
        <div className="prf-card">
          <div>
            <b className="prf-name">{userName}</b>
            <span className="prf-id">ID: {user?.documentId ? `CP-${user.documentId}` : "—"}</span>
          </div>
          <span className="prf-status">{status}</span>
        </div>

        <div className="prf-stats">
          {/* Opens the same "Redeem Your R Coins" sheet as Order Confirmed. */}
          <button
            type="button"
            className="prf-stat prf-stat--coins"
            onClick={() => setCoinsSheetOpen(true)}
          >
            <span className="prf-stat-label">R Coin Balance</span>
            <b className="prf-coins">
              {coins.status === "loading" ? (
                "…"
              ) : coins.balance == null ? (
                "—"
              ) : (
                <>
                  {coins.balance.toLocaleString()} <i>R Coins</i>
                </>
              )}
            </b>
            <ChevronRight className="prf-stat-chevron" size={22} />
          </button>

          <div className="prf-stat prf-stat--renewal">
            {/* A cancelled membership doesn't renew — it runs to the end of the paid period. */}
            <span className="prf-stat-label">
              {user?.billingStatus === "cancelled" ? "Access Ends" : "Next Renewal"}
            </span>
            <b>
              {formatDate(user?.billingStatus === "cancelled" ? user?.accessEndsOn : user?.nextBillingOn)}
            </b>
          </div>
        </div>

        <h2 className="prf-perks-head">Clubpass Membership Perks</h2>
        <ul className="prf-perks">
          {PERKS.map((perk) => (
            <li key={perk.lead + perk.text}>
              <span className="prf-tick" aria-hidden="true">
                <Check size={12} strokeWidth={3.5} />
              </span>
              <span>
                {perk.lead && <b>{perk.lead}</b>}
                {perk.text}
              </span>
            </li>
          ))}
        </ul>

        <Link className="prf-explore" to="/#venues">
          Explore events
        </Link>

        {paid ? (
          <Link className="prf-manage" to="/membership">
            Manage subscription
          </Link>
        ) : (
          <button
            type="button"
            className="prf-manage"
            onClick={() => setSubscribeOpen(true)}
          >
            Become a member
          </button>
        )}
        </div>
        <div className="prf-in-image">
          <img src="/images/account.png"/>
        </div>
      </div>

      <RCoinsSheet open={coinsSheetOpen} onClose={() => setCoinsSheetOpen(false)} />

      <ClubpassUserContext.Provider value={subscribeUser}>
        <SubscribeModal
          open={subscribeOpen}
          onClose={() => setSubscribeOpen(false)}
          withUpsell
        />
      </ClubpassUserContext.Provider>
    </div>
  );
}

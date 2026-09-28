import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import { readMemberSession } from "../api/auth.js";
import SiteFooter from "./SiteFooter.jsx";
import UserMenu from "./UserMenu.jsx";
import "../css/terms.css";

/**
 * The shell both legal pages share: one header (Clubpass logo home, account
 * menu or login), and a body that opens with a back button, the title and the
 * last-updated date.
 */
export default function LegalPage({ title, pageTitle, lastUpdated, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useMemo(() => readMemberSession(), []);
  const userName = session?.user?.username ?? null;

  // Back to wherever they came from; straight in from a link, back to Clubpass.
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="tc-page">
      <title>{pageTitle}</title>

      <header className="tc-header">
        <Link className="tc-brand" to="/" aria-label="Clubpass home">
          <img src="/images/cp-logo.png" alt="Clubpass" />
        </Link>

        {userName ? (
          <UserMenu userName={userName} />
        ) : (
          <Link className="tc-login" to="/login" state={{ from: location.pathname }}>
            Login / Signup
          </Link>
        )}
      </header>

      <main className="tc-body">
        <button type="button" className="tc-back" onClick={goBack}>
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="tc-intro">
          <p className="tc-kicker">Clubpass</p>
          <h1>{title}</h1>
          {lastUpdated && <p className="tc-updated">Last Updated: {lastUpdated}</p>}
        </div>

        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * Renders legal copy written as data: `p` a paragraph, `list` a bulleted list,
 * `clause` a numbered clause ("1.1 …"), `points` indented labelled items
 * ("(i) …"), `sub` a numbered sub-heading with its own blocks, `penalties` a
 * two-column table.
 */
export function LegalBlocks({ blocks }) {
  return blocks.map((block, index) => {
    if (block.sub) {
      return (
        <div key={block.sub} className="tc-sub">
          <h3>{block.sub}</h3>
          <LegalBlocks blocks={block.blocks} />
        </div>
      );
    }

    if (block.clause) {
      return (
        <p key={block.clause} className="tc-clause">
          <span className="tc-clause-num">{block.clause}</span>
          <span>{block.text}</span>
        </p>
      );
    }

    if (block.points) {
      return (
        <div key={index} className="tc-points">
          {block.points.map(([label, text]) => (
            <p key={label} className="tc-clause">
              <span className="tc-clause-num">{label}</span>
              <span>{text}</span>
            </p>
          ))}
        </div>
      );
    }

    if (block.list) {
      return (
        <ul key={index} className="tc-list">
          {block.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    }

    if (block.penalties) {
      return (
        <dl key={index} className="tc-penalties">
          {block.penalties.map(([offence, penalty]) => (
            <div key={offence}>
              <dt>{offence}</dt>
              <dd>{penalty}</dd>
            </div>
          ))}
        </dl>
      );
    }

    return <p key={index}>{block.p}</p>;
  });
}

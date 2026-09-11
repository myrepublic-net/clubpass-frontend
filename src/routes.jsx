import { createBrowserRouter } from "react-router";
// ClubPass.jsx is kept in the folder but is not routed for now.
import ClubPass from "./pages/ClubPass.jsx";
import ClubpassNew from "./pages/ClubpassNew.jsx";
import ClubPassApp from "./pages/ClubPassApp.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import EventTickets from "./pages/EventTickets.jsx";
import ScanConfirm from "./pages/ScanConfirm.jsx";
import DriverScan from "./pages/DriverScan.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import UserGate from "./components/UserGate.jsx";
import NotFound from "./pages/NotFound.jsx";

const router = createBrowserRouter([
  { path: "/", element: <ClubPass /> },
  // { path: "/test", element: <ClubpassNew /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  // Where a scanned boarding QR lands. Deliberately outside UserGate — the
  // driver opening it is not the member, and carries no ?userName= of their own.
  { path: "/scan", element: <ScanConfirm /> },
  // The driver's own console: sign in once per shift, then scan passes with the
  // phone camera without leaving the page. No UserGate — a driver has no member login.
  { path: "/driver", element: <DriverScan /> },
  // A venue card's "View event details" link. Public like ClubPass.jsx itself —
  // a guest can preview an event before joining, so it's not wrapped in
  // UserGate; the page reads the session itself to show "Hi, {name}" vs a
  // Login / Signup prompt in its own header.
  { path: "/events/:id", element: <EventDetails /> },
  // The event's "Get Tickets Now" CTA. Also public — a guest can pick Early
  // Bird tickets, they just don't get the Member Price tier or the real R
  // Coins rate until they sign up / pay.
  { path: "/events/:id/tickets", element: <EventTickets /> },
  // Only the in-app landing is gated on ?userName= — the public pages stay open.
  {
    path: "/clubpass-app",
    element: (
      <UserGate>
        <ClubPassApp />
      </UserGate>
    ),
  },
  // Where every login now lands — separate from /clubpass-app (the Home
  // Express sales/member page above), which is untouched and still reachable
  // directly.
  {
    path: "/dashboard",
    element: (
      <UserGate>
        <Dashboard />
      </UserGate>
    ),
  },
  // Catch-all, last: anything the routes above didn't claim. Without it a bad
  // URL renders React Router's own error screen, which talks about routing
  // rather than to the person reading it.
  { path: "*", element: <NotFound /> },
]);

export default router;

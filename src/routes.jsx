import { createBrowserRouter } from "react-router";
// ClubPass.jsx is kept in the folder but is not routed for now.
import ClubPass from "./pages/ClubPass.jsx";
import ClubpassNew from "./pages/ClubpassNew.jsx";
import ClubPassApp from "./pages/ClubPassApp.jsx";
import ScanConfirm from "./pages/ScanConfirm.jsx";
import DriverScan from "./pages/DriverScan.jsx";
import UserGate from "./components/UserGate.jsx";
import NotFound from "./pages/NotFound.jsx";

const router = createBrowserRouter([
  { path: "/", element: <ClubPass /> },
  // { path: "/test", element: <ClubpassNew /> },
  // Where a scanned boarding QR lands. Deliberately outside UserGate — the
  // driver opening it is not the member, and carries no ?userName= of their own.
  { path: "/scan", element: <ScanConfirm /> },
  // The driver's own console: sign in once per shift, then scan passes with the
  // phone camera without leaving the page. No UserGate — a driver has no rr_sso.
  { path: "/driver", element: <DriverScan /> },
  // Only the in-app landing is gated on ?userName= — the public pages stay open.
  {
    path: "/clubpass-app",
    element: (
      <UserGate>
        <ClubPassApp />
      </UserGate>
    ),
  },
  // Catch-all, last: anything the routes above didn't claim. Without it a bad
  // URL renders React Router's own error screen, which talks about routing
  // rather than to the person reading it.
  { path: "*", element: <NotFound /> },
]);

export default router;

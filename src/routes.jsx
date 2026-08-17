import { createBrowserRouter } from "react-router";
// ClubPass.jsx is kept in the folder but is not routed for now.
import ClubPass from "./pages/ClubPass.jsx";
import ClubpassNew from "./pages/ClubpassNew.jsx";
import ClubPassApp from "./pages/ClubPassApp.jsx";
import ScanConfirm from "./pages/ScanConfirm.jsx";
import UserGate from "./components/UserGate.jsx";

const router = createBrowserRouter([
  { path: "/", element: <ClubPass /> },
  { path: "/test", element: <ClubpassNew /> },
  // Where a scanned boarding QR lands. Deliberately outside UserGate — the
  // driver opening it is not the member, and carries no ?userName= of their own.
  { path: "/scan", element: <ScanConfirm /> },
  // Only the in-app landing is gated on ?userName= — the public pages stay open.
  {
    path: "/clubpass-app",
    element: (
      <UserGate>
        <ClubPassApp />
      </UserGate>
    ),
  },
]);

export default router;

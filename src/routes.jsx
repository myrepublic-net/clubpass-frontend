import { createBrowserRouter } from "react-router";
// ClubPass.jsx is kept in the folder but is not routed for now.
import ClubPass from "./pages/ClubPass.jsx";
import ClubpassNew from "./pages/ClubpassNew.jsx";
import ClubPassApp from "./pages/ClubPassApp.jsx";

const router = createBrowserRouter([
  { path: "/", element: <ClubPass /> },
  { path: "/test", element: <ClubpassNew /> },
  { path: "/clubpass-app", element: <ClubPassApp /> },
]);

export default router;

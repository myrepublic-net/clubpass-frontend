import { createBrowserRouter } from "react-router";
import ClubPass from "./pages/ClubPass.jsx";
import ClubPassApp from "./pages/ClubPassApp.jsx";

const router = createBrowserRouter([
  { path: "/", element: <ClubPass /> },
  { path: "/clubpass-app", element: <ClubPassApp /> },
]);

export default router;

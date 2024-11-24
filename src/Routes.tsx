import { Routes, Route } from "react-router";

import AuthenticatedLayout from "./components/layouts/Authenticated";
import UnauthenticatedLayout from "./components/layouts/Unauthenticated";
import Dashboard from "./components/pages/Dashboard/Dashboard";
import About from "./components/pages/About/About";
import Identify from "./components/pages/LoggedOut/Identify";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthenticatedLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="about" element={<About />} />
      </Route>

      <Route element={<UnauthenticatedLayout />}>
        <Route path="login" element={<Identify />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;

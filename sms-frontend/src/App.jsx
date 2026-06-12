import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* =========================
   AUTH PAGES
========================= */

import SignIn from "./pages/SignIn";
import Signup from "./pages/Signup";

/* =========================
   CLIENT PAGES
========================= */

import ClientDashboard from "./pages/ClientDashboard";
import ClientAnalytics from "./pages/ClientAnalytics";
import ClientScheduler from "./pages/ClientScheduler";
import ClientSettings from "./pages/ClientSettings";

/* =========================
   SMH PAGES
========================= */

import SMHDashboard from "./pages/SMHDashboard";
import SMHClients from "./pages/SMHClients";
import SMHAnalytics from "./pages/SMHAnalytics";
import SMHScheduler from "./pages/SMHScheduler";
import SMHSettings from "./pages/SMHSettings";

/* =========================
   EXTRA PAGES
========================= */

import OAuthCallback from "./pages/OAuthCallback";
import AIHashtagGenerator from "./pages/AIHashtagGenerator";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* =========================
            DEFAULT ROUTE
        ========================= */}

        <Route
          path="/"
          element={<Navigate to="/sign-in" replace />}
        />

        {/* =========================
            AUTHENTICATION
        ========================= */}

        <Route
          path="/sign-in"
          element={<SignIn />}
        />

        <Route
          path="/sign-up"
          element={<Signup />}
        />

        {/* =========================
            CLIENT DASHBOARD
        ========================= */}

        <Route
          path="/dashboard"
          element={<ClientDashboard />}
        />

        <Route
          path="/analytics"
          element={<ClientAnalytics />}
        />

        <Route
          path="/scheduler"
          element={<ClientScheduler />}
        />

        <Route
          path="/settings"
          element={<ClientSettings />}
        />

        {/* =========================
            OAUTH CALLBACK
        ========================= */}

        <Route
          path="/oauth/callback"
          element={<OAuthCallback />}
        />

        {/* =========================
            SMH DASHBOARD
        ========================= */}

        <Route
          path="/smh-dashboard"
          element={<SMHDashboard />}
        />

        <Route
          path="/smh-clients"
          element={<SMHClients />}
        />

        <Route
          path="/smh-analytics"
          element={<SMHAnalytics />}
        />

        <Route
          path="/smh-scheduler"
          element={<SMHScheduler />}
        />

        <Route
          path="/smh-settings"
          element={<SMHSettings />}
        />

        {/* =========================
            EXTRA TOOLS
        ========================= */}

        <Route
          path="/ai-hashtag-generator"
          element={<AIHashtagGenerator />}
        />

        {/* =========================
            UNKNOWN ROUTES
        ========================= */}

        <Route
          path="*"
          element={<Navigate to="/sign-in" replace />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;
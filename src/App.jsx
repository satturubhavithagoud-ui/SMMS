import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/Signup';
import ClientDashboard from './pages/ClientDashboard';
import ClientAnalytics from './pages/ClientAnalytics';
import ClientScheduler from './pages/ClientScheduler';
import SMHDashboard from './pages/SMHDashboard';
import SMHClients from './pages/SMHClients';
import SMHAnalytics from './pages/SMHAnalytics';
import SMHScheduler from './pages/SMHScheduler';
import SMHContentQueue from './pages/SMHContentQueue';
import SMHAIStudio from './pages/SMHAIStudio';
import SMHSettings from './pages/SMHSettings';
import ClientSettings from './pages/ClientSettings';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        
        {/* Client Portal Flow */}
        <Route path="/dashboard" element={<ClientDashboard />} />
        <Route path="/analytics" element={<ClientAnalytics />} />
        <Route path="/scheduler" element={<ClientScheduler />} />
        <Route path="/settings" element={<ClientSettings />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        {/* SMH Portal Flow (Accessible via URL) */}
        <Route path="/smh-dashboard" element={<SMHDashboard />} />
        <Route path="/smh-clients" element={<SMHClients />} />
        <Route path="/smh-analytics" element={<SMHAnalytics />} />
        <Route path="/smh-scheduler" element={<SMHScheduler />} />
        <Route path="/smh-content-queue" element={<SMHContentQueue />} />
        <Route path="/smh-ai-studio" element={<SMHAIStudio />} />
        <Route path="/smh-settings" element={<SMHSettings />} />
        
        {/* Redirect unknown to sign-in */}
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

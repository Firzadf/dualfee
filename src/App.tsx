import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteLayout from './layouts/SiteLayout';
import AppShell from './layouts/AppShell';
import Landing from './pages/Landing';

const FeeLab = lazy(() => import('./pages/FeeLab'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Deploy = lazy(() => import('./pages/Deploy'));
const History = lazy(() => import('./pages/History'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Convert = lazy(() => import('./pages/Convert'));
const Verify = lazy(() => import('./pages/Verify'));
const Docs = lazy(() => import('./pages/Docs'));
const Judges = lazy(() => import('./pages/Judges'));

/** Old v0.1 paths keep working (query string preserved). */
function Legacy({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={to + search} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/judges" element={<Judges />} />
      </Route>
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="/app/lab" replace />} />
        <Route path="lab" element={<FeeLab />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="history" element={<History />} />
        <Route path="calculator" element={<Calculator />} />
        <Route path="convert" element={<Convert />} />
        <Route path="deploy" element={<Deploy />} />
        <Route path="verify" element={<Verify />} />
        <Route path="*" element={<Navigate to="/app/lab" replace />} />
      </Route>
      <Route path="/lab" element={<Legacy to="/app/lab" />} />
      <Route path="/leaderboard" element={<Legacy to="/app/leaderboard" />} />
      <Route path="/deploy" element={<Legacy to="/app/deploy" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import FeeLab from './pages/FeeLab';
import Leaderboard from './pages/Leaderboard';
import Deploy from './pages/Deploy';
import Judges from './pages/Judges';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/lab" element={<FeeLab />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/deploy" element={<Deploy />} />
        <Route path="/judges" element={<Judges />} />
        <Route path="*" element={<Landing />} />
      </Route>
    </Routes>
  );
}

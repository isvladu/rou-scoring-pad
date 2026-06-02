import { Navigate, Route, Routes } from 'react-router-dom';
import i18n from '../../core/i18n';
import en from './i18n/en.json';
import ro from './i18n/ro.json';
import RemiHomeScreen from './ui/screens/RemiHomeScreen';
import NewGameScreen from './ui/screens/NewGameScreen';
import GameScreen from './ui/screens/GameScreen';
import HandEntryScreen from './ui/screens/HandEntryScreen';
import GameSummaryScreen from './ui/screens/GameSummaryScreen';

// Register the remi namespace at module-eval time. Because this module is
// loaded via React.lazy from App.tsx, both the JSON and the namespace
// registration end up in the per-game chunk — not the initial bundle.
i18n.addResourceBundle('en', 'remi', en, true, true);
i18n.addResourceBundle('ro', 'remi', ro, true, true);

export default function RemiApp() {
  return (
    <Routes>
      <Route index element={<RemiHomeScreen />} />
      <Route path="new" element={<NewGameScreen />} />
      <Route path="game/:id" element={<GameScreen />} />
      <Route path="game/:id/hand" element={<HandEntryScreen />} />
      <Route path="game/:id/summary" element={<GameSummaryScreen />} />
      <Route path="*" element={<Navigate to="/remi" replace />} />
    </Routes>
  );
}

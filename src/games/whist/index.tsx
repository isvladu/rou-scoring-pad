import { Navigate, Route, Routes } from 'react-router-dom';
import i18n from '../../core/i18n';
import en from './i18n/en.json';
import ro from './i18n/ro.json';
import WhistHomeScreen from './ui/screens/WhistHomeScreen';
import NewGameScreen from './ui/screens/NewGameScreen';
import GameScreen from './ui/screens/GameScreen';
import RoundEntryScreen from './ui/screens/RoundEntryScreen';
import GameSummaryScreen from './ui/screens/GameSummaryScreen';

// Register the whist namespace at module-eval time. Because this module
// is loaded via React.lazy from App.tsx, both the JSON and the namespace
// registration end up in the per-game chunk — not the initial bundle.
i18n.addResourceBundle('en', 'whist', en, true, true);
i18n.addResourceBundle('ro', 'whist', ro, true, true);

export default function WhistApp() {
  return (
    <Routes>
      <Route index element={<WhistHomeScreen />} />
      <Route path="new" element={<NewGameScreen />} />
      <Route path="game/:id" element={<GameScreen />} />
      <Route path="game/:id/round" element={<RoundEntryScreen />} />
      <Route path="game/:id/summary" element={<GameSummaryScreen />} />
      <Route path="*" element={<Navigate to="/whist" replace />} />
    </Routes>
  );
}

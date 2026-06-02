import { Navigate, Route, Routes } from 'react-router-dom';
import i18n from '../../core/i18n';
import en from './i18n/en.json';
import ro from './i18n/ro.json';
import Phase10HomeScreen from './ui/screens/Phase10HomeScreen';
import NewGameScreen from './ui/screens/NewGameScreen';
import GameScreen from './ui/screens/GameScreen';
import HandEntryScreen from './ui/screens/HandEntryScreen';
import GameSummaryScreen from './ui/screens/GameSummaryScreen';

// Register the phase10 namespace at module-eval time. Because this module
// is loaded via React.lazy from App.tsx, both the JSON and the namespace
// registration end up in the per-game chunk — not the initial bundle.
i18n.addResourceBundle('en', 'phase10', en, true, true);
i18n.addResourceBundle('ro', 'phase10', ro, true, true);

export default function Phase10App() {
  return (
    <Routes>
      <Route index element={<Phase10HomeScreen />} />
      <Route path="new" element={<NewGameScreen />} />
      <Route path="game/:id" element={<GameScreen />} />
      <Route path="game/:id/hand" element={<HandEntryScreen />} />
      <Route path="game/:id/summary" element={<GameSummaryScreen />} />
      <Route path="*" element={<Navigate to="/phase10" replace />} />
    </Routes>
  );
}

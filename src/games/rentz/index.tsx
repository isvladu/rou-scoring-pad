import { Navigate, Route, Routes } from 'react-router-dom';
import i18n from '../../core/i18n';
import en from './i18n/en.json';
import ro from './i18n/ro.json';
import RentzHomeScreen from './ui/screens/RentzHomeScreen';
import NewGameScreen from './ui/screens/NewGameScreen';
import GameScreen from './ui/screens/GameScreen';
import ContractPickerScreen from './ui/screens/ContractPickerScreen';
import RentzCheckScreen from './ui/screens/RentzCheckScreen';
import RoundEntryScreen from './ui/screens/RoundEntryScreen';
import GameSummaryScreen from './ui/screens/GameSummaryScreen';

// Register the rentz namespace at module-eval time. Because this module
// is loaded via React.lazy from App.tsx, both the JSON and the namespace
// registration end up in the per-game chunk — not the initial bundle.
i18n.addResourceBundle('en', 'rentz', en, true, true);
i18n.addResourceBundle('ro', 'rentz', ro, true, true);

export default function RentzApp() {
  return (
    <Routes>
      <Route index element={<RentzHomeScreen />} />
      <Route path="new" element={<NewGameScreen />} />
      <Route path="game/:id" element={<GameScreen />} />
      <Route path="game/:id/pick" element={<ContractPickerScreen />} />
      <Route path="game/:id/rentz-check" element={<RentzCheckScreen />} />
      <Route path="game/:id/round/:contract" element={<RoundEntryScreen />} />
      <Route path="game/:id/summary" element={<GameSummaryScreen />} />
      <Route path="*" element={<Navigate to="/rentz" replace />} />
    </Routes>
  );
}

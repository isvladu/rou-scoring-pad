import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerSW } from "virtual:pwa-register";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import HomeScreen from "./ui/screens/HomeScreen";
import NewGameScreen from "./ui/screens/NewGameScreen";
import GameScreen from "./ui/screens/GameScreen";
import ContractPickerScreen from "./ui/screens/ContractPickerScreen";
import RoundEntryScreen from "./ui/screens/RoundEntryScreen";
import GameSummaryScreen from "./ui/screens/GameSummaryScreen";
import AppHeader from "./ui/components/AppHeader";

function App() {
  const { t } = useTranslation();
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSWRef = useRef<((reload?: boolean) => Promise<void>) | null>(
    null,
  );

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-full flex-col">
        <AppHeader />
        {needRefresh && (
          <div className="flex items-center justify-between gap-2 bg-amber-600 px-4 py-2 text-sm text-white">
            <span>{t("common.updateAvailable")}</span>
            <button
              type="button"
              onClick={() => updateSWRef.current?.(true)}
              className="rounded bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
            >
              {t("common.reload")}
            </button>
          </div>
        )}
        <main className="flex-1 px-4 pb-24 pt-4">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/new" element={<NewGameScreen />} />
            <Route path="/game/:id" element={<GameScreen />} />
            <Route path="/game/:id/pick" element={<ContractPickerScreen />} />
            <Route
              path="/game/:id/round/:contract"
              element={<RoundEntryScreen />}
            />
            <Route path="/game/:id/summary" element={<GameSummaryScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;

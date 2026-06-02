import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AppHeader from './core/components/AppHeader';
import UpdateBanner from './core/components/UpdateBanner';
import HomeScreen from './ui/screens/HomeScreen';

// Each game module is its own chunk: its screens, state store, storage, and
// its i18n namespace JSON ride along, and none of it hits the initial bundle.
const RentzApp = lazy(() => import('./games/rentz'));
const WhistApp = lazy(() => import('./games/whist'));

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-full flex-col">
        <AppHeader />
        <UpdateBanner />
        <main className="flex-1 px-4 pb-24 pt-4">
          <Suspense fallback={<p className="text-center text-slate-400">…</p>}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/rentz/*" element={<RentzApp />} />
              <Route path="/whist/*" element={<WhistApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;

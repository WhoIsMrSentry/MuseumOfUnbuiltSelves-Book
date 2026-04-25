import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';

// MARK: - Lazy-loaded route components keep the initial bundle small.
const Library = lazy(() => import('@/pages/Library'));
const Reader = lazy(() => import('@/pages/Reader'));

function Fallback() {
  return (
    <div className="flex min-h-svh items-center justify-center text-[var(--muted)]">
      <LoaderCircle size={22} className="animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Router basename="/museum-of-unbuilt-selves/">
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/reader/:bookSlug/:pageSlug" element={<Reader />} />
          <Route path="*" element={<Library />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;


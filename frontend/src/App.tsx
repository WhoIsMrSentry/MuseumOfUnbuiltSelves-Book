import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Library from '@/pages/Library';
import Reader from '@/pages/Reader';

// MARK: - Root App Component

function App() {
  return (
    <Router basename="/mystory/">
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/reader/:bookSlug/:pageSlug" element={<Reader />} />
        <Route path="*" element={<Library />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Merge from './pages/Merge.jsx'; // You'll move your code here
import Split from './pages/Split';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Simple Navbar */}
        <nav className="bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center shadow-sm sticky top-0 z-50">
          <Link to="/" className="text-xl font-black tracking-tighter">
            I Don't Like  <span className="text-red-600">ILovePDF 💔</span>
          </Link>
          <div className="space-x-6 text-sm font-medium text-gray-600">
            <Link to="/merge" className="hover:text-red-600">Merge</Link>
            <Link to="/split" className="hover:text-red-600">Split</Link>
          </div>
        </nav>

        {/* Dynamic Page Content */}
        <main className="grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<Merge />} />
            <Route path="/split" element={<Split />} />
          </Routes>
        </main>

        <footer className="py-8 text-center text-gray-400 text-xs border-t border-gray-100">
          © 2026 PDF TYPE SHIT • Made with Spite
        </footer>
      </div>
    </Router>
  );
}

export default App;
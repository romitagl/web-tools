import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PdfMerger from './components/PdfMerger';
import CidrCalculator from './components/CidrCalculator';
import CodeFormatter from './components/CodeFormatter';
import Base64Tool from './components/Base64Tool';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app dark">
        <div className="container" id="root">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pdf-merger" element={<PdfMerger />} />
            <Route path="/cidr-calculator" element={<CidrCalculator />} />
            <Route path="/code-formatter" element={<CodeFormatter />} />
            <Route path="/base64-encoder-decoder" element={<Base64Tool />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
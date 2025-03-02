import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PdfMerger from './components/PdfMerger';
import ImageOptimizer from './components/ImageOptimizer';
import CodeFormatter from './components/CodeFormatter';
import ColorConverter from './components/ColorConverter';
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
            <Route path="/image-optimizer" element={<ImageOptimizer />} />
            <Route path="/code-formatter" element={<CodeFormatter />} />
            <Route path="/color-converter" element={<ColorConverter />} />
            <Route path="/base64-encoder-decoder" element={<Base64Tool />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
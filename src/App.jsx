import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Canonical from './components/Canonical';
import './css/main.css';

// Only import Home eagerly for better landing page performance
import Home from './components/Home';

// Lazy load all other components
const PdfMerger = lazy(() => import('./components/PdfMerger'));
const QrCodeTool = lazy(() => import('./components/QrCodeTool'));
const CidrCalculator = lazy(() => import('./components/CidrCalculator'));
const CodeFormatter = lazy(() => import('./components/CodeFormatter'));
const Base64Tool = lazy(() => import('./components/Base64Tool'));
const WebsiteScraper = lazy(() => import('./components/WebsiteScraper'));
const VideoSpeedController = lazy(() => import('./components/VideoSpeedController'));

// Create a loading component for better user experience
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading tool...</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app dark">
        <div className="container" id="root">
        <Canonical /> {/* Add this line */}
          <Routes>
            {/* Home is not lazy loaded for better initial performance */}
            <Route path="/" element={<Home />} />
            
            {/* All other routes use lazy loading */}
            <Route path="/pdf-merger" element={
              <Suspense fallback={<LoadingFallback />}>
                <PdfMerger />
              </Suspense>
            } />
            <Route path="/qr-code-tool" element={
              <Suspense fallback={<LoadingFallback />}>
                <QrCodeTool />
              </Suspense>
            } />
            <Route path="/cidr-calculator" element={
              <Suspense fallback={<LoadingFallback />}>
                <CidrCalculator />
              </Suspense>
            } />
            <Route path="/code-formatter" element={
              <Suspense fallback={<LoadingFallback />}>
                <CodeFormatter />
              </Suspense>
            } />
            <Route path="/base64-encoder-decoder" element={
              <Suspense fallback={<LoadingFallback />}>
                <Base64Tool />
              </Suspense>
            } />
            <Route path="/website-scraper" element={
              <Suspense fallback={<LoadingFallback />}>
                <WebsiteScraper />
              </Suspense>
            } />
            <Route path="/video-speed-controller" element={
              <Suspense fallback={<LoadingFallback />}>
                <VideoSpeedController />
              </Suspense>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
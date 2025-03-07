import { Link } from 'react-router-dom';
import { FileText, Image, Code, Palette, FileCode } from 'lucide-react';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';

function Home() {
  return (
    <>
      <div className="header">
        <div className="logo-container">
          <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Web Development Tools</h1>
        <h2>100% Private, 100% Free!</h2>
        <p>All tools run safely and securely in your browser.</p>
      </div>
      
      <section className="description">
        <p>
          A comprehensive collection of tools to help you with everyday development tasks.
        </p>
      </section>
      
      <section id="tools" className="tools-section">
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon">
              <FileText size={40} color="lightblue" />
            </div>
            <h2>PDF Merger</h2>
            <p>Quickly combine multiple PDF files into a single document. Perfect for merging documentation, reports, or reference materials.</p>
            <Link to="/pdf-merger" className="tool-link">
              Merge PDF and images instantly
            </Link>
          </div>
          
          <div className="tool-card">
            <div className="tool-icon">
              <Image size={40} color="lightblue" />
            </div>
            <h2>CIDR Calculator</h2>
            <p>Fast and simple subnet calculator for network engineers and administrators. Calculate network addresses, broadcast addresses, and IP ranges effortlessly.</p>
            <Link to="/cidr-calculator" className="tool-link">
              Try CIDR Calculator
            </Link>
          </div>
          
          <div className="tool-card">
            <div className="tool-icon">
              <Code size={40} color="lightblue" />
            </div>
            <h2>Code Formatter</h2>
            <p>Instantly format and beautify your code with support for HTML, CSS, JavaScript, and more. Keep your code clean and readable.</p>
            <Link to="/code-formatter" className="tool-link">
              Try Code Formatter
            </Link>
          </div>
        </div>
        
        <hr />
        
        <div className="tools-grid">

          <div className="tool-card">
            <div className="tool-icon">
              <FileCode size={40} color="lightblue" />
            </div>
            <h2>Base64 Encoder/Decoder</h2>
            <p>Encode and decode text or binary data as Base64. Useful for encoding and decoding data for web applications.</p>
            <Link to="/base64-encoder-decoder" className="tool-link">
              Try Base64 Encoder/Decoder
            </Link>
          </div>
        </div>
      </section>
      
      <hr />
      
      <footer>
        <p>
          If you like these tools, please star the repository on{' '}
          <a href="https://github.com/romitagl/web-tools">GitHub</a>&nbsp;
          and consider sponsoring me on GitHub.
        </p>
        <iframe src="https://github.com/sponsors/romitagl/button" title="Sponsor" width="116" height="35" />
      </footer>
    </>
  );
}

export default Home;
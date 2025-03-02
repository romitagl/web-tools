// Base64Tool.jsx
import { Link } from 'react-router-dom';
import { FileCode } from 'lucide-react';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';

function Base64Tool() {
  return (
    <>
      <div className="header">
        <div className="logo-container">
          <Link to="/" className="home-link">
            <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </Link>
        </div>
        <h1>Base64 Encoder/Decoder</h1>
        <h2>100% Private, 100% Free!</h2>
        <p>Runs safely and securely in your browser.</p>
      </div>
      <section className="description">
        <p>
          Encode and decode text or binary data as Base64. Useful for encoding and decoding data for web applications.
        </p>
      </section>
      <hr />
      
      <section className="merge-section">
        <h2 style={{ color: 'lightblue', fontWeight: 'bold' }}>
          <FileCode size={24} /> Coming Soon!
        </h2>
        <p>
          This tool is currently under development. Please check back soon!
        </p>
        <Link to="/" className="merge-button">
          Back to Home
        </Link>
      </section>
      
      <hr />
      <footer>
        <p>
          If you like this tool, please star the repository on{' '}
          <a href="https://github.com/romitagl/web-tools">GitHub</a>&nbsp;
          and consider sponsoring me on GitHub.
        </p>
        <iframe src="https://github.com/sponsors/romitagl/button" title="Sponsor" width="116" height="35" />
      </footer>
    </>
  );
}

export default Base64Tool;
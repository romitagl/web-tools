import { Link } from 'react-router-dom';
import { FileText, Network, Code, FileCode, QrCode, Wifi, Smartphone } from 'lucide-react';

function Home() {
  return (
    <>
      <div className="header">
        <div className="header-content">
          <div className="logo-and-title">
            <div className="title-container">
              <h1>Essential Web Tools</h1>
              <h2>100% Free, Private & Secure!</h2>
              <p className="tagline">Your files never leave your device - browser-based processing only.</p>
            </div>
            <div className="site-logo">
              <img src="/images/webtools-logo.svg" alt="WebTools Logo" />
            </div>
          </div>
        </div>
      </div>
      
      <section className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">Powerful Tools for Everyone</h2>
          <p className="hero-description">
            From PDF merging to QR code generation,
            our free tools make your digital life easier without compromising privacy.
          </p>
        </div>
      </section>
      
      <section className="featured-tools">
        <h3 className="featured-title">Most Popular Tools</h3>
        <div className="featured-grid">
          <div className="featured-card">
            <div className="featured-icon">
              <QrCode size={50} color="#4ac0ff" />
            </div>
            <h2>QR Code Generator</h2>
            <p>
              <strong>Perfect for Businesses, Airbnb hosts, restaurants & vacation rentals!</strong> Create scannable 
              WiFi credentials, URLs, contact details, and check-in instructions for your guests.
              No more typing long passwords or writing instructions.
            </p>
            <div className="features-list">
              <span className="feature-badge"><Wifi size={14} /> WiFi Access</span>
              <span className="feature-badge"><Smartphone size={14} /> Contact Info</span>
              <span className="feature-badge">House Rules</span>
              <span className="feature-badge">Local Guides</span>
            </div>
            <Link to="/qr-code-tool" className="primary-button">
              Create Free QR Codes Now
            </Link>
          </div>

          <div className="featured-card">
            <div className="featured-icon">
              <FileText size={50} color="#4ac0ff" />
            </div>
            <h2>PDF & Image Merger</h2>
            <p>
              <strong>Combine multiple PDFs and images instantly!</strong> Perfect for creating 
              documentation, property listings, digital portfolios, or merging scanned documents.
              No file size limits, no uploads, and no data collection.
            </p>
            <div className="features-list">
              <span className="feature-badge">Merge PDFs</span>
              <span className="feature-badge">Convert Images</span>
              <span className="feature-badge">Fast Processing</span>
              <span className="feature-badge">100% Private</span>
            </div>
            <Link to="/pdf-merger" className="primary-button">
              Merge Files Now
            </Link>
          </div>
        </div>
      </section>
      
      <section className="trust-banner">
        <h3>Why Users Trust Our Tools</h3>
        <div className="trust-points">
          <div className="trust-point">
            <span className="trust-icon">🔒</span>
            <span className="trust-text">100% Private: Files never leave your device</span>
          </div>
          <div className="trust-point">
            <span className="trust-icon">⚡</span>
            <span className="trust-text">Lightning Fast: Process in seconds</span>
          </div>
          <div className="trust-point">
            <span className="trust-icon">💯</span>
            <span className="trust-text">Completely Free: No hidden costs</span>
          </div>
          <div className="trust-point">
            <span className="trust-icon">📱</span>
            <span className="trust-text">Works Everywhere: All modern browsers</span>
          </div>
        </div>
      </section>
      
      <section id="tools" className="tools-section">
        <h3 className="tools-category-title">All Available Tools</h3>
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon">
              <QrCode size={40} color="lightblue" />
            </div>
            <h2>QR Code Generator</h2>
            <p>Create scannable QR codes for WiFi, contact info, URLs, and text. Perfect for Airbnb hosts, hotels, and vacation rentals.</p>
            <Link to="/qr-code-tool" className="tool-link">
              Create QR Codes Now
            </Link>
          </div>

          <div className="tool-card">
            <div className="tool-icon">
              <FileText size={40} color="lightblue" />
            </div>
            <h2>PDF Merger</h2>
            <p>Combine multiple PDFs and images into a single document. Great for creating comprehensive documentation and presentations.</p>
            <Link to="/pdf-merger" className="tool-link">
              Merge Files Now
            </Link>
          </div>

          <div className="tool-card">
            <div className="tool-icon">
              <Network size={40} color="lightblue" />
            </div>
            <h2>CIDR Calculator</h2>
            <p>Calculate network addresses, broadcast addresses, and IP ranges for network planning and troubleshooting.</p>
            <Link to="/cidr-calculator" className="tool-link">
              Open Calculator
            </Link>
          </div>

          <div className="tool-card">
            <div className="tool-icon">
              <Code size={40} color="lightblue" />
            </div>
            <h2>Code Formatter</h2>
            <p>Format and beautify your code with support for HTML, CSS, JavaScript, and other popular languages.</p>
            <Link to="/code-formatter" className="tool-link">
              Format Code
            </Link>
          </div>

          <div className="tool-card">
            <div className="tool-icon">
              <FileCode size={40} color="lightblue" />
            </div>
            <h2>Base64 Encoder/Decoder</h2>
            <p>Convert text or binary data to and from Base64 encoding for web applications and data transfer.</p>
            <Link to="/base64-encoder-decoder" className="tool-link">
              Encode/Decode
            </Link>
          </div>
        </div>
      </section>
      
      <section className="testimonials">
        <h3>What Our Users Say</h3>
        <div className="testimonial-carousel">
          <div className="testimonial">
            <p>"As an Airbnb host, the QR code generator has been a game-changer! Guests love being able to scan for WiFi access instead of typing long passwords."</p>
            <div className="testimonial-author">- Sarah K., Vacation Rental Owner</div>
          </div>
          <div className="testimonial">
            <p>"The PDF merger saved me hours of work when compiling documents for my business. No need to install any software or pay for expensive tools!"</p>
            <div className="testimonial-author">- James T., Small Business Owner</div>
          </div>
        </div>
      </section>
      
      <hr />
      
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h4>About These Tools</h4>
            <p>
              All tools are developed with privacy and security in mind. Your data never leaves your 
              browser - everything is processed locally on your device.
            </p>
          </div>
          <div className="footer-section">
            <h4>Support Development</h4>
            <p>
              If you find these tools useful, please consider supporting their development by starring the 
              repository on <a href="https://github.com/romitagl/web-tools">GitHub</a> or sponsoring the project.
            </p>
            <iframe src="https://github.com/sponsors/romitagl/button" title="Sponsor" width="116" height="35" />
          </div>
        </div>
        <div className="copyright">
          &copy; {new Date().getFullYear()} romitagl.com. All rights reserved.
        </div>
      </footer>
    </>
  );
}

export default Home;
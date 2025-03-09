import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Shared Layout component to provide consistent UI structure for all tools
 * with an improved header design that matches the current app style
 * 
 * @param {Object} props
 * @param {string} props.title - Main title for the tool
 * @param {string} props.subtitle - Subtitle/slogan (optional, defaults to "100% Private, 100% Free!")
 * @param {React.ReactNode} props.description - Description content (optional)
 * @param {React.ReactNode} props.children - Main content of the tool
 * @returns {JSX.Element}
 */
function Layout({ title, subtitle = "100% Private, 100% Free!", description, children }) {
  return (
    <>
      {/* Modern minimalist header */}
      <header className="tool-header">
        <div className="header-back-link">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} className="back-icon" />
            <span>Back to Tools</span>
          </Link>
        </div>
        
        <div className="logo-container">
          <img src="/images/webtools-logo.svg" alt="WebTools Logo" className="header-logo" />
        </div>
        
        <div className="header-titles">
          <h1>{title}</h1>
          {subtitle && <h2>{subtitle}</h2>}
          <p>Runs safely and securely in your browser.</p>
        </div>
      </header>
      
      {description && (
        <section className="description">
          {description}
        </section>
      )}
      
      {children}
      
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

export default Layout;
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** All tool workspaces share chrome; tool state and processing remain in each feature. */
export default function Layout({ title, subtitle = 'Free to use. No account needed.', description, children }) {
  return (
    <main className="tool-workspace" id="main-content" tabIndex={-1}>
      <header className="tool-header">
        <Link to="/" className="back-link"><ArrowLeft size={18} aria-hidden="true" /> All tools</Link>
        <p className="tool-eyebrow">YOUR EVERYDAY BROWSER TOOLKIT</p>
        <h1>{title}</h1>
        {subtitle && <p className="tool-subtitle">{subtitle}</p>}
      </header>
      {description && <section className="description" aria-label="About this tool">{description}</section>}
      {children}
      <footer className="tool-footer">
        <span>Built with curiosity. Shared freely.</span>
        <a href="https://github.com/romitagl/web-tools">Source code ↗</a>
        <a href="https://github.com/sponsors/romitagl">Support the project ↗</a>
      </footer>
    </main>
  );
}

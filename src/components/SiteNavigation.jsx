import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { categories, tools, toolPath } from '../toolCatalog';

/** Persistent desktop sidebar; a disclosure menu on smaller screens. */
export default function SiteNavigation() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    function dismiss(event) {
      if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus(); }
    }
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [open]);

  return (
    <aside className="tools-sidebar">
      <Link className="tools-profile" to="/" onClick={() => setOpen(false)}>
        <span className="tools-avatar" aria-hidden="true">GR</span>
        <strong>Gian Luigi Romita</strong>
        <span>Software, useful ideas,<br />and life in Italy.</span>
      </Link>
      <span className="tools-status"><span aria-hidden="true">●</span> Personal corner of the web</span>
      <button ref={menuButton} className="tools-menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="tools-navigation" onClick={() => setOpen(value => !value)}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav id="tools-navigation" className={`tools-navigation${open ? ' is-open' : ''}`} aria-label="Tool navigation">
        <a href="https://romitagl.com/">Personal homepage <ArrowUpRight size={15} /></a>
        <NavLink to="/" end onClick={() => setOpen(false)}>All tools</NavLink>
        {categories.map(category => (
          <section className="tools-nav-group" key={category.id}>
            <h2>{category.name}</h2>
            {tools.filter(tool => tool.category === category.id).map(tool => (
              <NavLink key={tool.id} to={toolPath(tool)} onClick={() => setOpen(false)}>{tool.name}{tool.experimental && <small>Beta</small>}</NavLink>
            ))}
          </section>
        ))}
        <a href="https://romitagl.com/wiki.html">Wiki & guides <ArrowUpRight size={15} /></a>
        <a href="https://romitagl.com/fitness.html">Rider Fit <ArrowUpRight size={15} /></a>
        <a href="https://romitagl.com/about.html">About & contact <ArrowUpRight size={15} /></a>
      </nav>
      <div className="tools-sidebar-bottom"><span>Alessandria, Italy</span><a href="https://github.com/romitagl/web-tools">View source on GitHub ↗</a></div>
    </aside>
  );
}

import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { categories, tools, toolPath } from '../toolCatalog';

export default function SiteNavigation() {
  const [openPath, setOpenPath] = useState(null);
  const { pathname } = useLocation();
  const open = openPath === pathname;
  return (
    <header className="site-navigation">
      <div className="site-navigation-bar">
        <Link className="site-brand" to="/" onClick={() => setOpenPath(null)}>
          <img src="/images/webtools-logo.svg" alt="" width="38" height="38" />
          <span>Web Tools<small>Free tools. In your browser.</small></span>
        </Link>
        <NavLink to="/" end className="catalog-home" onClick={() => setOpenPath(null)}>All tools</NavLink>
        <button className="catalog-toggle" type="button" aria-expanded={open} aria-controls="tool-menu" onClick={() => setOpenPath(open ? null : pathname)}>
          {open ? <X size={18} /> : <Menu size={18} />} {open ? 'Close menu' : 'Browse tools'}
        </button>
      </div>
      {open && <nav id="tool-menu" className="catalog-menu" aria-label="Tool navigation">
        {categories.map((category) => <div key={category.id}>
          <h2>{category.name}</h2>
          {tools.filter((tool) => tool.category === category.id).map((tool) => <NavLink key={tool.id} to={toolPath(tool)} onClick={() => setOpenPath(null)}>
            {tool.name}{tool.experimental && <small>Beta</small>}
          </NavLink>)}
        </div>)}
      </nav>}
    </header>
  );
}

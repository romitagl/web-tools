import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, FileText, Network, Code, FileCode, QrCode, Globe, Video, Film, Search, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { categories, tools, toolPath } from '../toolCatalog';

const icons = { FileDown, FileText, Network, Code, FileCode, QrCode, Globe, Video, Film };

export default function Home() {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const matchingTools = tools.filter((tool) =>
    (categoryId === 'all' || tool.category === categoryId) &&
    `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <>
      <main className="home-catalog">
        <section className="catalog-hero" aria-labelledby="home-title">
          <div>
            <p className="catalog-eyebrow">YOUR EVERYDAY BROWSER TOOLKIT</p>
            <h1 id="home-title">Essential Web Tools</h1>
            <p className="catalog-lead">Less busywork.<br /><span>More done.</span></p>
            <p className="catalog-intro">Merge and compress PDFs, create GIFs, scan QR codes, and handle development tasks. Find the tool you need and get straight to work.</p>
            <a className="catalog-cta" href="#tools">Explore all {tools.length} tools <ArrowUpRight size={18} /></a>
          </div>
          <aside className="catalog-spotlight" aria-labelledby="spotlight-title">
            <Film size={36} aria-hidden="true" />
            <p className="catalog-eyebrow">IN THE TOOLKIT</p>
            <h2 id="spotlight-title">Images or video.<br />Your next GIF.</h2>
            <p>Choose frames or trim a video clip. Set the timing, preview your animation, and download it locally.</p>
            <Link to="/gif-maker/">Open Animated GIF Maker <ArrowUpRight size={18} /></Link>
          </aside>
        </section>
        <div className="catalog-benefits"><span><ShieldCheck size={18} /> Local file processing</span><span>Free to use</span><span>No account needed</span><span>Open source</span></div>
        <section id="tools" className="catalog-directory" aria-labelledby="directory-title">
          <div className="catalog-directory-heading"><div><p className="catalog-eyebrow">FIND YOUR TOOL</p><h2 id="directory-title">One toolkit. Everyday tasks.</h2></div>
            <label className="catalog-search"><Search size={20} aria-hidden="true" /><span className="catalog-sr-only">Search tools</span><input type="search" placeholder="Search tools or tasks…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          </div>
          <div className="catalog-filters" role="group" aria-label="Filter tools by category">
            {[{ id: 'all', name: 'All tools' }, ...categories].map((category) => <button key={category.id} type="button" aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.name}<span>{tools.filter((tool) => category.id === 'all' || tool.category === category.id).length}</span></button>)}
          </div>
          <p className="catalog-result-count" role="status">{matchingTools.length} {matchingTools.length === 1 ? 'tool' : 'tools'} available{query.trim() && ` for “${query.trim()}”`}</p>
          {categories.map((category) => {
            const group = matchingTools.filter((tool) => tool.category === category.id);
            return group.length > 0 && <section className="catalog-category" key={category.id} aria-labelledby={`category-${category.id}`}>
              <div className="catalog-category-heading"><h3 id={`category-${category.id}`}>{category.name}</h3><p>{category.description}</p></div>
              <div className="catalog-grid">{group.map((tool) => {
                const Icon = icons[tool.icon];
                return <Link className="catalog-card" key={tool.id} to={toolPath(tool)}>
                  <div className="catalog-card-top"><Icon size={26} aria-hidden="true" />{tool.experimental && <span className="catalog-beta">Experimental · Beta</span>}<ArrowUpRight className="catalog-card-arrow" size={19} aria-hidden="true" /></div>
                  <h4>{tool.name}</h4><p>{tool.description}</p><div className="catalog-tags">{tool.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </Link>;
              })}</div>
            </section>;
          })}
          {matchingTools.length === 0 && <div className="catalog-empty"><h3>No tools found</h3><p>Try “PDF”, “video”, or “encode”, or reset your filters.</p><button type="button" onClick={() => { setQuery(''); setCategoryId('all'); }}>Show all tools</button></div>}
        </section>
        <section className="catalog-privacy"><ShieldCheck size={30} aria-hidden="true" /><div><h2>Your files stay with you.</h2><p>File tools process your documents and media on your device. The experimental Website Scraper makes network requests and may use third-party proxies. QR scanning asks for camera access when you choose it.</p></div><a href="https://github.com/romitagl/web-tools">View source on GitHub <ArrowUpRight size={16} /></a></section>
      </main>
      <footer className="catalog-footer"><span>Web Tools · Free browser utilities</span><div><Link to="/">All tools</Link><a href="https://github.com/romitagl/web-tools">GitHub</a><a href="https://github.com/sponsors/romitagl">Sponsor the project</a></div></footer>
    </>
  );
}

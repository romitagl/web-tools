// scripts/generate-html.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSeoData, siteUrl, defaultOgImage } from '../src/seoData.js';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the routes
const routes = [
  '/pdf-merger',
  '/pdf-compressor',
  '/qr-code-tool',
  '/cidr-calculator',
  '/code-formatter',
  '/base64-encoder-decoder',
  '/website-scraper',
  '/video-speed-controller'
];

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function applySeo(indexHTML, route) {
  const seo = getSeoData(route);
  const canonicalUrl = `${siteUrl}${route}`;
  const schemaJson = JSON.stringify(seo.schema);

  return indexHTML
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta name="description"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`)
    .replace(/<meta name="keywords"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`)
    .replace(/<meta property="og:url"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="og:title"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`)
    .replace(/<meta property="og:description"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`)
    .replace(/<meta property="og:image"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta property="og:image" content="${defaultOgImage}" />`)
    .replace(/<meta name="twitter:url"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta name="twitter:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`)
    .replace(/<meta name="twitter:description"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`)
    .replace(/<meta name="twitter:image"[\s\S]*?content="[^"]*"[\s\S]*?\/>/, `<meta name="twitter:image" content="${defaultOgImage}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<script id="route-schema" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="route-schema" type="application/ld+json">${schemaJson}</script>`);
}

// Function to create static HTML files
async function generateStaticHTML() {
  console.log('Generating static HTML files for routes...');
  
  try {
    // Read the template from dist/index.html
    const indexPath = path.resolve(__dirname, '../dist/index.html');
    if (!fs.existsSync(indexPath)) {
      console.error(`Error: ${indexPath} does not exist. Make sure to run this after the build.`);
      process.exit(1);
    }
    
    const indexHTML = fs.readFileSync(indexPath, 'utf8');
    
    // Create directories and copy index.html for each route
    for (const route of routes) {
      console.log(`Processing route: ${route}`);
      
      // Create the directory for the route
      const dirPath = path.resolve(__dirname, `../dist${route}`);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Copy the index.html to the route directory with route-specific SEO
      fs.writeFileSync(path.resolve(dirPath, 'index.html'), applySeo(indexHTML, route));
      console.log(`Created: dist${route}/index.html`);
    }
    
    console.log('Static HTML generation complete!');
  } catch (error) {
    console.error('Error generating static HTML:', error);
    process.exit(1);
  }
}

// Execute the function
generateStaticHTML();

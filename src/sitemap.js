import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';
import fs from 'fs';

const hostname = 'https://romitagl.github.io/web-tools/';

const urls = [
  { url: '/', changefreq: 'daily', priority: 1 }, // Correct: No base path here
  // { url: '/about', changefreq: 'monthly', priority: 0.8 },
  // { url: '/contact', changefreq: 'monthly', priority: 0.8 },
  // Add additional routes here
];

// Create a sitemap stream
const sitemap = new SitemapStream({ hostname });

// Write the sitemap to a file
const writeStream = fs.createWriteStream('./public/sitemap.xml');
sitemap.pipe(writeStream);

// Add URLs to the sitemap
urls.forEach(url => sitemap.write(url));

// End the stream
sitemap.end();

// Optionally, compress the sitemap
streamToPromise(sitemap.pipe(createGzip()))
  .then(() => console.log('Sitemap created successfully!'))
  .catch(console.error);
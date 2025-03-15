// scripts/generate-html.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the routes
const routes = [
  '/pdf-merger',
  '/qr-code-tool',
  '/cidr-calculator',
  '/code-formatter',
  '/base64-encoder-decoder'
];

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
      
      // Copy the index.html to the route directory
      fs.writeFileSync(path.resolve(dirPath, 'index.html'), indexHTML);
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
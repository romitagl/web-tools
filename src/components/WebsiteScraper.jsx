import { useState, useEffect, useRef } from 'react';
import { Globe, Download, AlertCircle, Loader, Info, RefreshCw, Copy, Check, File, StopCircle } from 'lucide-react';
import Layout from './Layout';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function WebsiteScraper() {
  // Component state
  const [url, setUrl] = useState('');
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [scrapedData, setScrapedData] = useState(null);
  const [scrapingStats, setScrapingStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    htmlFiles: 0,
    cssFiles: 0,
    jsFiles: 0,
    imageFiles: 0,
    otherFiles: 0
  });
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [depthLevel, setDepthLevel] = useState(0); // Default to level 0 for better performance
  const [includeCss, setIncludeCss] = useState(true);
  const [includeJs, setIncludeJs] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [logs, setLogs] = useState([]);
  const [isLogVisible, setIsLogVisible] = useState(true); // Default to visible
  const [useImagePlaceholders, setUseImagePlaceholders] = useState(false);
  const [saveOriginalUrls, setSaveOriginalUrls] = useState(true);
  const [corsProxyMethods, setCorsProxyMethods] = useState({
    allorigins: true,  // api.allorigins.win
    corsproxy: true,   // corsproxy.io
    cors: true,        // cors-anywhere.herokuapp.com
    direct: true       // Direct fetch (no proxy)
  });
  const [currentProxy, setCurrentProxy] = useState('direct');
  const [resourceLimit, setResourceLimit] = useState(500); // Maximum number of resources to download
  const [processingDelay, setProcessingDelay] = useState(0); // Delay between requests in ms

  // Add stopScraping ref to control the scraping process
  const stopScrapingRef = useRef(false);

  // Helper function to validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Helper function to get domain from URL
  const getDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return '';
    }
  };

  // Helper function to get file extension
  const getFileExtension = (url) => {
    try {
      const path = new URL(url).pathname;
      const ext = path.split('.').pop().toLowerCase();
      if (ext && ext.length < 5) {
        return ext;
      }
      return '';
    } catch {
      return '';
    }
  };

  // Helper function to check if a URL is likely an image based on extension or path
  const isLikelyImage = (url) => {
    try {
      // Check for image extensions
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
      const ext = getFileExtension(url);

      if (imageExtensions.includes(ext)) {
        return true;
      }

      // Check for image-like paths
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();

      if (path.includes('/images/') ||
        path.includes('/img/') ||
        path.includes('/gallery/') ||
        path.includes('/photos/') ||
        path.includes('/thumbnails/')) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  // Helper function to normalize URLs
  const normalizeUrl = (baseUrl, relativeUrl) => {
    try {
      // Handle data URLs
      if (relativeUrl.startsWith('data:')) {
        return relativeUrl;
      }

      // Handle absolute URLs
      if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
      }

      // Handle protocol-relative URLs (//example.com/path)
      if (relativeUrl.startsWith('//')) {
        const baseUrlObj = new URL(baseUrl);
        return `${baseUrlObj.protocol}${relativeUrl}`;
      }

      // Handle root-relative URLs (/path)
      if (relativeUrl.startsWith('/')) {
        const baseUrlObj = new URL(baseUrl);
        return `${baseUrlObj.origin}${relativeUrl}`;
      }

      // Handle relative URLs (path/file.ext)
      const baseUrlObj = new URL(baseUrl);
      const basePathParts = baseUrlObj.pathname.split('/').filter(Boolean);

      // If the base URL ends with a file, remove it from the path
      if (basePathParts.length > 0 && /\.[a-zA-Z0-9]+$/.test(basePathParts[basePathParts.length - 1])) {
        basePathParts.pop();
      }

      const basePath = basePathParts.length > 0 ? `/${basePathParts.join('/')}/` : '/';
      return `${baseUrlObj.origin}${basePath}${relativeUrl}`;
    } catch (error) {
      console.error("URL normalization error:", error);
      return relativeUrl;
    }
  };

  // Helper function to create a log entry
  const addLog = (message, type = 'info') => {
    setLogs(prevLogs => [...prevLogs, {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Helper function to format byte size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper function to sanitize filenames
  const sanitizeFilename = (filename) => {
    // Remove URL parameters and fragments
    let sanitized = filename.split(/[?#]/)[0];

    // Replace special characters with underscores
    sanitized = sanitized.replace(/[^\w.-]/gi, '_');

    // Ensure it's not empty
    if (!sanitized || sanitized === '_' || sanitized === '.') {
      sanitized = 'file_' + Date.now();
    }

    return sanitized.toLowerCase();
  };

  // Helper function to extract filename from URL
  const getFilenameFromUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      let path = url.pathname;

      // Remove trailing slashes
      path = path.replace(/\/$/, '');

      // Get the last part of the path
      const parts = path.split('/');
      let filename = parts[parts.length - 1];

      // If empty (like in case of domain.com/), use the hostname
      if (!filename) {
        filename = url.hostname;
      }

      return sanitizeFilename(filename);
    } catch (e) {
      console.error('Error extracting filename:', e);
      return 'file_' + Date.now();
    }
  };

  // Helper to create file paths for resources
  const getLocalFilePath = (url, baseUrl, type) => {
    let folderPath = '';
    let extension = '';

    // Determine the folder based on resource type
    switch (type) {
      case 'css':
        folderPath = 'css/';
        extension = '.css';
        break;
      case 'js':
        folderPath = 'js/';
        extension = '.js';
        break;
      case 'image':
        folderPath = 'images/';
        // Get the extension from the URL or default to .jpg
        extension = '.' + (getFileExtension(url) || 'jpg');
        break;
      case 'html':
        // Root folder for HTML
        folderPath = '';
        extension = '.html';
        break;
      default:
        folderPath = 'other/';
        extension = '';
    }

    // Generate a filename based on the URL
    let filename = getFilenameFromUrl(url);

    // Add extension if not already present
    if (!filename.endsWith(extension) && extension) {
      filename += extension;
    }

    // For HTML files, make the main page index.html
    if (type === 'html' && url === baseUrl) {
      return 'index.html';
    }

    // For other HTML files, ensure they have a unique name
    if (type === 'html') {
      // If filename is just the domain with .html, add page- prefix
      if (filename === getDomain(url) + '.html') {
        filename = 'page-' + filename;
      }
    }

    return folderPath + filename;
  };

  // Get a data URI placeholder for an image// Get a better data URI placeholder for an image
  const getImagePlaceholder = (width = 300, height = 200, url = '') => {
    // Try to extract dimensions from filename if available
    if (url && (width === 300 || height === 200)) {
      const dimensionMatch = url.match(/(\d+)x(\d+)/);
      if (dimensionMatch) {
        width = parseInt(dimensionMatch[1]) || width;
        height = parseInt(dimensionMatch[2]) || height;
      }
    }

    // Generate a placeholder that shows the original URL too for debugging
    const fileName = url.split('/').pop() || 'image';
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <rect width="100%" height="100%" fill="url(%23pattern)"/>
    <defs>
      <pattern id="pattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
        <rect width="10" height="10" fill="#e0e0e0"/>
      </pattern>
    </defs>
    <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="#888">Image Unavailable</text>
    <text x="50%" y="70%" font-family="Arial" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="#888">${fileName}</text>
  </svg>`;
  };

  // Function to add delay between requests
  const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Add this function to your component
  const getBrowserLikeHeaders = (url) => {
    const urlObj = new URL(url);
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${urlObj.protocol}//${urlObj.hostname}/`,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Cache-Control': 'max-age=0'
    };
  };

  // Update fetchWithProxies to use these headers
  const fetchWithProxies = async (url, proxyMethods = corsProxyMethods) => {
    // Array of proxy methods to try
    const proxies = [
      { name: 'direct', url: '', enabled: proxyMethods.direct },
      { name: 'corsproxy', url: 'https://corsproxy.io/?', enabled: proxyMethods.corsproxy },
      { name: 'allorigins', url: 'https://api.allorigins.win/raw?url=', enabled: proxyMethods.allorigins },
      { name: 'cors', url: 'https://cors-anywhere.herokuapp.com/', enabled: proxyMethods.cors }
    ].filter(proxy => proxy.enabled);

    // If no proxies are enabled, return error
    if (proxies.length === 0) {
      throw new Error('No CORS proxies enabled. Enable at least one proxy method.');
    }

    let lastError = null;

    // Try each proxy in sequence
    for (const proxy of proxies) {
      try {
        const proxyUrl = proxy.name === 'direct' ? url : proxy.url + encodeURIComponent(url);

        addLog(`Trying ${proxy.name === 'direct' ? 'direct fetch' : proxy.name} for ${url}`);
        setCurrentProxy(proxy.name);

        const headers = getBrowserLikeHeaders(url);

        const response = await fetch(proxyUrl, {
          headers: proxy.name === 'direct' ? headers : {
            'Origin': window.location.origin,
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        addLog(`Success with ${proxy.name}`);
        return response;
      } catch (error) {
        lastError = error;
        addLog(`Failed with ${proxy.name}: ${error.message}`, 'error');
        continue; // Try next proxy
      }
    }

    // If all proxies failed, throw the last error
    throw lastError || new Error('All proxy methods failed');
  };

  // Specialized function for fetching images
  const fetchImage = async (url) => {
    try {
      // Try direct fetch first with headers
      addLog(`Trying direct image fetch for ${url}`);
      const response = await fetch(url, {
        headers: {
          'Referer': new URL(url).origin,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Origin': new URL(url).origin
        }
      });

      if (response.ok) {
        addLog(`Direct image fetch successful for ${url}`, 'success');
        return response;
      }
    } catch (err) {
      addLog(`Direct image fetch failed: ${err.message}`, 'warning');
    }

    // If direct fetch fails, try with CORS proxies
    addLog(`Direct fetches failed, trying proxies for ${url}`);
    return await fetchWithProxies(url, corsProxyMethods);
  };


  // Helper function to process images with fallbacks and retries
  const processImage = async (url, resourceMap, imgFolder, mainUrl, statsRef, retryCount = 0) => {
    try {
      // Determine the filename
      const localPath = getLocalFilePath(url, mainUrl, 'image');

      // Check if we've already processed this image
      if (resourceMap.has(url)) {
        return resourceMap.get(url);
      }

      // Try to fetch the image
      const response = await fetchImage(url);
      const blob = await response.blob();

      // Save the image file
      imgFolder.file(localPath.replace('images/', ''), blob);

      // Save mapping of URL to local path
      resourceMap.set(url, localPath);

      statsRef.imageFiles++;
      statsRef.totalFiles++;
      statsRef.totalSize += blob.size;

      addLog(`Processed Image: ${localPath}`, 'success');
      return localPath;
    } catch (error) {
      // Retry logic with exponential backoff
      const maxRetries = 2; // Maximum number of retries

      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s, etc.
        addLog(`Retrying image (${retryCount + 1}/${maxRetries}) in ${waitTime / 1000}s: ${url}`, 'warning');

        await delay(waitTime);
        return processImage(url, resourceMap, imgFolder, mainUrl, statsRef, retryCount + 1);
      }

      addLog(`Failed to process image ${url}: ${error.message}`, 'error');

      // If placeholders are enabled, use one
      if (useImagePlaceholders) {
        const placeholderPath = getLocalFilePath(url, mainUrl, 'image');
        resourceMap.set(url, placeholderPath);

        // Try to get image dimensions if available
        let width = 300, height = 200;
        const fileParts = url.split('/').pop().split('-');
        if (fileParts.length > 1) {
          // Some sites encode dimensions in filenames like image-800-600.jpg
          for (const part of fileParts) {
            const dimensionMatch = part.match(/^(\d+)x(\d+)$/);
            if (dimensionMatch) {
              width = parseInt(dimensionMatch[1]);
              height = parseInt(dimensionMatch[2]);
              break;
            }
          }
        }

        // Create a placeholder with visual pattern
        const svgContent = getImagePlaceholder(width, height, url);
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });

        // Save the placeholder
        imgFolder.file(placeholderPath.replace('images/', ''), svgBlob);

        statsRef.imageFiles++;
        statsRef.totalFiles++;
        statsRef.totalSize += svgContent.length;

        addLog(`Saved placeholder for failed image: ${placeholderPath}`, 'warning');
        return placeholderPath;
      }

      return null;
    }
  };
  // Batched image processing to avoid overwhelming the browser
  const processBatchedImages = async (imageUrls, resourceMap, imgFolder, mainUrl, statsRef, batchSize = 5) => {
    const results = [];

    // Process images in batches
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);

      // Process this batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(url => processImage(url, resourceMap, imgFolder, mainUrl, statsRef))
      );

      // Add results
      results.push(...batchResults);

      // Small delay between batches to avoid overloading
      if (i + batchSize < imageUrls.length) {
        await delay(300);
      }
    }

    return results;
  };

  // Extract all images from HTML
  const extractImages = (doc, currentUrl) => {
    const imageUrls = new Set();

    // Regular img tags
    doc.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        imageUrls.add(normalizeUrl(currentUrl, src));
      }
    });

    // Background images in inline styles
    doc.querySelectorAll('[style*="background"]').forEach(el => {
      const style = el.getAttribute('style');
      if (style) {
        const matches = style.match(/url\(['"]?([^'")]+)['"]?\)/g);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/url\(['"]?([^'")]+)['"]?\)/, '$1');
            if (url && !url.startsWith('data:')) {
              imageUrls.add(normalizeUrl(currentUrl, url));
            }
          });
        }
      }
    });

    return [...imageUrls];
  };

  // Helper to fix relative URLs in HTML content
  const fixRelativeUrls = (html, baseUrl, resourceMap) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Fix links (a href)
      const links = doc.querySelectorAll('a[href]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('#')) {
          try {
            const absoluteUrl = normalizeUrl(baseUrl, href);

            // Store original URL if option is enabled
            if (saveOriginalUrls) {
              link.setAttribute('data-original-href', href);
            }

            // If we have a local version of this URL in our resourceMap, use it
            if (resourceMap.has(absoluteUrl)) {
              link.setAttribute('href', resourceMap.get(absoluteUrl));
            } else {
              // Otherwise keep the absolute URL
              link.setAttribute('href', absoluteUrl);
            }
          } catch (e) {
            console.error(`Error fixing link ${href}:`, e);
          }
        }
      });

      // Fix images (img src)
      const images = doc.querySelectorAll('img[src]');
      images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          try {
            const absoluteUrl = normalizeUrl(baseUrl, src);

            // Store original URL if option is enabled
            if (saveOriginalUrls) {
              img.setAttribute('data-original-src', src);
            }

            // If we have a local version of this image in our resourceMap, use it
            if (resourceMap.has(absoluteUrl)) {
              img.setAttribute('src', resourceMap.get(absoluteUrl));
            } else if (useImagePlaceholders) {
              // Use a placeholder if image isn't available
              const width = img.getAttribute('width') || 300;
              const height = img.getAttribute('height') || 200;
              img.setAttribute('src', getImagePlaceholder(width, height));
            } else {
              // Keep absolute URL
              img.setAttribute('src', absoluteUrl);
            }
          } catch (e) {
            console.error(`Error fixing image ${src}:`, e);
          }
        }
      });

      // Fix stylesheets (link href)
      const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
      stylesheets.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          try {
            const absoluteUrl = normalizeUrl(baseUrl, href);

            // Store original URL if option is enabled
            if (saveOriginalUrls) {
              link.setAttribute('data-original-href', href);
            }

            // If we have a local version of this stylesheet in our resourceMap, use it
            if (resourceMap.has(absoluteUrl)) {
              link.setAttribute('href', resourceMap.get(absoluteUrl));
            } else {
              // Keep absolute URL
              link.setAttribute('href', absoluteUrl);
            }
          } catch (e) {
            console.error(`Error fixing stylesheet ${href}:`, e);
          }
        }
      });

      // Fix scripts (script src)
      const scripts = doc.querySelectorAll('script[src]');
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src) {
          try {
            const absoluteUrl = normalizeUrl(baseUrl, src);

            // Store original URL if option is enabled
            if (saveOriginalUrls) {
              script.setAttribute('data-original-src', src);
            }

            // If we have a local version of this script in our resourceMap, use it
            if (resourceMap.has(absoluteUrl)) {
              script.setAttribute('src', resourceMap.get(absoluteUrl));
            } else {
              // Keep absolute URL
              script.setAttribute('src', absoluteUrl);
            }
          } catch (e) {
            console.error(`Error fixing script ${src}:`, e);
          }
        }
      });

      // Add base tag to head if not present
      if (!doc.querySelector('base')) {
        const baseTag = doc.createElement('base');
        baseTag.href = './';
        const head = doc.querySelector('head');
        if (head) {
          head.insertBefore(baseTag, head.firstChild);
        }
      }

      // Add CSS to make images responsive
      const style = doc.createElement('style');
      style.textContent = `
        img { max-width: 100%; height: auto; }
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        /* Add a footer to show it's an archived copy */
        body::after {
          content: "⚠️ This is an archived copy of the original page. Some functionality may not work.";
          display: block;
          text-align: center;
          padding: 10px;
          margin-top: 20px;
          background-color: #f8f9fa;
          color: #333;
          border-top: 1px solid #ddd;
          font-size: 14px;
        }
      `;
      doc.head.appendChild(style);

      // Convert the modified document back to HTML
      return new XMLSerializer().serializeToString(doc);
    } catch (e) {
      console.error('Error fixing relative URLs:', e);
      return html; // Return original HTML if there's an error
    }
  };

  // Clear all fields and results
  const clearAll = () => {
    setUrl('');
    setScrapedData(null);
    setError('');
    setSuccessMessage('');
    setDownloadProgress(0);
    setScrapingStats({
      totalFiles: 0,
      totalSize: 0,
      htmlFiles: 0,
      cssFiles: 0,
      jsFiles: 0,
      imageFiles: 0,
      otherFiles: 0
    });
    setLogs([]);
    stopScrapingRef.current = false;
  };

  // Function to handle stopping the scraping process
  const stopScraping = () => {
    stopScrapingRef.current = true;
    addLog("Stopping scraping process...", 'warning');
  };

  // Download the generated ZIP file
  const downloadZip = () => {
    if (scrapedData && scrapedData.blob) {
      try {
        saveAs(scrapedData.blob, scrapedData.fileName);
        addLog(`Downloaded: ${scrapedData.fileName}`, 'success');
      } catch (err) {
        console.error("Error downloading ZIP:", err);
        addLog(`Error downloading ZIP: ${err.message}`, 'error');
        setError(`Error downloading ZIP: ${err.message}`);
      }
    }
  };

  // Toggle log visibility
  const toggleLogs = () => {
    setIsLogVisible(!isLogVisible);
  };

  // Copy log to clipboard
  const copyLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText)
      .then(() => {
        addLog('Log copied to clipboard', 'success');
      })
      .catch(err => {
        addLog(`Error copying log: ${err.message}`, 'error');
      });
  };

  // Main scraping function
  const scrapeWebsite = async () => {
    // Validate URL
    if (!url) {
      setError("Please enter a URL to scrape");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (including http:// or https://)");
      return;
    }

    // Reset states
    setError('');
    setSuccessMessage('');
    setIsScrapingInProgress(true);
    setDownloadProgress(0);
    setScrapedData(null);
    setLogs([]);
    setScrapingStats({
      totalFiles: 0,
      totalSize: 0,
      htmlFiles: 0,
      cssFiles: 0,
      jsFiles: 0,
      imageFiles: 0,
      otherFiles: 0
    });

    // Make sure the stop flag is reset
    stopScrapingRef.current = false;

    try {
      const domain = getDomain(url);
      addLog(`Starting to scrape ${domain}...`);
      addLog(`Depth level: ${depthLevel}, Include CSS: ${includeCss}, Include JS: ${includeJs}, Include Images: ${includeImages}`);

      // Create a new ZIP file
      const zip = new JSZip();
      const mainFolder = zip.folder(sanitizeFilename(domain));

      // Create subfolders for different asset types
      const cssFolder = mainFolder.folder("css");
      const jsFolder = mainFolder.folder("js");
      const imgFolder = mainFolder.folder("images");
      const otherFolder = mainFolder.folder("other");

      // Track processed URLs to avoid duplicates
      const processedUrls = new Set();

      // Track images to process separately
      const imagesToProcess = new Set();

      // Create a queue of URLs to process
      const urlsToProcess = [{ url, depth: 0, type: 'html', isMainPage: true }];

      // Map to store local file paths for each URL
      const resourceMap = new Map();

      // Initialize counters - created as a ref object so we can pass it to functions
      let stats = {
        totalFiles: 0,
        totalSize: 0,
        htmlFiles: 0,
        cssFiles: 0,
        jsFiles: 0,
        imageFiles: 0,
        otherFiles: 0
      };

      // Flag to track if the main HTML page was processed
      let mainPageProcessed = false;
      let mainPageHtml = null;

      // Process URLs until queue is empty or depth limit is reached
      while (urlsToProcess.length > 0 && !stopScrapingRef.current) {
        // Stop if we've reached the resource limit
        if (processedUrls.size >= resourceLimit) {
          addLog(`Reached resource limit of ${resourceLimit} files. Stopping.`, 'warning');
          break;
        }

        const { url: currentUrl, depth, type, isMainPage = false } = urlsToProcess.shift();

        // Skip if already processed
        if (processedUrls.has(currentUrl)) {
          continue;
        }

        // Skip if depth exceeded (except for images at level 0, which we always want)
        if (depth > depthLevel && !(depth === 1 && type === 'image' && depthLevel === 0)) {
          continue;
        }

        // Add to processed set
        processedUrls.add(currentUrl);

        // Add small delay to avoid rate limiting
        if (processingDelay > 0) {
          await delay(processingDelay);
        }

        try {
          addLog(`Processing: ${currentUrl}`);

          // For images, just add to image processing queue
          if (type === 'image') {
            if (includeImages) {
              imagesToProcess.add(currentUrl);
            }
            continue;
          }

          // Try to fetch the URL with different proxies
          const response = await fetchWithProxies(currentUrl);
          const contentType = response.headers.get('content-type') || '';

          // Handle different content types
          if (contentType.includes('text/html')) {
            // Handle HTML
            const htmlText = await response.text();

            // Store the main page HTML separately
            if (isMainPage) {
              mainPageHtml = htmlText;
              mainPageProcessed = true;
              addLog("Successfully captured main page HTML", 'success');
            }

            // Determine the filename
            const localPath = getLocalFilePath(currentUrl, url, 'html');

            // Save mapping of URL to local path
            resourceMap.set(currentUrl, localPath);

            // Parse HTML to find links, styles, scripts, and images
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            // Extract CSS links
            if (includeCss) {
              const styleLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
              for (const link of styleLinks) {
                const cssUrl = link.getAttribute('href');
                if (cssUrl) {
                  const absoluteCssUrl = normalizeUrl(currentUrl, cssUrl);
                  urlsToProcess.push({
                    url: absoluteCssUrl,
                    depth: depth + 1,
                    type: 'css'
                  });
                }
              }
            }

            // Extract JS scripts
            if (includeJs) {
              const scripts = Array.from(doc.querySelectorAll('script[src]'));
              for (const script of scripts) {
                const jsUrl = script.getAttribute('src');
                if (jsUrl) {
                  const absoluteJsUrl = normalizeUrl(currentUrl, jsUrl);
                  urlsToProcess.push({
                    url: absoluteJsUrl,
                    depth: depth + 1,
                    type: 'js'
                  });
                }
              }
            }

            // Extract images
            if (includeImages) {
              const images = extractImages(doc, currentUrl);
              images.forEach(imgUrl => {
                if (!processedUrls.has(imgUrl) && !imagesToProcess.has(imgUrl)) {
                  imagesToProcess.add(imgUrl);
                }
              });
            }

            // Extract a href links for further crawling
            if (depth < depthLevel) {
              const links = Array.from(doc.querySelectorAll('a[href]'));
              for (const link of links) {
                const hrefUrl = link.getAttribute('href');
                if (hrefUrl && !hrefUrl.startsWith('#') && !hrefUrl.startsWith('javascript:') && !hrefUrl.startsWith('mailto:')) {
                  const absoluteHrefUrl = normalizeUrl(currentUrl, hrefUrl);

                  // Only process URLs from the same domain
                  if (getDomain(absoluteHrefUrl) === domain) {
                    urlsToProcess.push({
                      url: absoluteHrefUrl,
                      depth: depth + 1,
                      type: 'html'
                    });
                  }
                }
              }
            }

            // If this is not the main page, count it in stats
            if (!isMainPage) {
              stats.htmlFiles++;
              stats.totalFiles++;
              stats.totalSize += htmlText.length;

              addLog(`Processed HTML: ${localPath}`);
            }
          } else if ((contentType.includes('text/css') || currentUrl.endsWith('.css')) && includeCss) {
            // Handle CSS
            const css = await response.text();

            // Determine the filename
            const localPath = getLocalFilePath(currentUrl, url, 'css');

            // Extract URLs from CSS and add to image queue
            if (includeImages) {
              const urlMatches = css.match(/url\(['"]?([^'")]+)['"]?\)/g) || [];
              for (const match of urlMatches) {
                const cssUrl = match.replace(/url\(['"]?([^'")]+)['"]?\)/, '$1');
                if (cssUrl && !cssUrl.startsWith('data:')) {
                  const absoluteUrl = normalizeUrl(currentUrl, cssUrl);
                  if (!processedUrls.has(absoluteUrl) && !imagesToProcess.has(absoluteUrl) && isLikelyImage(absoluteUrl)) {
                    imagesToProcess.add(absoluteUrl);
                  }
                }
              }
            }

            // Save the CSS file
            cssFolder.file(localPath.replace('css/', ''), css);

            // Save mapping of URL to local path
            resourceMap.set(currentUrl, localPath);

            stats.cssFiles++;
            stats.totalFiles++;
            stats.totalSize += css.length;

            addLog(`Processed CSS: ${localPath}`);
          } else if ((contentType.includes('javascript') || contentType.includes('text/js') || currentUrl.endsWith('.js')) && includeJs) {
            // Handle JavaScript
            const js = await response.text();

            // Determine the filename
            const localPath = getLocalFilePath(currentUrl, url, 'js');

            // Save the JS file
            jsFolder.file(localPath.replace('js/', ''), js);

            // Save mapping of URL to local path
            resourceMap.set(currentUrl, localPath);

            stats.jsFiles++;
            stats.totalFiles++;
            stats.totalSize += js.length;

            addLog(`Processed JS: ${localPath}`);
          } else {
            // Handle other files
            const blob = await response.blob();

            // Determine the filename
            const localPath = 'other/' + getFilenameFromUrl(currentUrl);

            // Save the file
            otherFolder.file(localPath.replace('other/', ''), blob);

            // Save mapping of URL to local path
            resourceMap.set(currentUrl, localPath);

            stats.otherFiles++;
            stats.totalFiles++;
            stats.totalSize += blob.size;

            addLog(`Processed Other: ${localPath}`);
          }

          // Update progress
          const totalToProcess = processedUrls.size + urlsToProcess.length + imagesToProcess.size;
          setDownloadProgress(processedUrls.size / totalToProcess * 100);
          setScrapingStats(stats);
        } catch (err) {
          console.error(`Error processing ${currentUrl}:`, err);
          addLog(`Error processing ${currentUrl}: ${err.message}`, 'error');
        }
      }

      // Process images in batches
      if (imagesToProcess.size > 0) {
        addLog(`Processing ${imagesToProcess.size} images in batches...`);
        // Pass the main URL and stats reference explicitly to avoid scope issues
        await processBatchedImages([...imagesToProcess], resourceMap, imgFolder, url, stats);

        // Update stats
        setScrapingStats(stats);
      }

      // Check if the scraping was stopped
      if (stopScrapingRef.current) {
        addLog("Scraping was stopped by user", 'warning');
        setError("Scraping stopped by user");
        setIsScrapingInProgress(false);
        return;
      }

      // Now that we have all resources, fix the HTML files
      addLog("Processing HTML files and fixing URLs...");

      // Process main page first to ensure index.html is generated
      if (mainPageProcessed && mainPageHtml) {
        try {
          // Fix relative URLs in the main page HTML
          const fixedHtml = fixRelativeUrls(mainPageHtml, url, resourceMap);

          // Save to index.html
          mainFolder.file('index.html', fixedHtml);

          // Count it in stats
          stats.htmlFiles++;
          stats.totalFiles++;
          stats.totalSize += fixedHtml.length;

          addLog("Successfully created index.html", 'success');
        } catch (err) {
          console.error("Error creating index.html:", err);
          addLog(`Error creating index.html: ${err.message}`, 'error');

          // Create a backup index.html if the main one failed
          try {
            const backupHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Archived website: ${domain}</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
h1 { color: #333; }
.warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
.links { margin-top: 30px; }
.links a { display: block; margin: 10px 0; color: #0066cc; text-decoration: none; }
.links a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>Archived Website: ${domain}</h1>
<div class="warning">
<p>The main page could not be processed correctly. However, you can still browse the archived pages below.</p>
</div>

<div class="links">
<h2>Available Pages:</h2>
${Array.from(processedUrls)
                .filter(u => resourceMap.has(u) && resourceMap.get(u).endsWith('.html') && u !== url)
                .map(u => `<a href="${resourceMap.get(u)}">${u.replace(/https?:\/\//, '')}</a>`)
                .join('\n')}
</div>
</body>
</html>`;

            mainFolder.file('index.html', backupHtml);
            addLog("Created backup index.html", 'warning');
          } catch (backupErr) {
            addLog("Failed to create backup index.html", 'error');
          }
        }
      } else {
        addLog("Warning: Could not create index.html - main page not processed", 'warning');

        // Create a fallback index.html
        try {
          const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Archived website: ${domain}</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
h1 { color: #333; }
.warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
.links { margin-top: 30px; }
.links a { display: block; margin: 10px 0; color: #0066cc; text-decoration: none; }
.links a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>Archived Website: ${domain}</h1>
<div class="warning">
<p>The main page could not be processed. Please browse the archived pages below.</p>
</div>

<div class="links">
<h2>Available Pages:</h2>
${Array.from(processedUrls)
              .filter(u => resourceMap.has(u) && resourceMap.get(u).endsWith('.html'))
              .map(u => `<a href="${resourceMap.get(u)}">${u.replace(/https?:\/\//, '')}</a>`)
              .join('\n')}
</div>
</body>
</html>`;

          mainFolder.file('index.html', fallbackHtml);
          addLog("Created fallback index.html", 'warning');
        } catch (fallbackErr) {
          addLog("Failed to create fallback index.html", 'error');
        }
      }

      // Process other HTML files
      for (const processedUrl of processedUrls) {
        // Skip non-HTML files or the main URL (which we've already processed)
        if (!resourceMap.has(processedUrl) ||
          !resourceMap.get(processedUrl).endsWith('.html') ||
          processedUrl === url) {
          continue;
        }

        try {
          // Fetch the HTML content again
          const response = await fetchWithProxies(processedUrl);
          const htmlText = await response.text();

          // Fix relative URLs in the HTML
          const fixedHtml = fixRelativeUrls(htmlText, processedUrl, resourceMap);

          // Get the local path
          const localPath = resourceMap.get(processedUrl);

          // Save the fixed HTML file
          mainFolder.file(localPath, fixedHtml);

          addLog(`Fixed and saved HTML: ${localPath}`);
        } catch (err) {
          console.error(`Error fixing HTML ${processedUrl}:`, err);
          addLog(`Error fixing HTML ${processedUrl}: ${err.message}`, 'error');
        }
      }

      // Create a readme file with usage instructions
      addLog("Creating README file with usage instructions...");
      const readmeContent = `# Archived Website: ${domain}

This is an archived copy of the website ${url} created on ${new Date().toLocaleString()}.

## How to Use This Archive

1. Extract all files from this ZIP archive to a folder
2. Open the 'index.html' file in a web browser
3. You can now browse the archived content offline

## Notes

- This archive contains ${stats.totalFiles} files (${stats.htmlFiles} HTML, ${stats.cssFiles} CSS, ${stats.jsFiles} JS, ${stats.imageFiles} images)
- Total size: ${formatBytes(stats.totalSize)}
- Some functionality (like forms, search, dynamic content) may not work in the archived version
- This archive was created for personal use and should respect the original website's terms of service

Created with Website Scraper Tool
`;

      mainFolder.file('README.txt', readmeContent);

      // Generate and download ZIP
      addLog("Generating ZIP file...");
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        },
        onUpdate: (metadata) => {
          setDownloadProgress(metadata.percent);
        }
      });

      // Format timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipFileName = `${sanitizeFilename(domain)}_${timestamp}.zip`;

      // Save generated data
      setScrapedData({
        blob: content,
        fileName: zipFileName
      });

      addLog(`ZIP file ready: ${zipFileName} (${formatBytes(content.size)})`, 'success');
      setSuccessMessage("Website scraped successfully! Click Download to save the ZIP file.");
    } catch (err) {
      console.error("Scraping error:", err);
      setError(`Error scraping website: ${err.message}`);
      addLog(`Scraping error: ${err.message}`, 'error');
    } finally {
      setIsScrapingInProgress(false);
    }
  };

  // Create the description element for the Layout
  const descriptionElement = (
    <div className="info-banner">
      <div className="info-icon">
        <Info size={20} />
      </div>
      <div className="info-content">
        Create a local copy of a website by providing its URL. The tool will scrape the HTML, CSS, JavaScript, and images,
        and package everything into a downloadable ZIP file. All processing happens in your browser for maximum privacy.
      </div>
    </div>
  );

  return (
    <Layout
      title="Website Scraper & Archiver"
      description={descriptionElement}
    >
      <div className="scraper-container">
        <div className="form-section">
          <div className="input-group">
            <label htmlFor="url-input">Website URL:</label>
            <div className="input-with-icon">
              <Globe size={18} className="input-icon" />
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="text-input"
                disabled={isScrapingInProgress}
              />
            </div>
          </div>

          <div className="advanced-options-toggle" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
            <Info size={16} />
            <span>{showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}</span>
          </div>

          {showAdvancedOptions && (
            <div className="advanced-options">
              <div className="input-group">
                <label htmlFor="depth-level">Crawl Depth Level:</label>
                <select
                  id="depth-level"
                  value={depthLevel}
                  onChange={(e) => setDepthLevel(Number(e.target.value))}
                  className="select-input"
                  disabled={isScrapingInProgress}
                >
                  <option value="0">Level 0 (Current page only)</option>
                  <option value="1">Level 1 (Current page + direct links)</option>
                  <option value="2">Level 2 (Deeper crawl - may take longer)</option>
                  <option value="3">Level 3 (Deep crawl - may be very slow)</option>
                </select>
              </div>

              <div className="checkbox-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeCss}
                    onChange={(e) => setIncludeCss(e.target.checked)}
                    disabled={isScrapingInProgress}
                  />
                  <span>Include CSS Styles</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeJs}
                    onChange={(e) => setIncludeJs(e.target.checked)}
                    disabled={isScrapingInProgress}
                  />
                  <span>Include JavaScript Files</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    disabled={isScrapingInProgress}
                  />
                  <span>Include Images</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useImagePlaceholders}
                    onChange={(e) => setUseImagePlaceholders(e.target.checked)}
                    disabled={isScrapingInProgress}
                  />
                  <span>Use Image Placeholders for Failed Images</span>
                </label>

                <div className="proxy-options">
                  <label className="proxy-label">CORS Proxy Methods:</label>
                  <div className="proxy-checkboxes">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={corsProxyMethods.direct}
                        onChange={(e) => setCorsProxyMethods({ ...corsProxyMethods, direct: e.target.checked })}
                        disabled={isScrapingInProgress}
                      />
                      <span>Direct (No Proxy)</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={corsProxyMethods.corsproxy}
                        onChange={(e) => setCorsProxyMethods({ ...corsProxyMethods, corsproxy: e.target.checked })}
                        disabled={isScrapingInProgress}
                      />
                      <span>corsproxy.io</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={corsProxyMethods.allorigins}
                        onChange={(e) => setCorsProxyMethods({ ...corsProxyMethods, allorigins: e.target.checked })}
                        disabled={isScrapingInProgress}
                      />
                      <span>allorigins.win</span>
                    </label>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="resource-limit">Resource Limit:</label>
                  <input
                    id="resource-limit"
                    type="number"
                    min="10"
                    max="2000"
                    value={resourceLimit}
                    onChange={(e) => setResourceLimit(Number(e.target.value))}
                    className="text-input"
                    disabled={isScrapingInProgress}
                  />
                  <div className="input-help">Maximum number of files to download</div>
                </div>

                <div className="input-group">
                  <label htmlFor="processing-delay">Processing Delay (ms):</label>
                  <input
                    id="processing-delay"
                    type="number"
                    min="0"
                    max="1000"
                    value={processingDelay}
                    onChange={(e) => setProcessingDelay(Number(e.target.value))}
                    className="text-input"
                    disabled={isScrapingInProgress}
                  />
                  <div className="input-help">Delay between requests (may help with rate limiting)</div>
                </div>
              </div>
            </div>
          )}

          <div className="note-box">
            <AlertCircle size={16} />
            <p>
              This tool respects <strong>robots.txt</strong> and is intended for personal archiving only.
              Please respect website terms of service and copyright laws when using this tool.
            </p>
          </div>

          <div className="button-group">
            {!isScrapingInProgress ? (
              // Show Scrape button when not in progress
              <button
                onClick={scrapeWebsite}
                disabled={!url}
                className="action-button primary"
              >
                <Globe size={18} />
                <span>Scrape Website</span>
              </button>
            ) : (
              // Show Stop button when scraping is in progress
              <button
                onClick={stopScraping}
                className="action-button stop"
              >
                <StopCircle size={18} />
                <span>Stop Scraping</span>
              </button>
            )}

            <button onClick={clearAll} className="action-button secondary" disabled={isScrapingInProgress}>
              <RefreshCw size={18} />
              <span>Reset</span>
            </button>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <Check size={16} />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {isScrapingInProgress && (
          <div className="progress-section">
            <h3>Scraping in Progress {stopScrapingRef.current && '(Stopping...)'}</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${downloadProgress}%` }}></div>
            </div>
            <div className="progress-stats">
              <span>{downloadProgress.toFixed(1)}% Complete</span>
              <span>Files: {scrapingStats.totalFiles}</span>
              <span>Using: {currentProxy}</span>
            </div>
            <div className="stats-badges">
              <span className="stat-badge">HTML: {scrapingStats.htmlFiles}</span>
              <span className="stat-badge">CSS: {scrapingStats.cssFiles}</span>
              <span className="stat-badge">JS: {scrapingStats.jsFiles}</span>
              <span className="stat-badge">Images: {scrapingStats.imageFiles}</span>
            </div>
            <button className="toggle-log-button" onClick={toggleLogs}>
              {isLogVisible ? 'Hide Log' : 'Show Log'} ({logs.length} entries)
            </button>
          </div>
        )}

        {isLogVisible && logs.length > 0 && (
          <div className="log-container">
            <div className="log-header">
              <h3>Activity Log ({logs.length} entries)</h3>
              <div className="log-actions">
                <button className="log-action-button" onClick={copyLogs}>
                  <Copy size={14} />
                  <span>Copy</span>
                </button>
                <button className="log-action-button" onClick={() => setLogs([])}>
                  <RefreshCw size={14} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
            <div className="log-content">
              {logs.map(log => (
                <div key={log.id} className={`log-entry ${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {scrapedData && (
          <div className="result-section">
            <h3>Scraping Complete</h3>

            <div className="stats-container">
              <div className="stats-item">
                <div className="stats-icon"><File size={16} /></div>
                <div className="stats-label">Total Files</div>
                <div className="stats-value">{scrapingStats.totalFiles}</div>
              </div>
              <div className="stats-item">
                <div className="stats-icon"><File size={16} /></div>
                <div className="stats-label">Total Size</div>
                <div className="stats-value">{formatBytes(scrapingStats.totalSize)}</div>
              </div>
              <div className="stats-item">
                <div className="stats-icon"><File size={16} /></div>
                <div className="stats-label">HTML Files</div>
                <div className="stats-value">{scrapingStats.htmlFiles}</div>
              </div>
              <div className="stats-item">
                <div className="stats-icon"><File size={16} /></div>
                <div className="stats-label">CSS Files</div>
                <div className="stats-value">{scrapingStats.cssFiles}</div>
              </div>
              <div className="stats-item">
                <div className="stats-icon"><File size={16} /></div>
                <div className="stats-label">JS Files</div>
                <div className="stats-value">{scrapingStats.jsFiles}</div>
              </div>
              <div className="stats-item">
                <div className="stats-icon"><File size={16} /></div>
                <div className="stats-label">Images</div>
                <div className="stats-value">{scrapingStats.imageFiles}</div>
              </div>
            </div>

            <div className="download-container">
              <button onClick={downloadZip} className="download-button">
                <Download size={18} />
                <span>Download ZIP File</span>
              </button>
              <div className="file-info">
                {scrapedData.fileName} ({formatBytes(scrapedData.blob.size)})
              </div>
            </div>

            <div className="instructions">
              <h4>How to use the downloaded archive:</h4>
              <ol>
                <li>Download and extract the ZIP file to your computer</li>
                <li>Open the folder and locate the <code>index.html</code> file</li>
                <li>Double-click the file to open it in your default web browser</li>
                <li>You can now browse the archived website offline</li>
              </ol>
              <p className="note">
                <Info size={16} />
                <span>Some website functionality might not work properly as dynamic features and server-side processing won't be available offline.</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default WebsiteScraper;
// Shared by the home page, navigation, and generated static route menus.
export const categories = [
  { id: 'documents', name: 'Documents', description: 'Combine files and prepare PDFs for sharing.' },
  { id: 'media', name: 'Media', description: 'Create animations and change video speed.' },
  { id: 'qr', name: 'QR codes', description: 'Connect people to links, Wi-Fi, and contact details.' },
  { id: 'developer', name: 'Developer & network', description: 'Format, encode, calculate, and explore.' },
];

export const tools = [
  { id: 'pdf-merger', name: 'PDF & Image Merger', category: 'documents', icon: 'FileText', description: 'Combine PDFs and images into one document, with files sorted by filename.', tags: ['Merge PDF', 'Images to PDF'] },
  { id: 'pdf-compressor', name: 'PDF Compressor', category: 'documents', icon: 'FileDown', description: 'Reduce scanned and image-heavy PDFs with quality presets and optional grayscale.', tags: ['Reduce size', 'Scanned PDFs'] },
  { id: 'gif-maker', name: 'Animated GIF Maker', category: 'media', icon: 'Film', description: 'Turn images or a video clip into a GIF. Adjust timing, size, and looping before downloading.', tags: ['Images to GIF', 'Video to GIF'] },
  { id: 'video-speed-controller', name: 'Video Speed Controller', category: 'media', icon: 'Video', description: 'Adjust video speed for slow motion or fast-forward effects, with a local preview.', tags: ['Slow motion', 'Fast-forward'] },
  { id: 'qr-code-tool', name: 'QR Code Generator & Scanner', category: 'qr', icon: 'QrCode', description: 'Create QR codes for URLs, text, Wi-Fi, and contacts. Scan with your camera or an image.', tags: ['Generate', 'Scan'] },
  { id: 'code-formatter', name: 'Code Formatter', category: 'developer', icon: 'Code', description: 'Format and highlight HTML, CSS, JavaScript, JSON, and more in your browser.', tags: ['Beautify code', 'Syntax highlighting'] },
  { id: 'base64-encoder-decoder', name: 'Base64 Encoder/Decoder', category: 'developer', icon: 'FileCode', description: 'Encode and decode Base64 text for development and everyday data conversion.', tags: ['Encode', 'Decode'] },
  { id: 'cidr-calculator', name: 'CIDR Subnet Calculator', category: 'developer', icon: 'Network', description: 'Calculate subnet masks, network and broadcast addresses, and IP ranges.', tags: ['Subnet planning', 'IP ranges'] },
  { id: 'website-scraper', name: 'Website Scraper', category: 'developer', icon: 'Globe', experimental: true, description: 'Download website resources into a ZIP archive. Site restrictions may limit results; requests may use third-party proxies.', tags: ['Website to ZIP', 'Network access'] },
];

export const toolPath = (tool) => `/${tool.id}/`;

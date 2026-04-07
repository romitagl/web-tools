const SITE_URL = 'https://web-tools.romitagl.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const seoData = {
  '/': {
    title: 'Free Web Tools: PDF Merger, PDF Compressor, QR Code Generator & More',
    description:
      '100% free and private web tools for merging PDFs, compressing PDFs, generating QR codes, formatting code, and more. Everything runs locally in your browser.',
    keywords:
      'free web tools, pdf merger, pdf compressor, qr code generator, compress pdf online, merge pdf online, browser-based tools, privacy-first tools',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: SITE_URL,
      name: 'Web Tools by romitagl.com',
      description:
        'Free, private web tools including PDF merging, PDF compression, QR code generation, code formatting, and more.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  },
  '/pdf-merger': {
    title: 'Merge PDFs and Images Online Free, Private, No Upload',
    description:
      'Merge PDF files and images into one document directly in your browser. Free, private, and no uploads required.',
    keywords:
      'merge pdf online, combine pdf files, merge pdf and images, free pdf merger, private pdf merger, browser pdf merger',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF & Image Merger',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web browser',
      description:
        'Combine multiple PDFs and images into a single document directly in your browser.',
      url: `${SITE_URL}/pdf-merger`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
  '/pdf-compressor': {
    title: 'Compress PDF Online Free, Private, No Upload',
    description:
      'Reduce PDF file size directly in your browser. Best for scanned and image-heavy PDFs, with no uploads and full privacy.',
    keywords:
      'compress pdf online, reduce pdf size, free pdf compressor, private pdf compressor, scanned pdf compression, no upload pdf compressor',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PDF Compressor',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web browser',
      description:
        'Reduce the size of scanned and image-heavy PDF files directly in your browser for easier sharing.',
      url: `${SITE_URL}/pdf-compressor`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
  '/qr-code-tool': {
    title: 'QR Code Generator for WiFi, URLs and Contact Info',
    description:
      'Create QR codes for WiFi, URLs, text, and contact details directly in your browser. Great for Airbnb hosts, hotels, and restaurants.',
    keywords:
      'qr code generator, wifi qr code, airbnb qr code, hotel qr code, contact qr code, free qr code generator',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'QR Code Generator',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web browser',
      description:
        'Create scannable QR codes for WiFi, URLs, text, and contact information in your browser.',
      url: `${SITE_URL}/qr-code-tool`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
  '/cidr-calculator': {
    title: 'CIDR Calculator Online for Subnetting and IP Ranges',
    description:
      'Calculate subnet masks, network addresses, broadcast addresses, and IP ranges with this free online CIDR calculator.',
    keywords:
      'cidr calculator, subnet calculator, ip range calculator, network calculator, broadcast address calculator',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'CIDR Calculator',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web browser',
      description:
        'Calculate network addresses, broadcast addresses, and IP ranges for subnet planning and troubleshooting.',
      url: `${SITE_URL}/cidr-calculator`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
  '/code-formatter': {
    title: 'Code Formatter Online for HTML, CSS, JavaScript and JSON',
    description:
      'Format and beautify HTML, CSS, JavaScript, JSON, YAML, Markdown, and more directly in your browser.',
    keywords:
      'code formatter online, html formatter, css formatter, javascript formatter, json beautifier, code beautifier',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Code Formatter',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web browser',
      description:
        'Format and beautify code with support for HTML, CSS, JavaScript, JSON, YAML, Markdown, and more.',
      url: `${SITE_URL}/code-formatter`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
  '/base64-encoder-decoder': {
    title: 'Base64 Encoder and Decoder Online',
    description:
      'Encode and decode Base64 text directly in your browser with this free online Base64 tool.',
    keywords:
      'base64 encoder, base64 decoder, base64 encode online, base64 decode online',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Base64 Encoder/Decoder',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web browser',
      description:
        'Convert text or binary data to and from Base64 directly in your browser.',
      url: `${SITE_URL}/base64-encoder-decoder`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
  '/website-scraper': {
    title: 'Website Scraper and Offline Archive Tool',
    description:
      'Archive websites locally by downloading HTML, CSS, JavaScript, and images into a ZIP file directly in your browser.',
    keywords:
      'website scraper, offline website downloader, archive website, website to zip, browser website scraper',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Website Scraper',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web browser',
      description:
        'Archive websites locally by saving HTML, CSS, JavaScript, and images into a downloadable ZIP file.',
      url: `${SITE_URL}/website-scraper`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
  '/video-speed-controller': {
    title: 'Video Speed Controller Online for Slow Motion and Time-Lapse',
    description:
      'Adjust video playback speed directly in your browser to create slow-motion or time-lapse effects with no uploads.',
    keywords:
      'video speed controller, slow motion video online, time lapse video online, change video speed, browser video editor',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Video Speed Controller',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web browser',
      description:
        'Modify video playback speed to create slow-motion or time-lapse effects directly in your browser.',
      url: `${SITE_URL}/video-speed-controller`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  },
};

export function getSeoData(pathname) {
  return seoData[pathname] || seoData['/'];
}

export const defaultOgImage = DEFAULT_OG_IMAGE;
export const siteUrl = SITE_URL;

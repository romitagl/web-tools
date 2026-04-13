import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildPublicUrl, defaultOgImage, getSeoData } from '../seoData';

function setMetaAttribute(selector, attribute, value) {
  let element = document.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    const match = selector.match(/\[(name|property)="([^"]+)"\]/);
    if (match) {
      element.setAttribute(match[1], match[2]);
    }
    document.head.appendChild(element);
  }

  element.setAttribute(attribute, value);
}

function Seo() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname || '/';
    const seo = getSeoData(pathname);
    const canonicalUrl = buildPublicUrl(pathname);

    document.title = seo.title;

    setMetaAttribute('meta[name="description"]', 'content', seo.description);
    setMetaAttribute('meta[name="keywords"]', 'content', seo.keywords);
    setMetaAttribute('meta[property="og:title"]', 'content', seo.title);
    setMetaAttribute('meta[property="og:description"]', 'content', seo.description);
    setMetaAttribute('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaAttribute('meta[property="og:image"]', 'content', defaultOgImage);
    setMetaAttribute('meta[name="twitter:title"]', 'content', seo.title);
    setMetaAttribute('meta[name="twitter:description"]', 'content', seo.description);
    setMetaAttribute('meta[name="twitter:url"]', 'content', canonicalUrl);
    setMetaAttribute('meta[name="twitter:image"]', 'content', defaultOgImage);

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonicalUrl;

    let schemaTag = document.getElementById('route-schema');
    if (!schemaTag) {
      schemaTag = document.createElement('script');
      schemaTag.id = 'route-schema';
      schemaTag.type = 'application/ld+json';
      document.head.appendChild(schemaTag);
    }
    schemaTag.textContent = JSON.stringify(seo.schema);
  }, [location.pathname]);

  return null;
}

export default Seo;

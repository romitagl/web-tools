import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function Canonical() {
  const location = useLocation();
  
  useEffect(() => {
    // Get current canonical tag if it exists
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    
    // If no canonical tag exists, create one
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    
    // Set the href to the correct URL
    canonicalTag.href = `https://web-tools.romitagl.com${location.pathname}`;
    
    // Cleanup function
    return () => {
      // We don't remove it on cleanup since it's needed for all pages
    };
  }, [location.pathname]);
  
  // This component doesn't render anything
  return null;
}

export default Canonical;
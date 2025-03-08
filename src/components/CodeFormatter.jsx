import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code, Info, ArrowLeft, Copy, Check, RefreshCw, FileText, Download, Upload } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

function CodeFormatter() {
  const [code, setCode] = useState('');
  const [formattedCode, setFormattedCode] = useState('');
  const [language, setLanguage] = useState('html');
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('input'); // 'input' or 'output'

  // Language options
  const languageOptions = [
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'jsx', label: 'JSX/React' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'yaml', label: 'YAML' },
    { value: 'python', label: 'Python' },
    { value: 'sql', label: 'SQL' }
  ];

  // Initialize Prism syntax highlighting
  useEffect(() => {
    if (formattedCode) {
      Prism.highlightAll();
    }
  }, [formattedCode, selectedTab]);

  // Basic formatting for different languages
  const simpleFormat = (input, lang) => {
    if (!input.trim()) return '';
    
    try {
      switch (lang) {
        case 'html':
          return formatHTML(input);
        case 'css':
          return formatCSS(input);
        case 'javascript':
        case 'jsx':
          return formatJS(input);
        case 'json':
          return formatJSON(input);
        default:
          // For other languages, just return the input with consistent line breaks
          return input.replace(/\r\n/g, '\n');
      }
    } catch (err) {
      console.error(`Error formatting ${lang}:`, err);
      return input; // Return original in case of error
    }
  };

  // Improved HTML formatter
  const formatHTML = (html) => {
    // First, normalize line endings and remove extra whitespace
    html = html.replace(/\r\n/g, '\n')
               .replace(/^\s+|\s+$/g, '')
               .replace(/\s+</g, '<')
               .replace(/>\s+/g, '>');
    
    // Insert line breaks between tags to prepare for formatting
    html = html.replace(/>\s*</g, '>\n<');
    
    // Handle special cases for preserving content in certain tags
    html = html.replace(/(<(script|style|pre)[^>]*>)(.*?)(<\/\2>)/gs, (match, startTag, tagName, content, endTag) => {
      // Preserve content in script/style/pre tags but add line breaks around them
      return `${startTag}\n${content}\n${endTag}`;
    });
    
    // Split into lines for indentation
    const lines = html.split('\n');
    let formatted = '';
    let indent = 0;
    const indentSize = 2;
    
    // Self-closing tags pattern
    const selfClosingTags = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr).*?\/?>$/i;
    
    // Doctype and comments pattern
    const doctypeOrComment = /^<!.*?>$/;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;
      
      // Handle doctype and comments - no indent change
      if (doctypeOrComment.test(line)) {
        formatted += ' '.repeat(indent) + line + '\n';
        continue;
      }
      
      // Check if this line is a closing tag
      if (line.startsWith('</')) {
        indent -= indentSize;
        if (indent < 0) indent = 0; // Prevent negative indentation
        formatted += ' '.repeat(indent) + line + '\n';
        continue;
      }
      
      // Check if this line is an opening tag (not self-closing)
      if (line.startsWith('<') && !line.includes('</') && !selfClosingTags.test(line)) {
        formatted += ' '.repeat(indent) + line + '\n';
        if (!line.endsWith('/>')) {
          indent += indentSize;
        }
        continue;
      }
      
      // Self-closing or inline elements
      formatted += ' '.repeat(indent) + line + '\n';
    }
    
    return formatted;
  };

  // Basic CSS formatting
  const formatCSS = (css) => {
    // Remove extra whitespace
    css = css.replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1');
    // Add line breaks and indentation
    css = css.replace(/}/g, '}\n').replace(/{/g, ' {\n  ').replace(/;/g, ';\n  ');
    // Fix indentation after closing braces
    css = css.replace(/\n\s*}/g, '\n}');
    return css;
  };

  // Basic JavaScript formatting
  const formatJS = (js) => {
    let formatted = '';
    let indent = 0;
    const indentSize = 2;
    
    // Replace multiple spaces with a single space
    js = js.replace(/\s+/g, ' ').trim();
    
    // Add newlines after key punctuation
    js = js.replace(/([;{}])/g, '$1\n');
    
    // Handle special cases for nested structures
    js = js.replace(/\) {/g, ') {\n');
    
    const lines = js.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;
      
      // Decrease indent for closing braces
      if (line.startsWith('}')) {
        indent -= indentSize;
        if (indent < 0) indent = 0;
      }
      
      // Add indentation
      formatted += ' '.repeat(indent) + line + '\n';
      
      // Increase indent for opening braces
      if (line.includes('{') && !line.includes('}')) {
        indent += indentSize;
      }
    }
    
    return formatted;
  };

  // Format JSON
  const formatJSON = (json) => {
    try {
      const obj = JSON.parse(json);
      return JSON.stringify(obj, null, 2);
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }
  };

  // Format code function
  const formatCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to format.');
      return;
    }

    setIsFormatting(true);
    setError('');

    try {
      // Simple built-in formatter
      const formattedResult = simpleFormat(code, language);
      setFormattedCode(formattedResult);
      setSelectedTab('output');
    } catch (err) {
      console.error('Formatting error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsFormatting(false);
    }
  };

  // Clear code
  const clearCode = () => {
    setCode('');
    setFormattedCode('');
    setError('');
    setCopied(false);
    setSelectedTab('input');
  };

  // Copy formatted code to clipboard
  const copyToClipboard = () => {
    if (!formattedCode) return;
    
    navigator.clipboard.writeText(formattedCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setError('Failed to copy to clipboard');
      });
  };

  // Download formatted code
  const downloadCode = () => {
    if (!formattedCode) return;
    
    const fileExtension = language === 'jsx' ? 'jsx' : language;
    const fileName = `formatted-code.${fileExtension}`;
    const blob = new Blob([formattedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Try to detect language from file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const mappings = {
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'md': 'markdown',
      'yaml': 'yaml',
      'yml': 'yaml',
      'py': 'python',
      'sql': 'sql'
    };
    
    if (mappings[fileExtension]) {
      setLanguage(mappings[fileExtension]);
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target.result);
      setFormattedCode('');
      setSelectedTab('input');
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="header">
        <div className="logo-container">
          <Link to="/" className="home-link">
            <ArrowLeft size={20} className="back-icon" />
            <span>Back to Tools</span>
          </Link>
          <div className="app-logos">
            <img src="/images/webtools-logo.svg" alt="WebTools Logo" width="150" />
          </div>
        </div>
        <h1>Code Formatter & Beautifier</h1>
        <h2>100% Private, 100% Free!</h2>
        <p>Runs safely and securely in your browser.</p>
      </div>
      
      <section className="description">
        <div className="info-box">
          <Info size={20} />
          <p>
            Instantly format and beautify your code with support for HTML, CSS, JavaScript, and more.
            No server processing - all formatting happens locally in your browser.
          </p>
        </div>
      </section>
      
      <div className="formatter-container">
        <div className="formatter-header">
          <div className="language-selector">
            <label htmlFor="language-select">Language:</label>
            <select 
              id="language-select" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="formatter-actions">
            <label className="file-upload-button">
              <Upload size={16} />
              <span>Upload File</span>
              <input 
                type="file" 
                onChange={handleFileUpload} 
                className="hidden-file-input" 
              />
            </label>
            
            <button 
              onClick={clearCode} 
              className="clear-button" 
              disabled={!code && !formattedCode}
            >
              <RefreshCw size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>
        
        <div className="formatter-tabs">
          <button 
            className={`tab-button ${selectedTab === 'input' ? 'active' : ''}`}
            onClick={() => setSelectedTab('input')}
          >
            <FileText size={16} />
            <span>Input</span>
          </button>
          <button 
            className={`tab-button ${selectedTab === 'output' ? 'active' : ''}`}
            onClick={() => setSelectedTab('output')}
            disabled={!formattedCode}
          >
            <Code size={16} />
            <span>Output</span>
          </button>
        </div>
        
        <div className="formatter-editor">
          {selectedTab === 'input' ? (
            // Input Editor
            <div className="code-input-container">
              <textarea
                className="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your ${languageOptions.find(l => l.value === language)?.label || 'code'} here...`}
                spellCheck="false"
              />
              <div className="format-button-container">
                <button
                  onClick={formatCode}
                  disabled={!code || isFormatting}
                  className="format-button"
                >
                  {isFormatting ? 'Formatting...' : 'Format Code'}
                </button>
              </div>
            </div>
          ) : (
            // Output Editor with Syntax Highlighting
            <div className="code-output-container">
              <div className="output-actions">
                <button 
                  onClick={copyToClipboard} 
                  className="copy-button" 
                  disabled={!formattedCode}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={downloadCode} 
                  className="download-button" 
                  disabled={!formattedCode}
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
              <pre className="line-numbers language-${language}">
                <code className={`language-${language}`}>
                  {formattedCode}
                </code>
              </pre>
            </div>
          )}
        </div>
        
        {error && (
          <div className={`formatter-message ${error.startsWith('Note:') ? 'info' : 'error'}`}>
            {error}
          </div>
        )}
      </div>
      
      <hr />
      
      <footer>
        <div className="sponsorship-section">
          <p className="footer-support-text">
            If you like this tool, please star the repository on
            <a href="https://github.com/romitagl/web-tools" target="_blank"> GitHub </a>
            and consider sponsoring me on GitHub.
          </p>
          <div className="sponsor-button-container">
            <iframe src="https://github.com/sponsors/romitagl/button" title="Sponsor" width="116" height="35" />
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 romitagl.com. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default CodeFormatter;

import { useState, useEffect } from 'react';
import { 
  FileCode, Info, Copy, Check, Download, RefreshCw, 
  Upload, AlertCircle, ArrowUpDown
} from 'lucide-react';
import Layout from './Layout';

function Base64Tool() {
  const [mode, setMode] = useState('encode'); // 'encode' or 'decode'
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [inputFileName, setInputFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ inputSize: 0, outputSize: 0, ratio: 0 });

  // Process input when it changes
  useEffect(() => {
    if (input) {
      processInput();
    } else {
      setOutput('');
      setStats({ inputSize: 0, outputSize: 0, ratio: 0 });
    }
  }, [input, mode]);

  // Process the input based on the current mode
  const processInput = () => {
    setIsProcessing(true);
    setError('');
    
    try {
      if (mode === 'encode') {
        // Encode to Base64
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
        
        // Calculate stats
        const inputBytes = new Blob([input]).size;
        const outputBytes = new Blob([encoded]).size;
        setStats({
          inputSize: inputBytes,
          outputSize: outputBytes,
          ratio: outputBytes / inputBytes
        });
      } else {
        // Decode from Base64
        // Check if input is valid Base64
        if (!/^[A-Za-z0-9+/=]+$/.test(input.trim())) {
          throw new Error('Invalid Base64 format. Base64 strings only contain A-Z, a-z, 0-9, +, /, and =');
        }
        
        const decoded = decodeURIComponent(escape(atob(input.trim())));
        setOutput(decoded);
        
        // Calculate stats
        const inputBytes = new Blob([input]).size;
        const outputBytes = new Blob([decoded]).size;
        setStats({
          inputSize: inputBytes,
          outputSize: outputBytes,
          ratio: outputBytes / inputBytes
        });
      }
    } catch (err) {
      console.error('Error processing:', err);
      setError(err.message || 'An error occurred while processing the input');
      setOutput('');
      setStats({ inputSize: 0, outputSize: 0, ratio: 0 });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear all input and output
  const clearAll = () => {
    setInput('');
    setOutput('');
    setInputFileName('');
    setError('');
    setCopied(false);
    setStats({ inputSize: 0, outputSize: 0, ratio: 0 });
  };

  // Swap input and output
  const swapInputOutput = () => {
    if (!output) return;
    
    setInput(output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
    // The useEffect will handle updating the output
  };

  // Copy output to clipboard
  const copyToClipboard = () => {
    if (!output) return;
    
    navigator.clipboard.writeText(output)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setError('Failed to copy to clipboard');
      });
  };

  // Download output as a file
  const downloadOutput = () => {
    if (!output) return;
    
    const filename = mode === 'encode' 
      ? `${inputFileName || 'encoded'}.base64.txt` 
      : `${inputFileName || 'decoded'}.txt`;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setInputFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (mode === 'encode') {
        // For encoding text files, read as text
        setInput(e.target.result);
      } else {
        // For decoding Base64, read as text
        setInput(e.target.result);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    // Read as text for both encoding and decoding text
    reader.readAsText(file);
  };

  // Format byte size to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Description for Layout component
  const descriptionElement = (
    <div className="info-banner">
      <div className="info-icon">
        <Info size={20} />
      </div>
      <div className="info-content">
        Encode text to Base64 or decode Base64 to text. All processing happens locally in your browser - no data is sent to any server.
      </div>
    </div>
  );

  return (
    <Layout 
      title="Base64 Encoder/Decoder"
      description={descriptionElement}
    >
      <div className="base64-container">
        <div className="mode-toggle">
          <button 
            className={`mode-button ${mode === 'encode' ? 'active' : ''}`} 
            onClick={() => setMode('encode')}
          >
            Encode to Base64
          </button>
          <button 
            className={`mode-button ${mode === 'decode' ? 'active' : ''}`} 
            onClick={() => setMode('decode')}
          >
            Decode from Base64
          </button>
        </div>
        
        <div className="input-container">
          <div className="input-header">
            <h3>{mode === 'encode' ? 'Text to Encode' : 'Base64 to Decode'}</h3>
            <div className="input-actions">
              <label className="file-upload-button">
                <Upload size={16} />
                <span>Upload File</span>
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  className="hidden-file-input" 
                  accept={mode === 'encode' ? ".txt" : ".txt,.base64,.b64"}
                />
              </label>
              
              <button 
                onClick={clearAll} 
                className="clear-button" 
                disabled={!input && !output}
              >
                <RefreshCw size={16} />
                <span>Clear</span>
              </button>
            </div>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' 
              ? "Enter text to encode to Base64..." 
              : "Enter Base64 to decode..."}
            className="text-input"
          />
          
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="swap-container">
          <button 
            className="swap-button" 
            onClick={swapInputOutput}
            disabled={!output}
          >
            <ArrowUpDown size={20} />
            <span>Swap</span>
          </button>
        </div>
        
        <div className="output-container">
          <div className="output-header">
            <h3>{mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}</h3>
            <div className="output-actions">
              <button 
                onClick={copyToClipboard} 
                className={`action-button copy-button ${copied ? 'copied' : ''}`}
                disabled={!output}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={downloadOutput} 
                className="action-button download-button" 
                disabled={!output}
              >
                <Download size={16} />
                <span>Download</span>
              </button>
            </div>
          </div>
          
          <textarea
            value={output}
            readOnly
            className="text-output"
            placeholder={mode === 'encode' 
              ? "Encoded Base64 will appear here..." 
              : "Decoded text will appear here..."}
          />
          
          {output && (
            <div className="stats-container">
              <div className="stats-item">
                <span className="stats-label">Input Size:</span>
                <span className="stats-value">{formatBytes(stats.inputSize)}</span>
              </div>
              <div className="stats-item">
                <span className="stats-label">Output Size:</span>
                <span className="stats-value">{formatBytes(stats.outputSize)}</span>
              </div>
              <div className="stats-item">
                <span className="stats-label">Size Ratio:</span>
                <span className="stats-value">{stats.ratio.toFixed(2)}x</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="info-section">
        <h3>About Base64 Encoding</h3>
        <p>
          Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format by translating it into a radix-64 representation. 
          It's commonly used when there's a need to encode binary data that needs to be stored and transferred over media that are designed to deal with text.
        </p>
        <h4>Common Uses:</h4>
        <ul>
          <li>Embedding binary data in text formats like HTML, CSS, JSON, XML</li>
          <li>Email attachments (MIME format)</li>
          <li>Storing complex data in JSON strings</li>
          <li>Data URIs in web browsers</li>
          <li>Avoiding character encoding issues when transferring data</li>
        </ul>
        <div className="note">
          <strong>Note:</strong> Base64 encoding increases the data size by approximately 33% (a ratio of 4:3) compared to the original data.
        </div>
      </div>
    </Layout>
  );
}

export default Base64Tool;
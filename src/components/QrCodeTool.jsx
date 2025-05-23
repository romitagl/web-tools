import Layout from './Layout'; // Import the new Layout component
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode, Scan, Link as LinkIcon, Wifi, User, Smartphone, ArrowLeft,
  Copy, Download, Check, UploadCloud, RefreshCw, Settings, Info
} from 'lucide-react';
import QRCode from 'qrcode';
// We'll use Html5Qrcode instead of jsQR
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

function QrCodeTool() {
  // QR code options
  const qrTypes = [
    { id: 'url', label: 'URL', icon: <LinkIcon size={18} />, placeholder: 'https://example.com' },
    { id: 'text', label: 'Text', icon: <QrCode size={18} />, placeholder: 'Enter your text here' },
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi size={18} />, placeholder: 'SSID' },
    { id: 'contact', label: 'Contact', icon: <User size={18} />, placeholder: 'Contact details' }
  ];

  // State
  const [qrType, setQrType] = useState('url');
  const [qrValue, setQrValue] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [qrSize, setQrSize] = useState(200);
  const [qrImageData, setQrImageData] = useState('');
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'scan'
  const [scanResult, setScanResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [scanWithCamera, setScanWithCamera] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // For Wi-Fi specific inputs
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // For Contact specific inputs
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');

  // Refs
  const qrCanvasRef = useRef(null);
  const scannerDivRef = useRef(null); // For Html5Qrcode scanner
  const html5QrCodeRef = useRef(null); // To store the Html5Qrcode instance
  const fileInputRef = useRef(null);

  // Clear all inputs
  const clearAll = () => {
    setQrValue('');
    setWifiName('');
    setWifiPassword('');
    setWifiEncryption('WPA');
    setWifiHidden(false);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactAddress('');
    setQrImageData('');
    setScanResult('');
    setErrorMessage('');
    setCopied(false);
    setSelectedFile(null);
  };

  // Format QR value based on type
  const formatQrValue = () => {
    switch (qrType) {
      case 'wifi':
        // Format: WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;H:<true|false>;;
        return `WIFI:S:${wifiName};T:${wifiEncryption};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      case 'contact':
        // Format vCard
        let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
        if (contactName) vCard += `FN:${contactName}\n`;
        if (contactEmail) vCard += `EMAIL:${contactEmail}\n`;
        if (contactPhone) vCard += `TEL:${contactPhone}\n`;
        if (contactAddress) vCard += `ADR:;;${contactAddress};;;;\n`;
        vCard += 'END:VCARD';
        return vCard;
      default:
        return qrValue;
    }
  };

  // Add a handleTabClick function to update the URL hash
  const handleTabClick = (tab) => {
    if (tab !== activeTab) {
      if (isScanning) {
        stopScanner();
      }
      setActiveTab(tab);
      clearAll();
      window.history.replaceState(null, null, `#${tab}`);
    }
  };

  // Read hash from URL on component mount
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === 'generate' || hash === 'scan') {
      setActiveTab(hash);
    }
  }, []);

  // Generate QR code
  const generateQrCode = async () => {
    setErrorMessage('');
    setIsGenerating(true);

    try {
      // Validate inputs based on type
      if (qrType === 'url' && !qrValue) {
        throw new Error('Please enter a URL');
      } else if (qrType === 'text' && !qrValue) {
        throw new Error('Please enter some text');
      } else if (qrType === 'wifi' && !wifiName) {
        throw new Error('Please enter the Wi-Fi name (SSID)');
      } else if (qrType === 'contact' && !(contactName || contactEmail || contactPhone)) {
        throw new Error('Please enter at least one contact detail');
      }

      // Get formatted value
      const value = formatQrValue();

      // Generate QR code using qrcode.js library
      const options = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: qrColor,
          light: qrBgColor
        },
        width: qrSize
      };

      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(value, options);

      // Set the image data
      setQrImageData(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setErrorMessage(error.message || 'Error generating QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Start camera scanner using Html5Qrcode
  const startScanner = async () => {
    setScanResult('');
    setErrorMessage('');
    setIsScanning(true);
    setScanWithCamera(true);

    try {
      if (!Html5Qrcode) {
        throw new Error('QR code scanner library not loaded');
      }

      // Ensure the scanner div exists before continuing
      setTimeout(() => {
        try {
          // Don't use a direct HTML ID lookup - use the ref
          if (!scannerDivRef.current) {
            throw new Error('Scanner container not available');
          }

          // Create a new instance of Html5Qrcode
          const html5QrCode = new Html5Qrcode(scannerDivRef.current.id);
          html5QrCodeRef.current = html5QrCode;

          // Config for QR code scanning
          // Config for QR code scanning
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            // Replace with correct format reference
            formatsToSupport: [Html5QrcodeScanType.QR_CODE]
          };

          // Success callback when QR code is detected
          const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            console.log(`QR Code detected: ${decodedText}`, decodedResult);
            setScanResult(decodedText);
            stopScanner();
          };

          // Start scanning
          html5QrCode.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            (errorMessage) => {
              // This is a non-blocking error, we'll just log it and continue scanning
              console.log("QR Code scanning error:", errorMessage);
            }
          ).catch(err => {
            console.error("Error starting camera:", err);
            setErrorMessage(`Error starting camera: ${err.message}`);
            setIsScanning(false);
          });

          // Set a timeout to stop scanning after 15 seconds if no QR code is detected
          setTimeout(() => {
            if (isScanning && html5QrCodeRef.current) {
              setErrorMessage("Scanning timed out after 15 seconds. Please try again or use the file upload option.");
              stopScanner();
            }
          }, 15000);
        } catch (error) {
          console.error('Error starting QR code scanner:', error);
          setIsScanning(false);
          setScanWithCamera(false);
          setErrorMessage(error.message || 'Error starting QR code scanner');
        }
      }, 500); // Small delay to ensure DOM is ready
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsScanning(false);
      setScanWithCamera(false);
      setErrorMessage(error.message || 'Error accessing camera');
    }
  };

  // Stop the scanner
  const stopScanner = () => {
    console.log("Stopping scanner");
    if (html5QrCodeRef.current) {
      if (html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop()
          .then(() => {
            console.log('QR Code scanning stopped');
            setIsScanning(false);
            setScanWithCamera(false);
          })
          .catch(err => {
            console.error('Error stopping QR Code scanner:', err);
            // Force state update even if there's an error
            setIsScanning(false);
            setScanWithCamera(false);
          });
      } else {
        setIsScanning(false);
        setScanWithCamera(false);
      }
    } else {
      setIsScanning(false);
      setScanWithCamera(false);
    }
  };

  // Handle file upload for QR code scanning
  const handleFileUpload = (event) => {
    setScanResult('');
    setErrorMessage('');

    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create a file reader to read the image
    const reader = new FileReader();

    reader.onload = (e) => {
      // Once the file is loaded, create or get an html5QrCode instance
      let html5QrCode;

      if (html5QrCodeRef.current) {
        html5QrCode = html5QrCodeRef.current;
      } else {
        // Create a new instance if one doesn't exist yet
        html5QrCode = new Html5Qrcode("qr-reader-file");
        html5QrCodeRef.current = html5QrCode;
      }

      // We need to provide the file directly to the scanFile method
      html5QrCode.scanFile(file, true)
        .then(decodedText => {
          // Success - we found a QR code
          console.log("QR Code detected from file:", decodedText);
          setScanResult(decodedText);
        })
        .catch(err => {
          // Error - no QR code found
          console.error("Error scanning file:", err);
          setErrorMessage('No QR code found in the image or the image could not be processed');
        });
    };

    reader.onerror = () => {
      setErrorMessage('Error reading the file');
    };

    // Start reading the file
    reader.readAsDataURL(file);
  };

  // Copy scan result to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(scanResult)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setErrorMessage('Failed to copy to clipboard');
      });
  };

  // Download QR code
  const downloadQrCode = () => {
    if (!qrImageData) return;

    const link = document.createElement('a');
    link.href = qrImageData;
    link.download = `qrcode-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop()
          .then(() => {
            console.log('QR Code scanner successfully stopped on component unmount');
          })
          .catch(err => {
            console.error('Error stopping QR Code scanner:', err);
          });
      }
    };
  }, []);

  // Create the description element for the Layout
  const descriptionElement = (
    <div className="info-banner">
      <div className="info-icon">
        <Info size={20} />
      </div>
      <div className="info-content">
        Create and scan QR codes instantly. Generate QR codes for URLs, text, Wi-Fi credentials, and contact information.
        All processing happens in your browser - no data is sent to servers.
      </div>
    </div>
  );

  // Return the component using the Layout
  return (
    <Layout
      title="QR Code Generator & Scanner"
      description={descriptionElement}
    >

      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => handleTabClick('generate')}
        >
          <QrCode size={18} />
          Generate QR Code
        </button>
        <button
          className={`tab-button ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => handleTabClick('scan')}
        >
          <Scan size={18} />
          Scan QR Code
        </button>
      </div>

      <div className="qr-container">
        {activeTab === 'generate' ? (
          // QR Code Generator
          <div className="generator-section">
            <div className="qr-code-type">
              <h3>QR Code Type:</h3>
              <div className="type-buttons">
                {qrTypes.map(type => (
                  <button
                    key={type.id}
                    className={`type-button ${qrType === type.id ? 'active' : ''}`}
                    onClick={() => {
                      setQrType(type.id);
                      clearAll();
                    }}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              {qrType === 'url' && (
                <div className="input-group">
                  <label htmlFor="url-input">URL:</label>
                  <input
                    id="url-input"
                    type="url"
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    placeholder="https://example.com"
                    className="text-input"
                  />
                </div>
              )}

              {qrType === 'text' && (
                <div className="input-group">
                  <label htmlFor="text-input">Text:</label>
                  <textarea
                    id="text-input"
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    placeholder="Enter your text here"
                    className="textarea-input"
                    rows="4"
                  />
                </div>
              )}

              {qrType === 'wifi' && (
                <>
                  <div className="input-group">
                    <label htmlFor="wifi-name">Network Name (SSID):</label>
                    <input
                      id="wifi-name"
                      type="text"
                      value={wifiName}
                      onChange={(e) => setWifiName(e.target.value)}
                      placeholder="Enter WiFi name"
                      className="text-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="wifi-password">Password:</label>
                    <input
                      id="wifi-password"
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Enter WiFi password"
                      className="text-input"
                    />
                  </div>

                  <div className="input-row">
                    <div className="input-group half-width">
                      <label htmlFor="wifi-encryption">Encryption:</label>
                      <select
                        id="wifi-encryption"
                        value={wifiEncryption}
                        onChange={(e) => setWifiEncryption(e.target.value)}
                        className="select-input"
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="">None</option>
                      </select>
                    </div>

                    <div className="input-group half-width checkbox-group">
                      <label htmlFor="wifi-hidden" className="checkbox-label">
                        <input
                          id="wifi-hidden"
                          type="checkbox"
                          checked={wifiHidden}
                          onChange={(e) => setWifiHidden(e.target.checked)}
                          className="checkbox-input"
                        />
                        <span>Hidden Network</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {qrType === 'contact' && (
                <>
                  <div className="input-group">
                    <label htmlFor="contact-name">Name:</label>
                    <input
                      id="contact-name"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full Name"
                      className="text-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="contact-email">Email:</label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="text-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="contact-phone">Phone:</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 (123) 456-7890"
                      className="text-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="contact-address">Address:</label>
                    <textarea
                      id="contact-address"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="Street, City, State, ZIP"
                      className="textarea-input"
                      rows="2"
                    />
                  </div>
                </>
              )}

              <div className="advanced-options-toggle" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                <Settings size={16} />
                <span>{showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}</span>
              </div>

              {showAdvancedOptions && (
                <div className="advanced-options">
                  <div className="input-row">
                    <div className="input-group half-width">
                      <label htmlFor="qr-color">QR Color:</label>
                      <div className="color-input-container">
                        <input
                          id="qr-color"
                          type="color"
                          value={qrColor}
                          onChange={(e) => setQrColor(e.target.value)}
                          className="color-input"
                        />
                        <span className="color-value">{qrColor}</span>
                      </div>
                    </div>

                    <div className="input-group half-width">
                      <label htmlFor="qr-bg-color">Background:</label>
                      <div className="color-input-container">
                        <input
                          id="qr-bg-color"
                          type="color"
                          value={qrBgColor}
                          onChange={(e) => setQrBgColor(e.target.value)}
                          className="color-input"
                        />
                        <span className="color-value">{qrBgColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="qr-size">Size: {qrSize}px</label>
                    <input
                      id="qr-size"
                      type="range"
                      min="100"
                      max="500"
                      step="50"
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="range-input"
                    />
                  </div>
                </div>
              )}

              <div className="button-group">
                <button
                  onClick={generateQrCode}
                  disabled={isGenerating}
                  className="generate-button"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={18} className="spinner" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={18} />
                      <span>Generate QR Code</span>
                    </>
                  )}
                </button>

                <button onClick={clearAll} className="reset-button">
                  <RefreshCw size={18} />
                  <span>Reset</span>
                </button>
              </div>

              {errorMessage && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )}
            </div>

            {qrImageData && (
              <div className="qr-result">
                <div className="qr-image-container">
                  <img src={qrImageData} alt="Generated QR Code" className="qr-image" />
                </div>

                <div className="qr-actions">
                  <button onClick={downloadQrCode} className="qr-action-button">
                    <Download size={18} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // QR Code Scanner
          <div className="scanner-section">
            <div className="scan-options-container">
              <div className="camera-option">
                <label>
                  <input
                    type="checkbox"
                    checked={scanWithCamera}
                    onChange={() => setScanWithCamera(!scanWithCamera)}
                  />
                  Scan with Camera
                </label>
              </div>

              {scanWithCamera && (
                <button
                  onClick={scanWithCamera ? (isScanning ? stopScanner : startScanner) : null}
                  className="generate-button"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={18} className="spinner" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone size={18} />
                      <span>Start Camera</span>
                    </>
                  )}
                </button>
              )}

              <div className="or-divider">OR</div>

              <div className="file-upload-container">
                <div className="custom-file-upload">
                  <label className="file-upload-button">
                    Upload QR Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="file-name-display">
                    {selectedFile ? selectedFile.name : 'no file selected'}
                  </span>
                </div>
              </div>
            </div>

            {/* HTML5 QR Code Scanner Container */}
            {scanWithCamera && isScanning && (
              <div
                id="qr-reader"
                ref={(el) => {
                  scannerDivRef.current = el;
                  // Ensure the element has an ID
                  if (el) el.id = "qr-reader";
                }}
                style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}
              ></div>
            )}

            {/* Hidden element for file scanning */}
            <div
              id="qr-reader-file"
              ref={(el) => {
                if (el) {
                  // Ensure the element has the correct ID
                  el.id = "qr-reader-file";
                }
              }}
              style={{ display: 'none' }}
            ></div>

            {scanResult && (
              <div className="scan-result">
                <h3>Scan Result:</h3>
                <div className="scan-content">
                  {scanResult}
                </div>

                <div className="scan-actions">
                  <button onClick={copyToClipboard} className="qr-action-button">
                    {copied ? (
                      <>
                        <Check size={18} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {scanResult.startsWith('http') && (
                    <a
                      href={scanResult}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="qr-action-button"
                    >
                      <LinkIcon size={18} />
                      <span>Open Link</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default QrCodeTool;
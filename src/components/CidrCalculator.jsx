import Layout from './Layout'; // Import the Layout component
import { useState } from 'react';
import { Calculator, Network, ServerCrash, Check, Info, ArrowLeft, RefreshCw, Copy, ChevronDown, ChevronUp, Layers, Grid, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

function CidrCalculator() {
  // Tab state
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' or 'subnet-creator'

  // Calculator tab states
  const [ipAddress, setIpAddress] = useState('');
  const [cidrNotation, setCidrNotation] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Subnet creator tab states
  const [baseNetwork, setBaseNetwork] = useState('');
  const [baseCidr, setBaseCidr] = useState('');
  const [subnetMode, setSubnetMode] = useState('count'); // 'count' or 'size'
  const [subnetCount, setSubnetCount] = useState('');
  const [subnetSize, setSubnetSize] = useState('');
  const [subnetResults, setSubnetResults] = useState(null);
  const [subnetError, setSubnetError] = useState('');
  const [creatingSubnets, setCreatingSubnets] = useState(false);

  // Helper function to validate IP address
  const isValidIp = (ip) => {
    const ipPattern = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipPattern.test(ip);
  };

  // Helper function to validate CIDR notation
  const isValidCidr = (cidr) => {
    const cidrValue = parseInt(cidr, 10);
    return !isNaN(cidrValue) && cidrValue >= 0 && cidrValue <= 32;
  };

  // Convert IP address to binary
  const ipToBinary = (ip) => {
    return ip.split('.')
      .map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
      .join('');
  };

  // Convert binary to IP address
  const binaryToIp = (binary) => {
    const octets = [];
    for (let i = 0; i < 32; i += 8) {
      octets.push(parseInt(binary.substr(i, 8), 2));
    }
    return octets.join('.');
  };

  // Calculate new CIDR prefix based on subnet count or size
  const calculateNewPrefix = (currentPrefix, mode, value) => {
    if (mode === 'count') {
      // Calculate bits needed for the number of subnets
      const subnetsRequested = parseInt(value, 10);
      const bitsNeeded = Math.ceil(Math.log2(subnetsRequested));
      return currentPrefix + bitsNeeded;
    } else {
      // Calculate from required host count (add 2 for network and broadcast addresses)
      const hostsRequested = parseInt(value, 10);
      const bitsNeeded = Math.ceil(Math.log2(hostsRequested + 2));
      return 32 - bitsNeeded;
    }
  };

  // Calculate subnet details (for main calculator)
  const calculateSubnet = () => {
    setCalculating(true);
    setError('');
    setResult(null);
    setCopied(false);

    // Simple validation
    if (!ipAddress || !cidrNotation) {
      setError('Please enter both IP address and CIDR prefix.');
      setCalculating(false);
      return;
    }

    // Validate IP address format
    if (!isValidIp(ipAddress)) {
      setError('Invalid IP address format. Please enter a valid IPv4 address.');
      setCalculating(false);
      return;
    }

    // Validate CIDR notation
    if (!isValidCidr(cidrNotation)) {
      setError('Invalid CIDR prefix. Must be a number between 0 and 32.');
      setCalculating(false);
      return;
    }

    // Convert IP to binary
    const ipBinary = ipToBinary(ipAddress);
    const cidrPrefix = parseInt(cidrNotation, 10);

    // Calculate subnet mask binary
    const subnetMaskBinary = '1'.repeat(cidrPrefix).padEnd(32, '0');

    // Calculate network address binary
    const networkBinary = ipBinary.substring(0, cidrPrefix).padEnd(32, '0');

    // Calculate broadcast address binary
    const broadcastBinary = ipBinary.substring(0, cidrPrefix).padEnd(32, '1');

    // Convert binary addresses to decimal notation
    const subnetMask = binaryToIp(subnetMaskBinary);
    const networkAddress = binaryToIp(networkBinary);
    const broadcastAddress = binaryToIp(broadcastBinary);

    // Calculate first and last usable IP addresses
    const totalIPs = Math.pow(2, 32 - cidrPrefix);
    let firstUsableIp = networkAddress;
    let lastUsableIp = broadcastAddress;

    // If subnet has more than 2 IPs, adjust usable range
    if (totalIPs > 2) {
      // For network address, split and increment the last octet by 1
      const firstIpParts = networkAddress.split('.');
      firstIpParts[3] = parseInt(firstIpParts[3], 10) + 1;
      firstUsableIp = firstIpParts.join('.');

      // For broadcast address, split and decrement the last octet by 1
      const lastIpParts = broadcastAddress.split('.');
      lastIpParts[3] = parseInt(lastIpParts[3], 10) - 1;
      lastUsableIp = lastIpParts.join('.');
    }

    // Calculate total usable hosts
    let usableHosts = totalIPs - 2;
    if (usableHosts < 0) usableHosts = 0; // Handle special cases like /31 and /32

    // Format IP range for easy reading
    const ipRange = `${firstUsableIp} - ${lastUsableIp}`;

    // Wildcard mask
    const wildcardParts = subnetMask.split('.').map(octet => 255 - parseInt(octet, 10));
    const wildcardMask = wildcardParts.join('.');

    // Create result object
    const calculationResult = {
      networkAddress,
      broadcastAddress,
      subnetMask,
      wildcardMask,
      cidrNotation: `/${cidrPrefix}`,
      totalIPs,
      usableHosts,
      ipRange,
      firstUsableIp,
      lastUsableIp,
      binarySubnetMask: subnetMaskBinary.match(/.{1,8}/g).join('.'),
      binaryIp: ipBinary.match(/.{1,8}/g).join('.')
    };

    // Simulate a little processing time
    setTimeout(() => {
      setResult(calculationResult);
      setCalculating(false);
    }, 600);
  };

  // Create subnets from base network
  const createSubnets = () => {
    setCreatingSubnets(true);
    setSubnetError('');
    setSubnetResults(null);

    // Validate inputs
    if (!baseNetwork || !baseCidr) {
      setSubnetError('Please enter both base network address and CIDR prefix.');
      setCreatingSubnets(false);
      return;
    }

    // Validate IP address format
    if (!isValidIp(baseNetwork)) {
      setSubnetError('Invalid network address format. Please enter a valid IPv4 address.');
      setCreatingSubnets(false);
      return;
    }

    // Validate CIDR notation
    if (!isValidCidr(baseCidr)) {
      setSubnetError('Invalid CIDR prefix. Must be a number between 0 and 32.');
      setCreatingSubnets(false);
      return;
    }

    const baseCidrNum = parseInt(baseCidr, 10);

    // Validate subnet mode inputs
    if (subnetMode === 'count' && (!subnetCount || isNaN(parseInt(subnetCount, 10)) || parseInt(subnetCount, 10) <= 0)) {
      setSubnetError('Please enter a valid number of subnets (must be greater than 0).');
      setCreatingSubnets(false);
      return;
    }

    if (subnetMode === 'size' && (!subnetSize || isNaN(parseInt(subnetSize, 10)) || parseInt(subnetSize, 10) <= 0)) {
      setSubnetError('Please enter a valid subnet size (must be greater than 0).');
      setCreatingSubnets(false);
      return;
    }

    try {
      // Calculate the new CIDR prefix for subnets
      let newCidrPrefix;
      let actualSubnetCount;

      if (subnetMode === 'count') {
        newCidrPrefix = calculateNewPrefix(baseCidrNum, 'count', subnetCount);
        actualSubnetCount = Math.pow(2, newCidrPrefix - baseCidrNum);

        // Validate if the new prefix exceeds 30 (minimum practical subnet size in most cases)
        if (newCidrPrefix > 30) {
          setSubnetError(`Creating ${subnetCount} subnets would result in a CIDR prefix larger than /30, which is too small for practical use.`);
          setCreatingSubnets(false);
          return;
        }
      } else {
        // Size mode
        newCidrPrefix = calculateNewPrefix(baseCidrNum, 'size', subnetSize);
        actualSubnetCount = Math.pow(2, newCidrPrefix - baseCidrNum);

        // Validate if the new prefix can fit within the base network
        if (newCidrPrefix < baseCidrNum) {
          setSubnetError(`The requested subnet size is larger than the base network. Please use a smaller subnet size.`);
          setCreatingSubnets(false);
          return;
        }
      }

      // Get the base network in binary
      const baseNetworkBinary = ipToBinary(baseNetwork).substring(0, baseCidrNum).padEnd(32, '0');
      const baseNetworkDecimal = binaryToIp(baseNetworkBinary);

      // Create the subnets
      const subnets = [];
      const blockSize = Math.pow(2, 32 - newCidrPrefix);
      const baseIpInt = ipToInt(baseNetworkDecimal);

      for (let i = 0; i < actualSubnetCount; i++) {
        const subnetIpInt = baseIpInt + (i * blockSize);
        const subnetIp = intToIp(subnetIpInt);
        const subnetBroadcastInt = subnetIpInt + blockSize - 1;
        const subnetBroadcast = intToIp(subnetBroadcastInt);

        // Calculate first and last usable IPs
        let firstUsable = subnetIp;
        let lastUsable = subnetBroadcast;

        // Adjust usable IPs for normal subnets (not /31 or /32)
        if (newCidrPrefix < 31) {
          firstUsable = intToIp(subnetIpInt + 1);
          lastUsable = intToIp(subnetBroadcastInt - 1);
        }

        const subnetMask = cidrToSubnetMask(newCidrPrefix);
        const totalIPs = Math.pow(2, 32 - newCidrPrefix);
        const usableHosts = newCidrPrefix >= 31 ? totalIPs : totalIPs - 2;

        subnets.push({
          name: `Subnet ${i + 1}`,
          network: subnetIp,
          broadcast: subnetBroadcast,
          cidr: `/${newCidrPrefix}`,
          subnetMask,
          totalIPs,
          usableHosts,
          firstUsable,
          lastUsable,
          ipRange: `${firstUsable} - ${lastUsable}`
        });
      }

      // Create results object
      const results = {
        baseNetwork: baseNetworkDecimal,
        baseCidr: `/${baseCidrNum}`,
        newCidr: `/${newCidrPrefix}`,
        subnetCount: actualSubnetCount,
        requestedSubnetCount: subnetMode === 'count' ? parseInt(subnetCount, 10) : null,
        requestedSubnetSize: subnetMode === 'size' ? parseInt(subnetSize, 10) : null,
        subnets
      };

      // Simulate processing time
      setTimeout(() => {
        setSubnetResults(results);
        setCreatingSubnets(false);
      }, 600);

    } catch (error) {
      console.error('Error creating subnets:', error);
      setSubnetError(`An error occurred: ${error.message || 'Unknown error'}`);
      setCreatingSubnets(false);
    }
  };

  // Helper to convert CIDR to subnet mask
  const cidrToSubnetMask = (cidr) => {
    const maskBinary = '1'.repeat(cidr).padEnd(32, '0');
    return binaryToIp(maskBinary);
  };

  // Helper to convert IP to integer
  const ipToInt = (ip) => {
    const parts = ip.split('.');
    return (parseInt(parts[0], 10) << 24) |
      (parseInt(parts[1], 10) << 16) |
      (parseInt(parts[2], 10) << 8) |
      parseInt(parts[3], 10);
  };

  // Helper to convert integer to IP
  const intToIp = (int) => {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join('.');
  };

  const resetCalculator = () => {
    if (activeTab === 'calculator') {
      setIpAddress('');
      setCidrNotation('');
      setResult(null);
      setError('');
      setCopied(false);
    } else {
      setBaseNetwork('');
      setBaseCidr('');
      setSubnetCount('');
      setSubnetSize('');
      setSubnetResults(null);
      setSubnetError('');
    }
  };

  const copyToClipboard = (content) => {
    if (!content) return;

    navigator.clipboard.writeText(content)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const copyMainResults = () => {
    if (!result) return;

    // Format result as plain text
    const textToCopy = `
CIDR Calculation Results:
IP Address: ${ipAddress}${result.cidrNotation}
Network Address: ${result.networkAddress}
Broadcast Address: ${result.broadcastAddress}
Subnet Mask: ${result.subnetMask}
Wildcard Mask: ${result.wildcardMask}
Total IPs: ${result.totalIPs.toLocaleString()}
Usable Hosts: ${result.usableHosts.toLocaleString()}
IP Range: ${result.ipRange}
    `.trim();

    copyToClipboard(textToCopy);
  };

  const copySubnetResults = () => {
    if (!subnetResults) return;

    // Format subnet results as plain text
    let textToCopy = `
Base Network: ${subnetResults.baseNetwork}${subnetResults.baseCidr}
Subnet CIDR: ${subnetResults.newCidr}
Number of Subnets: ${subnetResults.subnetCount}
`;

    if (subnetResults.requestedSubnetCount) {
      textToCopy += `Requested Subnet Count: ${subnetResults.requestedSubnetCount}\n`;
    }

    if (subnetResults.requestedSubnetSize) {
      textToCopy += `Requested Subnet Size: ${subnetResults.requestedSubnetSize} IPs\n`;
    }

    textToCopy += '\nSubnet Details:\n';

    subnetResults.subnets.forEach((subnet, index) => {
      textToCopy += `
Subnet ${index + 1}:
  Network: ${subnet.network}${subnet.cidr}
  Broadcast: ${subnet.broadcast}
  Subnet Mask: ${subnet.subnetMask}
  Total IPs: ${subnet.totalIPs}
  Usable Hosts: ${subnet.usableHosts}
  IP Range: ${subnet.ipRange}
`;
    });

    copyToClipboard(textToCopy.trim());
  };

  // Create description element for the Layout
  const descriptionElement = (
    <div className="info-box">
      <Info size={20} />
      <p>
        Calculate subnet information or create subnet allocations similar to AWS VPC. All calculations are performed locally in your browser.
      </p>
    </div>
  );

  return (
    <Layout
      title="CIDR Subnet Calculator"
      description={descriptionElement}
    >

      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={18} />
          CIDR Calculator
        </button>
        <button
          className={`tab-button ${activeTab === 'subnet-creator' ? 'active' : ''}`}
          onClick={() => setActiveTab('subnet-creator')}
        >
          <Layers size={18} />
          Subnet Creator
        </button>
      </div>

      <div className="calculator-container">
        {activeTab === 'calculator' && (
          <>
            <div className="input-section">
              <div className="input-group">
                <label htmlFor="ip-address">IP Address</label>
                <div className="input-with-icon">
                  <Network size={18} className="input-icon" />
                  <input
                    id="ip-address"
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="e.g., 192.168.1.1"
                    className="text-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="cidr-prefix">CIDR Prefix</label>
                <div className="input-with-icon">
                  <Calculator size={18} className="input-icon" />
                  <input
                    id="cidr-prefix"
                    type="text"
                    value={cidrNotation}
                    onChange={(e) => setCidrNotation(e.target.value)}
                    placeholder="e.g., 24"
                    className="text-input"
                  />
                </div>
              </div>

              <div className="button-group">
                <button
                  onClick={calculateSubnet}
                  disabled={calculating}
                  className="calculate-button"
                >
                  {calculating ? (
                    <>
                      <ServerCrash size={18} className="spinner" />
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <Calculator size={18} />
                      <span>Calculate</span>
                    </>
                  )}
                </button>

                <button onClick={resetCalculator} className="reset-button">
                  <RefreshCw size={18} />
                  <span>Reset</span>
                </button>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>

            {result && (
              <div className="result-section">
                <div className="result-header">
                  <h3>Calculation Results</h3>
                  <button onClick={copyMainResults} className="copy-button">
                    {copied ? (
                      <>
                        <Check size={18} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>Copy Results</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="result-grid">
                  <div className="result-item">
                    <span className="result-label">Network Address:</span>
                    <span className="result-value">{result.networkAddress}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">Broadcast Address:</span>
                    <span className="result-value">{result.broadcastAddress}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">Subnet Mask:</span>
                    <span className="result-value">{result.subnetMask}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">CIDR Notation:</span>
                    <span className="result-value">{result.cidrNotation}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">Total IPs:</span>
                    <span className="result-value">{result.totalIPs.toLocaleString()}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">Usable Hosts:</span>
                    <span className="result-value">{result.usableHosts.toLocaleString()}</span>
                  </div>

                  <div className="result-item full-width">
                    <span className="result-label">IP Range:</span>
                    <span className="result-value">{result.ipRange}</span>
                  </div>

                  <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <span>Advanced Details</span>
                  </div>

                  {showAdvanced && (
                    <>
                      <div className="result-item">
                        <span className="result-label">Wildcard Mask:</span>
                        <span className="result-value">{result.wildcardMask}</span>
                      </div>

                      <div className="result-item">
                        <span className="result-label">First Usable IP:</span>
                        <span className="result-value">{result.firstUsableIp}</span>
                      </div>

                      <div className="result-item">
                        <span className="result-label">Last Usable IP:</span>
                        <span className="result-value">{result.lastUsableIp}</span>
                      </div>

                      <div className="result-item">
                        <span className="result-label">IP (Binary):</span>
                        <span className="result-value monospace">{result.binaryIp}</span>
                      </div>

                      <div className="result-item">
                        <span className="result-label">Subnet Mask (Binary):</span>
                        <span className="result-value monospace">{result.binarySubnetMask}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'subnet-creator' && (
          <>
            <div className="input-section subnet-creator-section">
              <div className="subnet-base-inputs">
                <div className="input-group">
                  <label htmlFor="base-network">Base Network Address</label>
                  <div className="input-with-icon">
                    <Network size={18} className="input-icon" />
                    <input
                      id="base-network"
                      type="text"
                      value={baseNetwork}
                      onChange={(e) => setBaseNetwork(e.target.value)}
                      placeholder="e.g., 10.0.0.0"
                      className="text-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="base-cidr">Base CIDR Prefix</label>
                  <div className="input-with-icon">
                    <Calculator size={18} className="input-icon" />
                    <input
                      id="base-cidr"
                      type="text"
                      value={baseCidr}
                      onChange={(e) => setBaseCidr(e.target.value)}
                      placeholder="e.g., 16"
                      className="text-input"
                    />
                  </div>
                </div>
              </div>

              <div className="subnet-mode-selector">
                <label>Subnet Creation Mode</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="subnet-mode"
                      checked={subnetMode === 'count'}
                      onChange={() => setSubnetMode('count')}
                    />
                    <span>Number of Subnets</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="subnet-mode"
                      checked={subnetMode === 'size'}
                      onChange={() => setSubnetMode('size')}
                    />
                    <span>Subnet Size (IPs)</span>
                  </label>
                </div>
              </div>

              {subnetMode === 'count' ? (
                <div className="input-group">
                  <label htmlFor="subnet-count">Number of Subnets</label>
                  <div className="input-with-icon">
                    <Grid size={18} className="input-icon" />
                    <input
                      id="subnet-count"
                      type="number"
                      min="1"
                      value={subnetCount}
                      onChange={(e) => setSubnetCount(e.target.value)}
                      placeholder="e.g., 4"
                      className="text-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label htmlFor="subnet-size">IPs per Subnet</label>
                  <div className="input-with-icon">
                    <Layers size={18} className="input-icon" />
                    <input
                      id="subnet-size"
                      type="number"
                      min="1"
                      value={subnetSize}
                      onChange={(e) => setSubnetSize(e.target.value)}
                      placeholder="e.g., 256"
                      className="text-input"
                    />
                  </div>
                </div>
              )}

              <div className="subnet-info-note">
                <AlertTriangle size={16} />
                <span>
                  {subnetMode === 'count'
                    ? 'Subnets will be created with equal sizes based on the number requested.'
                    : 'Subnets will be created to accommodate at least the requested number of IPs.'}
                </span>
              </div>

              <div className="button-group">
                <button
                  onClick={createSubnets}
                  disabled={creatingSubnets}
                  className="calculate-button"
                >
                  {creatingSubnets ? (
                    <>
                      <ServerCrash size={18} className="spinner" />
                      <span>Creating Subnets...</span>
                    </>
                  ) : (
                    <>
                      <Layers size={18} />
                      <span>Create Subnets</span>
                    </>
                  )}
                </button>

                <button onClick={resetCalculator} className="reset-button">
                  <RefreshCw size={18} />
                  <span>Reset</span>
                </button>
              </div>

              {subnetError && (
                <div className="error-message">
                  {subnetError}
                </div>
              )}
            </div>

            {subnetResults && (
              <div className="result-section subnet-results-section">
                <div className="result-header">
                  <h3>Subnet Allocation Results</h3>
                  <button onClick={copySubnetResults} className="copy-button">
                    {copied ? (
                      <>
                        <Check size={18} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>Copy Results</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="subnet-summary">
                  <div className="summary-item">
                    <span className="summary-label">Base Network:</span>
                    <span className="summary-value">{subnetResults.baseNetwork}{subnetResults.baseCidr}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Subnet CIDR:</span>
                    <span className="summary-value">{subnetResults.newCidr}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Number of Subnets:</span>
                    <span className="summary-value">{subnetResults.subnetCount}</span>
                  </div>
                  {subnetMode === 'count' && subnetResults.requestedSubnetCount && (
                    <div className="summary-item">
                      <span className="summary-label">Requested Subnets:</span>
                      <span className="summary-value">{subnetResults.requestedSubnetCount}</span>
                    </div>
                  )}
                  {subnetMode === 'size' && subnetResults.requestedSubnetSize && (
                    <div className="summary-item">
                      <span className="summary-label">Requested IPs per Subnet:</span>
                      <span className="summary-value">{subnetResults.requestedSubnetSize}</span>
                    </div>
                  )}
                </div>

                <div className="subnet-list">
                  <h4>Subnet Details</h4>
                  <div className="subnet-table-container">
                    <table className="subnet-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Network</th>
                          <th>CIDR</th>
                          <th>Usable IPs</th>
                          <th>IP Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subnetResults.subnets.map((subnet, index) => (
                          <tr key={index}>
                            <td>{subnet.name}</td>
                            <td>{subnet.network}</td>
                            <td>{subnet.cidr}</td>
                            <td>{subnet.usableHosts.toLocaleString()}</td>
                            <td className="ip-range-cell">{subnet.ipRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="subnet-note">
                    <Info size={16} />
                    <span>
                      Each subnet has {subnetResults.subnets[0].totalIPs.toLocaleString()} total IPs with
                      {' '}{subnetResults.subnets[0].usableHosts.toLocaleString()} usable hosts.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </Layout>
  );
}

export default CidrCalculator;
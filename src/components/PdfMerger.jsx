import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileText, Image, Loader, Check, AlertCircle, Info, UploadCloud, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('pdfs'); // 'pdfs', 'images', 'both'
  const [dragActive, setDragActive] = useState(false);

  const handlePdfChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setPdfFiles([...pdfFiles, ...selectedFiles]);
    setMergeSuccess(false);
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setImageFiles([...imageFiles, ...selectedFiles]);
    setMergeSuccess(false);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      
      if (activeTab === 'pdfs') {
        const pdfList = fileList.filter(file => file.type === 'application/pdf');
        if (pdfList.length > 0) {
          setPdfFiles([...pdfFiles, ...pdfList]);
        }
      } else if (activeTab === 'images') {
        const imageList = fileList.filter(file => 
          file.type === 'image/jpeg' || 
          file.type === 'image/jpg' || 
          file.type === 'image/png'
        );
        if (imageList.length > 0) {
          setImageFiles([...imageFiles, ...imageList]);
        }
      } else if (activeTab === 'both') {
        const pdfList = fileList.filter(file => file.type === 'application/pdf');
        const imageList = fileList.filter(file => 
          file.type === 'image/jpeg' || 
          file.type === 'image/jpg' || 
          file.type === 'image/png'
        );
        
        if (pdfList.length > 0) {
          setPdfFiles([...pdfFiles, ...pdfList]);
        }
        
        if (imageList.length > 0) {
          setImageFiles([...imageFiles, ...imageList]);
        }
      }
      
      setMergeSuccess(false);
    }
  };

  const removeFile = (type, index) => {
    if (type === 'pdf') {
      const newFiles = [...pdfFiles];
      newFiles.splice(index, 1);
      setPdfFiles(newFiles);
    } else {
      const newFiles = [...imageFiles];
      newFiles.splice(index, 1);
      setImageFiles(newFiles);
    }
    setMergeSuccess(false);
  };

  const clearAll = () => {
    if (activeTab === 'pdfs') {
      setPdfFiles([]);
    } else if (activeTab === 'images') {
      setImageFiles([]);
    } else {
      setPdfFiles([]);
      setImageFiles([]);
    }
    setMergeSuccess(false);
  };

  const mergePDFs = async () => {
    setIsMerging(true);
    setMergeSuccess(false);
    
    try {
      const pdfDoc = await PDFDocument.create();

      // Sort files by name
      const sortedFiles = pdfFiles.sort((a, b) => a.name.localeCompare(b.name));

      for (const file of sortedFiles) {
        const fileBytes = await file.arrayBuffer();
        const tempDoc = await PDFDocument.load(fileBytes);
        const copiedPages = await pdfDoc.copyPages(tempDoc, tempDoc.getPageIndices());
        copiedPages.forEach((page) => pdfDoc.addPage(page));
      }

      downloadPDF(await pdfDoc.save(), 'merged-pdfs.pdf');
      setMergeSuccess(true);
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("An error occurred while merging PDF files. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  const mergeImages = async () => {
    setIsMerging(true);
    setMergeSuccess(false);
    
    try {
      const pdfDoc = await PDFDocument.create();

      // Sort files by name
      const sortedFiles = imageFiles.sort((a, b) => a.name.localeCompare(b.name));

      for (const file of sortedFiles) {
        const imgBytes = await file.arrayBuffer();
        let image;

        // Check for supported image types
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          try {
            image = await pdfDoc.embedJpg(imgBytes);
          } catch (error) {
            alert('Error processing JPEG file: ' + file.name + '. ' + error.message);
            continue; // Skip this file and continue with others
          }
        } else if (file.type === 'image/png') {
          try {
            image = await pdfDoc.embedPng(imgBytes);
          } catch (error) {
            alert('Error processing PNG file: ' + file.name + '. ' + error.message);
            continue; // Skip this file and continue with others
          }
        } else {
          alert('Unsupported file type: ' + file.type);
          return;
        }

        // Create a new page for each image
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      downloadPDF(await pdfDoc.save(), 'merged-images.pdf');
      setMergeSuccess(true);
    } catch (error) {
      console.error("Error merging images:", error);
      alert("An error occurred while merging image files. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  const mergePDFsAndImages = async () => {
    setIsMerging(true);
    setMergeSuccess(false);
    
    try {
      const pdfDoc = await PDFDocument.create();

      // Combine and sort files by name
      const allFiles = [...pdfFiles, ...imageFiles].sort((a, b) => a.name.localeCompare(b.name));

      for (const file of allFiles) {
        if (file.type === 'application/pdf') {
          const fileBytes = await file.arrayBuffer();
          const tempDoc = await PDFDocument.load(fileBytes);
          const copiedPages = await pdfDoc.copyPages(tempDoc, tempDoc.getPageIndices());
          copiedPages.forEach((page) => pdfDoc.addPage(page));
        } else if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png') {
          const imgBytes = await file.arrayBuffer();
          let image;

          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            try {
              image = await pdfDoc.embedJpg(imgBytes);
            } catch (error) {
              alert('Error processing JPEG file: ' + file.name + '. ' + error.message);
              continue;
            }
          } else if (file.type === 'image/png') {
            try {
              image = await pdfDoc.embedPng(imgBytes);
            } catch (error) {
              alert('Error processing PNG file: ' + file.name + '. ' + error.message);
              continue;
            }
          }

          // Create a new page for each image
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        } else {
          alert('Unsupported file type: ' + file.type);
          return;
        }
      }

      downloadPDF(await pdfDoc.save(), 'merged-pdfs-and-images.pdf');
      setMergeSuccess(true);
    } catch (error) {
      console.error("Error merging files:", error);
      alert("An error occurred while merging files. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  const downloadPDF = (pdfBytes, filename) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    // Create a link to download the merged PDF
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link); // Append to body to make it work in Firefox
    link.click();
    document.body.removeChild(link); // Clean up
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <h1>Merge PDFs & Images Instantly</h1>
        <h2>100% Private, 100% Free!</h2>
        <p>Runs safely and securely in your browser.</p>
      </div>
      
      <section className="description">
        <div className="info-box">
          <Info size={20} />
          <p>
            Merge PDFs and Images into a single document with ease. Files will be merged in alphabetical order by filename.
          </p>
        </div>
      </section>
      
      <div className="tab-container">
        <button 
          className={`tab-button ${activeTab === 'pdfs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdfs')}
        >
          <FileText size={18} />
          Merge PDFs
        </button>
        <button 
          className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          <Image size={18} />
          Merge Images
        </button>
        <button 
          className={`tab-button ${activeTab === 'both' ? 'active' : ''}`}
          onClick={() => setActiveTab('both')}
        >
          <FileText size={18} />
          <Image size={18} />
          Merge Both
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'pdfs' && (
          <section className="merge-section">
            <div 
              className={`drop-zone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="drop-zone-content">
                <UploadCloud size={48} className="upload-icon" />
                <p>Drag & drop PDF files here, or</p>
                <label className="file-input-label">
                  <span>Choose Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handlePdfChange}
                    className="file-input"
                  />
                </label>
              </div>
            </div>
            
            {pdfFiles.length > 0 && (
              <div className="file-list-container">
                <div className="file-list-header">
                  <h3>Selected PDFs: {pdfFiles.length}</h3>
                  <button onClick={clearAll} className="clear-button">Clear All</button>
                </div>
                
                <div className="file-list">
                  <ul>
                    {pdfFiles.map((file, index) => (
                      <li key={index} className="file-item">
                        <div className="file-info">
                          <FileText size={16} className="file-icon" />
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button 
                          className="remove-file" 
                          onClick={() => removeFile('pdf', index)}
                          aria-label="Remove file"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button
                  onClick={mergePDFs}
                  disabled={pdfFiles.length === 0 || isMerging}
                  className="merge-button"
                >
                  {isMerging ? <Loader className="spinner" /> : 'Merge PDFs'}
                </button>
                
                {mergeSuccess && (
                  <div className="success-message">
                    <Check size={18} />
                    <span>PDFs merged successfully!</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'images' && (
          <section className="merge-section">
            <div 
              className={`drop-zone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="drop-zone-content">
                <UploadCloud size={48} className="upload-icon" />
                <p>Drag & drop image files here, or</p>
                <label className="file-input-label">
                  <span>Choose Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </label>
              </div>
            </div>
            
            {imageFiles.length > 0 && (
              <div className="file-list-container">
                <div className="file-list-header">
                  <h3>Selected Images: {imageFiles.length}</h3>
                  <button onClick={clearAll} className="clear-button">Clear All</button>
                </div>
                
                <div className="file-list">
                  <ul>
                    {imageFiles.map((file, index) => (
                      <li key={index} className="file-item">
                        <div className="file-info">
                          <Image size={16} className="file-icon" />
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button 
                          className="remove-file" 
                          onClick={() => removeFile('image', index)}
                          aria-label="Remove file"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button
                  onClick={mergeImages}
                  disabled={imageFiles.length === 0 || isMerging}
                  className="merge-button"
                >
                  {isMerging ? <Loader className="spinner" /> : 'Merge Images'}
                </button>
                
                {mergeSuccess && (
                  <div className="success-message">
                    <Check size={18} />
                    <span>Images merged successfully!</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'both' && (
          <section className="merge-section">
            <div className="drop-zones-container">
              <div 
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="drop-zone-content">
                  <UploadCloud size={40} className="upload-icon" />
                  <p>Drag & drop files here, or</p>
                  <div className="input-group">
                    <label className="file-input-label">
                      <FileText size={16} />
                      <span>Choose PDFs</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handlePdfChange}
                        className="file-input"
                      />
                    </label>
                    
                    <label className="file-input-label">
                      <Image size={16} />
                      <span>Choose Images</span>
                      <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png"
                        onChange={handleImageChange}
                        className="file-input"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {(pdfFiles.length > 0 || imageFiles.length > 0) && (
              <div className="file-list-container">
                <div className="file-list-header">
                  <h3>Selected Files: {pdfFiles.length + imageFiles.length}</h3>
                  <button onClick={clearAll} className="clear-button">Clear All</button>
                </div>
                
                <div className="file-list">
                  {pdfFiles.length > 0 && (
                    <>
                      <div className="file-category">PDFs ({pdfFiles.length})</div>
                      <ul>
                        {pdfFiles.map((file, index) => (
                          <li key={`pdf-${index}`} className="file-item">
                            <div className="file-info">
                              <FileText size={16} className="file-icon" />
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                            <button 
                              className="remove-file" 
                              onClick={() => removeFile('pdf', index)}
                              aria-label="Remove file"
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  {imageFiles.length > 0 && (
                    <>
                      <div className="file-category">Images ({imageFiles.length})</div>
                      <ul>
                        {imageFiles.map((file, index) => (
                          <li key={`img-${index}`} className="file-item">
                            <div className="file-info">
                              <Image size={16} className="file-icon" />
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                            <button 
                              className="remove-file" 
                              onClick={() => removeFile('image', index)}
                              aria-label="Remove file"
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                
                <div className="merge-info">
                  <AlertCircle size={16} />
                  <span>Files will be merged in alphabetical order by filename.</span>
                </div>
                
                <button
                  onClick={mergePDFsAndImages}
                  disabled={(pdfFiles.length === 0 && imageFiles.length === 0) || isMerging}
                  className="merge-button"
                >
                  {isMerging ? <Loader className="spinner" /> : 'Merge All Files'}
                </button>
                
                {mergeSuccess && (
                  <div className="success-message">
                    <Check size={18} />
                    <span>Files merged successfully!</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
      
      <hr />
      
      <footer>
        <p>
          If you like this tool, please star the repository on{' '}
          <a href="https://github.com/romitagl/web-tools">GitHub</a>&nbsp;
          and consider sponsoring me on GitHub.
        </p>
        <iframe src="https://github.com/sponsors/romitagl/button" title="Sponsor" width="116" height="35" />
      </footer>
    </>
  );
}

export default PdfMerger;
import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileText, Image, Loader } from 'lucide-react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);

  const handlePdfChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setPdfFiles(selectedFiles);
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setImageFiles(selectedFiles);
  };

  const mergePDFs = async () => {
    setIsMerging(true);
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
    setIsMerging(false);
  };

  const mergeImages = async () => {
    setIsMerging(true);
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
    setIsMerging(false);
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

  return (
    <div className="app dark">
      <div className="container">
        <div className="header">
          <div className="logo-container">
            <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <h1>Merge PDFs & Images Instantly</h1>
          <h2>100% Private, 100% Free!</h2>
          <p>Runs safely and securely in your browser.</p>
        </div>
        <section className="description">
          <p>
            Merge PDFs and Images into a Single Document with ease. Documents will be merged in order by sorting the input file names.
          </p>
        </section>
        <hr />
        <section className="merge-section">
          <h2 style={{ color: 'lightblue', fontWeight: 'bold' }}>
            <FileText size={24} /> Merge PDFs
          </h2>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handlePdfChange}
            className="file-input"
          />
          <button
            onClick={mergePDFs}
            disabled={pdfFiles.length === 0 || isMerging}
            className="merge-button"
          >
            {isMerging ? <Loader className="spinner" /> : 'Merge PDFs'}
          </button>
          {pdfFiles.length > 0 && (
            <div className="file-list">
              <p>Selected PDFs: {pdfFiles.length}</p>
              <ul>
                {pdfFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <hr />
        <section className="merge-section">
          <h2 style={{ color: 'lightblue', fontWeight: 'bold' }}>
            <Image size={24} /> Merge Images
          </h2>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png"
            onChange={handleImageChange}
            className="file-input"
          />
          <button
            onClick={mergeImages}
            disabled={imageFiles.length === 0 || isMerging}
            className="merge-button"
          >
            {isMerging ? <Loader className="spinner" /> : 'Merge Images'}
          </button>
          {imageFiles.length > 0 && (
            <div className="file-list">
              <p>Selected Images: {imageFiles.length}</p>
              <ul>
                {imageFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <hr />
        <footer>
          <p>
            If you like this tool, please star the repository on{' '}
            <a href="https://github.com/romitagl/web-tools">GitHub</a>&nbsp;
            and consider sponsoring me on GitHub.
          </p>
          <iframe src="https://github.com/sponsors/romitagl/button" title="Sponsor" width="116" height="35" />
        </footer>
      </div>
    </div>
  );
}

export default App;

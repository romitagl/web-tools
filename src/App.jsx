import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileText, Image } from 'lucide-react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const handlePdfChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setPdfFiles(selectedFiles);
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setImageFiles(selectedFiles);
  };

  const mergePDFs = async () => {
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
  };

  const mergeImages = async () => {
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
    <>
      <head>
        <title>Merge PDFs & Images | Free & Private</title>
        <meta name="description" content="Merge PDF and image files into a single document securely and privately in your browser. No uploads, 100% free!" />
        <meta name="keywords" content="PDF merge, image to PDF, online PDF tool, free PDF merger, secure PDF processing" />
      </head>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Merge PDFs & Images Instantly - 100% Private, 100% Free!</h1>
      <h2>Runs safely and securely in your browser. No uploads required.</h2>
      <section>
        <p>Merge PDFs and Images into a Single Document with ease.
        Documents will be merged in order by sorting the input file names.</p>
      </section>
      <hr />
      <section>
        <h2 style={{ color: 'lightblue', fontWeight: 'bold' }}><FileText size={24} /> Merge PDFs</h2>
        <input type="file" multiple accept=".pdf" onChange={handlePdfChange} />
        <button onClick={mergePDFs} disabled={pdfFiles.length === 0}>
          Merge PDFs
        </button>
        {pdfFiles.length > 0 && (
          <div>
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
      <section>
        <h2 style={{ color: 'lightblue', fontWeight: 'bold' }}><Image size={24} /> Merge Images</h2>
        <input type="file" multiple accept=".jpg,.jpeg,.png" onChange={handleImageChange} />
        <button onClick={mergeImages} disabled={imageFiles.length === 0}>
          Merge Images
        </button>
        {imageFiles.length > 0 && (
          <div>
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
        <p className="read-the-docs">
          If you like this tool, please star the repository on{' '}
          <a href="https://github.com/romitagl/web-tools">GitHub</a>&nbsp;
          and consider sponsoring me on GitHub.
        </p>
        <iframe src="https://github.com/sponsors/romitagl/button" title="Sponsor" width="116" height="35" />
      </footer>
    </>
  );
}

export default App;

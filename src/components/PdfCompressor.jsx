import { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { Check, FileDown, FileText, Info, Loader, SlidersHorizontal, UploadCloud } from 'lucide-react';
import Layout from './Layout';

GlobalWorkerOptions.workerSrc = workerSrc;

const compressionProfiles = {
  maximum: {
    label: 'Maximum Compression',
    dpi: 96,
    jpegQuality: 0.55,
    description: 'Smallest files, best for sharing scanned PDFs quickly.',
  },
  balanced: {
    label: 'Balanced',
    dpi: 130,
    jpegQuality: 0.72,
    description: 'A solid default for everyday documents and scans.',
  },
  quality: {
    label: 'Higher Quality',
    dpi: 170,
    jpegQuality: 0.82,
    description: 'Sharper pages with gentler compression.',
  },
};

function PdfCompressor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('balanced');
  const [useGrayscale, setUseGrayscale] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setResult(null);
  }, [compressionLevel, useGrayscale]);

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please choose a PDF file.');
      return;
    }

    setSelectedFile(file);
    setResult(null);
  };

  const handleFileChange = (event) => {
    handleFileSelection(event.target.files?.[0]);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    handleFileSelection(droppedFile);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setResult(null);
    setProgress({ current: 0, total: 0 });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return '0 Bytes';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** unitIndex;
    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
  };

  const createPageImageBlob = async (canvas, quality) => {
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    if (!blob) {
      throw new Error('Unable to encode the rendered page as JPEG.');
    }

    return blob;
  };

  const applyGrayscale = (canvasContext, width, height) => {
    const imageData = canvasContext.getImageData(0, 0, width, height);
    const { data } = imageData;

    for (let index = 0; index < data.length; index += 4) {
      const luminance = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
      data[index] = luminance;
      data[index + 1] = luminance;
      data[index + 2] = luminance;
    }

    canvasContext.putImageData(imageData, 0, 0);
  };

  const downloadPDF = (pdfBytes, filename) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const compressPDF = async () => {
    if (!selectedFile) {
      return;
    }

    const profile = compressionProfiles[compressionLevel];
    let sourcePdf = null;

    setIsProcessing(true);
    setResult(null);
    setProgress({ current: 0, total: 0 });

    try {
      const sourceBytes = await selectedFile.arrayBuffer();
      const loadingTask = getDocument({ data: sourceBytes });
      sourcePdf = await loadingTask.promise;

      const outputPdf = await PDFDocument.create();
      const totalPages = sourcePdf.numPages;
      setProgress({ current: 0, total: totalPages });

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        const page = await sourcePdf.getPage(pageNumber);
        const outputViewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale: profile.dpi / 72 });
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: useGrayscale,
        });

        if (!canvasContext) {
          throw new Error('Your browser could not initialize a canvas context for compression.');
        }

        canvas.width = Math.max(1, Math.floor(renderViewport.width));
        canvas.height = Math.max(1, Math.floor(renderViewport.height));

        await page.render({
          canvas,
          canvasContext,
          viewport: renderViewport,
          background: 'rgb(255,255,255)',
        }).promise;

        if (useGrayscale) {
          applyGrayscale(canvasContext, canvas.width, canvas.height);
        }

        const pageBlob = await createPageImageBlob(canvas, profile.jpegQuality);
        const pageImageBytes = await pageBlob.arrayBuffer();
        const embeddedImage = await outputPdf.embedJpg(pageImageBytes);
        const outputPage = outputPdf.addPage([outputViewport.width, outputViewport.height]);

        outputPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: outputViewport.width,
          height: outputViewport.height,
        });

        canvas.width = 0;
        canvas.height = 0;
        setProgress({ current: pageNumber, total: totalPages });
      }

      const compressedBytes = await outputPdf.save({ useObjectStreams: true });
      const originalSize = selectedFile.size;
      const compressedSize = compressedBytes.length;
      const reduction = originalSize > 0
        ? ((originalSize - compressedSize) / originalSize) * 100
        : 0;
      const outputName = selectedFile.name.replace(/\.pdf$/i, '') + '-compressed.pdf';

      downloadPDF(compressedBytes, outputName);
      setResult({
        originalSize,
        compressedSize,
        reduction,
        outputName,
        totalPages,
      });
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert(`An error occurred while compressing the PDF: ${error.message}`);
    } finally {
      if (sourcePdf) {
        sourcePdf.cleanup();
        sourcePdf.destroy();
      }

      setIsProcessing(false);
    }
  };

  const activeProfile = compressionProfiles[compressionLevel];
  const descriptionElement = (
    <div className="info-box">
      <Info size={20} />
      <p>
        Reduce PDF size directly in your browser. This tool works best on scanned or image-heavy PDFs by
        rebuilding each page with a smaller image footprint. Your file never leaves your device.
      </p>
    </div>
  );

  return (
    <Layout
      title="Compress PDFs Locally"
      description={descriptionElement}
    >
      <section className="compress-section">
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="drop-zone-content">
            <UploadCloud size={48} className="upload-icon" />
            <p>Drag & drop a PDF here, or</p>
            <label className="file-input-label">
              <span>Choose PDF</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
            </label>
          </div>
        </div>

        <div className="compressor-options card">
          <div className="compressor-options-header">
            <SlidersHorizontal size={18} />
            <h3>Compression Options</h3>
          </div>

          <div className="profile-grid">
            {Object.entries(compressionProfiles).map(([value, profile]) => (
              <label key={value} className={`profile-card ${compressionLevel === value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="compressionLevel"
                  value={value}
                  checked={compressionLevel === value}
                  onChange={(event) => setCompressionLevel(event.target.value)}
                  className="radio-input"
                />
                <div>
                  <strong>{profile.label}</strong>
                  <p>{profile.description}</p>
                  <span>{profile.dpi} DPI · JPEG {Math.round(profile.jpegQuality * 100)}%</span>
                </div>
              </label>
            ))}
          </div>

          <div className="checkbox-group compress-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useGrayscale}
                onChange={(event) => setUseGrayscale(event.target.checked)}
                className="checkbox-input"
              />
              <span>Convert pages to grayscale for smaller files</span>
            </label>
          </div>

          <div className="merge-info">
            <Info size={16} />
            <span>
              Best for scanned or image-based PDFs. Text and vector graphics are flattened into page images
              during compression.
            </span>
          </div>
        </div>

        {selectedFile && (
          <div className="file-list-container">
            <div className="file-list-header">
              <h3>Selected PDF</h3>
              <button onClick={clearFile} className="clear-button">Clear</button>
            </div>

            <div className="file-list">
              <ul>
                <li className="file-item">
                  <div className="file-info">
                    <FileText size={16} className="file-icon" />
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="compression-summary">
              <div><strong>Profile:</strong> {activeProfile.label}</div>
              <div><strong>Settings:</strong> {activeProfile.dpi} DPI, JPEG {Math.round(activeProfile.jpegQuality * 100)}%, {useGrayscale ? 'grayscale' : 'color'}</div>
            </div>

            <button
              onClick={compressPDF}
              disabled={isProcessing}
              className="merge-button"
            >
              {isProcessing ? <Loader className="spinner" /> : <FileDown size={18} />}
              {isProcessing ? `Compressing ${progress.current}/${progress.total || 0} pages` : 'Compress PDF'}
            </button>

            {result && (
              <div className={`success-message compression-result ${result.reduction < 0 ? 'warning' : ''}`}>
                <Check size={18} />
                <span>
                  {result.reduction >= 0
                    ? `${result.outputName} downloaded. Size reduced from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)} (${result.reduction.toFixed(1)}% smaller).`
                    : `${result.outputName} downloaded. Output size is ${formatFileSize(result.compressedSize)}, which is ${Math.abs(result.reduction).toFixed(1)}% larger than the original. Try the Maximum Compression profile.`}
                </span>
              </div>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}

export default PdfCompressor;

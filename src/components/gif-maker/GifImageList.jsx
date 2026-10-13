/* eslint-disable react/prop-types -- Internal props are supplied by useGifMaker. */
import { X } from 'lucide-react';
import { formatFileSize } from '../../tools/gif-maker/files';

function GifImageList({ images, disabled, onRemove, onClear }) {
  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h3>Selected Images: {images.length}</h3>
        <button type="button" className="clear-button" onClick={onClear} disabled={disabled}>Clear All</button>
      </div>
      <p className="gif-note">Frames are sorted alphabetically by filename, including images added later.</p>
      <ol className="gif-image-list">
        {images.map(({ id, file, url }, index) => (
          <li key={id} className="file-item">
            <span className="gif-frame-number">{index + 1}</span>
            <img src={url} alt="" className="gif-thumbnail" loading="lazy" />
            <div className="gif-file-details">
              <span className="file-name" title={file.name}>{file.name}</span>
              <span className="file-size">{formatFileSize(file.size)}</span>
            </div>
            <button type="button" className="remove-file" disabled={disabled}
              aria-label={`Remove ${file.name}`} onClick={() => onRemove(id)}><X size={18} /></button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default GifImageList;

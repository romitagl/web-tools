/* eslint-disable react/prop-types -- Internal inputs are supplied by the GIF source components. */
import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

function GifDropZone({ accept, multiple = false, label, inputLabel, hint, disabled, onFiles }) {
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);
  const fileInput = useRef(null);
  return (
    <div className={`drop-zone ${dragActive ? 'active' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragActive(false);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragActive(false);
        if (!disabled) onFiles(event.dataTransfer.files);
      }}>
      <div className="drop-zone-content">
        <UploadCloud size={48} className="upload-icon" />
        <p>Drag &amp; drop {multiple ? 'images' : 'a video'} here, or</p>
        <button type="button" className="btn btn-primary" disabled={disabled}
          onClick={() => fileInput.current.click()}>{label}</button>
        <input ref={fileInput} type="file" multiple={multiple} accept={accept} className="file-input"
          aria-label={inputLabel} disabled={disabled}
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = '';
          }} />
        <span className="gif-note">{hint}</span>
      </div>
    </div>
  );
}

export default GifDropZone;

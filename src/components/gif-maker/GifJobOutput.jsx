/* eslint-disable react/prop-types -- Job state is owned by useGifJob. */
import { Check, Download, Film, Loader } from 'lucide-react';
import { formatFileSize } from '../../tools/gif-maker/files';

function GifJobOutput({ maker, disabled }) {
  return (
    <>
      <button type="button" className="merge-button" onClick={maker.generate}
        disabled={disabled || maker.isProcessing}>
        {maker.isProcessing ? <Loader size={18} className="spinner" /> : <Film size={18} />}
        {maker.isProcessing ? 'Creating GIF…' : 'Create GIF'}
      </button>
      {maker.isProcessing && (
        <div className="gif-progress">
          <p role="status">Encoding frame {maker.progress.current} of {maker.progress.total}</p>
          <progress aria-label="GIF encoding progress" value={maker.progress.current} max={maker.progress.total || 1} />
          <button type="button" className="btn btn-secondary" onClick={maker.cancel}>Cancel</button>
        </div>
      )}
      {maker.result && (
        <div className="gif-result card">
          <div className="success-message" role="status"><Check size={18} /> GIF created successfully!</div>
          <h3>GIF Preview</h3>
          <img className="gif-preview" src={maker.result.url} alt="Generated GIF preview" />
          <p>{maker.result.width} × {maker.result.height} pixels · {maker.result.frames} frame(s) ·{' '}
            {maker.result.delay} ms per frame · {formatFileSize(maker.result.blob.size)} ·{' '}
            {maker.result.loop ? 'Continuous loop' : 'Plays once'}</p>
          <a className="btn btn-primary" href={maker.result.url} download="animation.gif">
            <Download size={18} /> Download GIF
          </a>
        </div>
      )}
    </>
  );
}

export default GifJobOutput;

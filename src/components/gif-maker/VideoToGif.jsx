import GifDropZone from './GifDropZone';
import GifSettings from './GifSettings';
import GifJobOutput from './GifJobOutput';
import useVideoGifMaker from '../../tools/gif-maker/useVideoGifMaker';
import { VIDEO_ACCEPT } from '../../tools/gif-maker/video';
import { getVideoPlan, MIN_VIDEO_FPS, MAX_VIDEO_FPS, MAX_VIDEO_FRAMES } from '../../tools/gif-maker/videoSettings';
import { formatFileSize } from '../../tools/gif-maker/files';

function VideoToGif() {
  const maker = useVideoGifMaker();
  let plan;
  if (maker.info) {
    try { plan = getVideoPlan(maker.info.duration, maker.clip); } catch { /* Show validation on Create GIF. */ }
  }
  return (
    <section className="gif-maker" aria-busy={maker.isProcessing || maker.isLoading}>
      <GifDropZone accept={VIDEO_ACCEPT} label="Choose Video" inputLabel="Choose video for GIF"
        hint="Select one video, such as MP4, WebM, or MOV. Supported codecs depend on your browser."
        disabled={maker.isProcessing} onFiles={maker.selectVideo} />
      {maker.error && <div className="error-message" role="alert">{maker.error}</div>}
      {maker.selected && (
        <div className="file-list-container">
          <div className="file-list-header">
            <h3>Selected Video</h3>
            <button type="button" className="clear-button" disabled={maker.isProcessing} onClick={maker.clearVideo}>Clear Video</button>
          </div>
          <p className="gif-video-name">{maker.selected.file.name} · {formatFileSize(maker.selected.file.size)}</p>
          <video key={maker.selected.url} className="gif-video-preview" src={maker.selected.url}
            controls playsInline preload="auto" aria-label="Source video preview" />
          {maker.isLoading && <p role="status">Reading video…</p>}
          {maker.info && <p className="gif-note">{maker.info.width} × {maker.info.height} pixels · {maker.info.duration.toFixed(2)} seconds</p>}
        </div>
      )}
      {maker.info && (
        <fieldset className="gif-settings card" disabled={maker.isProcessing}>
          <legend>Video Clip</legend>
          <div className="gif-options-grid">
            <div className="input-group">
              <label htmlFor="gif-video-start">Start time (seconds)</label>
              <input id="gif-video-start" type="number" className="text-input" min="0" max={maker.info.duration}
                step="0.01" value={maker.clip.start} onChange={(event) => maker.updateClip({ start: event.target.value })} />
            </div>
            <div className="input-group">
              <label htmlFor="gif-video-end">End time (seconds)</label>
              <input id="gif-video-end" type="number" className="text-input" min="0" max={maker.info.duration}
                step="0.01" value={maker.clip.end} onChange={(event) => maker.updateClip({ end: event.target.value })} />
            </div>
            <div className="input-group">
              <label htmlFor="gif-video-fps">Frame rate (frames per second)</label>
              <input id="gif-video-fps" type="number" className="text-input" min={MIN_VIDEO_FPS} max={MAX_VIDEO_FPS}
                step="1" value={maker.clip.fps} onChange={(event) => maker.updateClip({ fps: event.target.value })}
                aria-describedby="gif-video-fps-hint" />
              <small id="gif-video-fps-hint">{MIN_VIDEO_FPS}–{MAX_VIDEO_FPS} frames per second. Default: 10.</small>
            </div>
          </div>
          <p className="gif-note">{plan ? `${(plan.end - plan.start).toFixed(2)} second clip · ${plan.frameCount} frames. ` : ''}
            Shorter clips and lower frame rates make smaller GIFs. Maximum {MAX_VIDEO_FRAMES} frames per clip.</p>
        </fieldset>
      )}
      <GifSettings source="video" settings={maker.settings} disabled={maker.isProcessing} onChange={maker.updateSettings} />
      <GifJobOutput maker={maker} disabled={!maker.info || maker.isLoading} />
    </section>
  );
}

export default VideoToGif;

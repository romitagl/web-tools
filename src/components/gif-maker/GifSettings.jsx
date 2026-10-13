/* eslint-disable react/prop-types -- Internal props are supplied by useGifMaker. */
function GifSettings({ settings, disabled, onChange, source = 'images' }) {
  return (
    <fieldset className="gif-settings card" disabled={disabled}>
      <legend>Animation Options</legend>
      <div className="gif-options-grid">
        {source === 'images' && <div className="input-group">
          <label htmlFor="gif-delay">Frame delay (milliseconds)</label>
          <input id="gif-delay" type="number" min="20" max="10000" step="10"
            className="text-input" value={settings.delay}
            onChange={(event) => onChange({ delay: event.target.value })} />
          <small>500 ms = two frames per second.</small>
        </div>}
        <div className="input-group">
          <label htmlFor="gif-size">Maximum output dimension</label>
          <select id="gif-size" className="select-input" value={settings.maxSize}
            onChange={(event) => onChange({ maxSize: Number(event.target.value) })}>
            {[320, 480, 800, 1200, 1600, 2048].map((size) => (
              <option key={size} value={size}>{size} pixels</option>
            ))}
          </select>
          <small>Smaller dimensions make smaller GIFs.</small>
        </div>
        {source === 'images' && <div className="input-group">
          <label htmlFor="gif-fit">Images with different proportions</label>
          <select id="gif-fit" className="select-input" value={settings.fit}
            onChange={(event) => onChange({ fit: event.target.value })}>
            <option value="contain">Fit entire image (add background)</option>
            <option value="cover">Fill frame (crop edges)</option>
          </select>
        </div>}
        {source === 'images' && <div className="input-group">
          <label htmlFor="gif-background">Background color</label>
          <div className="color-input-container">
            <input id="gif-background" type="color" className="color-input" value={settings.background}
              onChange={(event) => onChange({ background: event.target.value })} />
            <span className="color-value">{settings.background}</span>
          </div>
        </div>}
      </div>
      <label className="checkbox-label">
        <input type="checkbox" className="checkbox-input" checked={settings.loop}
          onChange={(event) => onChange({ loop: event.target.checked })} />
        <span>Loop continuously</span>
      </label>
      <p className="gif-note">
        {source === 'images'
          ? 'The first image in filename order sets the aspect ratio. Each image becomes one frame. Transparent areas use the background color. GIFs support up to 256 colors per frame.'
          : 'The video keeps its aspect ratio. GIFs have no audio and support up to 256 colors per frame.'}
      </p>
    </fieldset>
  );
}

export default GifSettings;

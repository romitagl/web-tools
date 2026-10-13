import { useState } from 'react';
import { Image, Info, Video } from 'lucide-react';
import Layout from './Layout';
import ImagesToGif from './gif-maker/ImagesToGif';
import VideoToGif from './gif-maker/VideoToGif';

function GifMaker() {
  const [source, setSource] = useState('images');
  const description = (
    <div className="info-box">
      <Info size={20} />
      <p>Create an animated GIF from images sorted alphabetically by filename, or from a video clip.
        Everything runs locally in your browser. Your files never leave your device.</p>
    </div>
  );
  return (
    <Layout title="Animated GIF Maker" description={description}>
      <div className="tab-container" aria-label="GIF source">
        <button type="button" className={`tab-button ${source === 'images' ? 'active' : ''}`}
          aria-pressed={source === 'images'} onClick={() => setSource('images')}>
          <Image size={18} /> Images to GIF
        </button>
        <button type="button" className={`tab-button ${source === 'video' ? 'active' : ''}`}
          aria-pressed={source === 'video'} onClick={() => setSource('video')}>
          <Video size={18} /> Video to GIF
        </button>
      </div>
      {source === 'images' ? <ImagesToGif /> : <VideoToGif />}
    </Layout>
  );
}

export default GifMaker;

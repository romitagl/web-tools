import GifDropZone from './GifDropZone';
import GifSettings from './GifSettings';
import GifImageList from './GifImageList';
import GifJobOutput from './GifJobOutput';
import useGifMaker from '../../tools/gif-maker/useGifMaker';
import { IMAGE_ACCEPT } from '../../tools/gif-maker/files';

function ImagesToGif() {
  const maker = useGifMaker();
  return (
    <section className="gif-maker" aria-busy={maker.isProcessing}>
      <GifDropZone accept={IMAGE_ACCEPT} multiple label="Choose Images" inputLabel="Choose images for GIF"
        hint="PNG, JPEG, WebP, and BMP • Add more images at any time before creating."
        disabled={maker.isProcessing} onFiles={maker.addImages} />
      {maker.error && <div className="error-message" role="alert">{maker.error}</div>}
      {maker.images.length > 0 && (
        <GifImageList images={maker.images} disabled={maker.isProcessing}
          onRemove={maker.removeImage} onClear={maker.clearImages} />
      )}
      <GifSettings settings={maker.settings} disabled={maker.isProcessing} onChange={maker.updateSettings} />
      <GifJobOutput maker={maker} disabled={!maker.images.length} />
    </section>
  );
}

export default ImagesToGif;

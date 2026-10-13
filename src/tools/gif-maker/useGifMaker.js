import { useEffect, useRef, useState } from 'react';
import { createGif } from './encoder';
import { isSupportedImage, sortImages } from './files';
import { DEFAULT_SETTINGS } from './settings';
import useGifJob from './useGifJob';

export default function useGifMaker() {
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const gifJob = useGifJob();
  const { setError, clearResult } = gifJob;
  const imageUrls = useRef(new Map());
  const nextImageId = useRef(0);

  useEffect(() => () => {
    imageUrls.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrls.current.clear();
  }, []);

  const addImages = (files) => {
    if (gifJob.isBusy()) return;
    const supported = Array.from(files).filter(isSupportedImage);
    const rejected = files.length - supported.length;
    setError(rejected ? `${rejected} unsupported file(s) skipped. Choose PNG, JPEG, WebP, or BMP images.` : '');
    if (!supported.length) return;
    const entries = supported.map((file) => {
      const id = nextImageId.current++;
      const url = URL.createObjectURL(file);
      imageUrls.current.set(id, url);
      return { id, file, url };
    });
    clearResult();
    setImages((current) => sortImages([...current, ...entries]));
  };

  const removeImage = (id) => {
    if (gifJob.isBusy()) return;
    URL.revokeObjectURL(imageUrls.current.get(id));
    imageUrls.current.delete(id);
    clearResult();
    setError('');
    setImages((current) => current.filter((image) => image.id !== id));
  };

  const clearImages = () => {
    if (gifJob.isBusy()) return;
    imageUrls.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrls.current.clear();
    clearResult();
    setError('');
    setImages([]);
  };

  const updateSettings = (changes) => {
    if (gifJob.isBusy()) return;
    clearResult();
    setError('');
    setSettings((current) => ({ ...current, ...changes }));
  };

  const generate = async () => {
    if (!images.length) return;
    await gifJob.run((callbacks) => createGif(images.map(({ file }) => file), settings, callbacks), {
      total: images.length, delay: settings.delay, loop: settings.loop,
    });
  };

  return {
    ...gifJob, images, settings,
    addImages, removeImage, clearImages, updateSettings, generate,
  };
}

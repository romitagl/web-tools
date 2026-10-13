import { useEffect, useRef, useState } from 'react';
import useGifJob from './useGifJob';
import { DEFAULT_SETTINGS } from './settings';
import { DEFAULT_VIDEO_CLIP, getVideoPlan } from './videoSettings';
import { createVideoGif, isSupportedVideo, readVideoInfo } from './video';

export default function useVideoGifMaker() {
  const [selected, setSelected] = useState(null);
  const [info, setInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clip, setClip] = useState(DEFAULT_VIDEO_CLIP);
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, maxSize: 480 });
  const gifJob = useGifJob();
  const metadataJob = useRef(null);
  const previewUrl = useRef(null);

  useEffect(() => () => {
    metadataJob.current?.abort();
    metadataJob.current = null;
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
  }, []);

  const clearVideo = () => {
    if (gifJob.isBusy()) return;
    metadataJob.current?.abort();
    metadataJob.current = null;
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    gifJob.clearResult();
    gifJob.setError('');
    setSelected(null);
    setInfo(null);
    setIsLoading(false);
    setClip(DEFAULT_VIDEO_CLIP);
  };

  const selectVideo = async (files) => {
    if (gifJob.isBusy() || !files.length) return;
    if (files.length !== 1 || !isSupportedVideo(files[0])) {
      gifJob.setError('Choose one video file at a time (for example MP4, WebM, or MOV).');
      return;
    }
    clearVideo();
    const file = files[0];
    previewUrl.current = URL.createObjectURL(file);
    setSelected({ file, url: previewUrl.current });
    setIsLoading(true);
    const controller = new AbortController();
    metadataJob.current = controller;
    try {
      const metadata = await readVideoInfo(file, controller.signal);
      if (metadataJob.current !== controller) return;
      setInfo(metadata);
      setClip({ ...DEFAULT_VIDEO_CLIP, end: Math.min(metadata.duration, 10) });
    } catch (cause) {
      if (!controller.signal.aborted && metadataJob.current === controller) {
        gifJob.setError(`Could not read “${file.name}”. ${cause.message}`);
      }
    } finally {
      if (metadataJob.current === controller) {
        metadataJob.current = null;
        setIsLoading(false);
      }
    }
  };

  const update = (setter, changes) => {
    if (gifJob.isBusy()) return;
    gifJob.clearResult();
    gifJob.setError('');
    setter((current) => ({ ...current, ...changes }));
  };

  const generate = async () => {
    if (!selected || !info || isLoading) return;
    let plan;
    try { plan = getVideoPlan(info.duration, clip); } catch (cause) { gifJob.setError(cause.message); return; }
    await gifJob.run((callbacks) => createVideoGif(selected.file, info.duration, settings, clip, callbacks), {
      total: plan.frameCount, delay: plan.delay, loop: settings.loop,
    });
  };

  return {
    ...gifJob, selected, info, isLoading, settings, clip, selectVideo, clearVideo, generate,
    updateSettings: (changes) => update(setSettings, changes),
    updateClip: (changes) => update(setClip, changes),
  };
}

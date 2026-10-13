import { useEffect, useRef, useState } from 'react';

/** Shared job lifecycle for all GIF sources; input ownership stays with each tool. */
export default function useGifJob() {
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const resultUrl = useRef(null);
  const job = useRef(null);

  useEffect(() => () => {
    job.current?.abort();
    job.current = null;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
  }, []);

  const clearResult = () => {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
    setResult(null);
  };

  const run = async (encode, { total = 0, delay, loop }) => {
    if (job.current) return;
    const controller = new AbortController();
    job.current = controller;
    clearResult();
    setError('');
    setIsProcessing(true);
    setProgress({ current: 0, total });
    try {
      const output = await encode({
        signal: controller.signal,
        onProgress: (value) => {
          if (job.current === controller) setProgress(value);
        },
      });
      if (job.current !== controller || controller.signal.aborted) return;
      resultUrl.current = URL.createObjectURL(output.blob);
      setResult({ ...output, url: resultUrl.current, delay: Number(delay), loop });
    } catch (cause) {
      if (!controller.signal.aborted && job.current === controller) {
        setError(cause.message || 'Could not create the GIF. Try a smaller output size.');
      }
    } finally {
      if (job.current === controller) {
        job.current = null;
        setIsProcessing(false);
      }
    }
  };

  const cancel = () => {
    job.current?.abort();
    job.current = null;
    setIsProcessing(false);
    setProgress({ current: 0, total: 0 });
  };

  return { error, setError, isProcessing, progress, result, clearResult, run, cancel, isBusy: () => Boolean(job.current) };
}

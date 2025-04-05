import { useState, useRef, useEffect } from 'react';
import { Upload, PlayCircle, Download, StopCircle, RefreshCw, Info, Settings, Check, AlertCircle } from 'lucide-react';
import Layout from './Layout';

function VideoSpeedController() {
  // State variables
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedVideoUrl, setProcessedVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [videoQuality, setVideoQuality] = useState('high');
  const [outputFormat, setOutputFormat] = useState('webm');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [fileKey, setFileKey] = useState(Date.now()); // Key to force input re-render
  const [gifQuality, setGifQuality] = useState('medium'); // GIF-specific quality setting
  const [gifWidth, setGifWidth] = useState(640); // Default output width for GIFs

  // Refs
  const videoRef = useRef(null);
  const processedVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const processingCancelledRef = useRef(false);
  const gifFramesRef = useRef([]);
  const gifWorkerRef = useRef(null);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
      
      // Clean up any GIF worker if it exists
      if (gifWorkerRef.current) {
        gifWorkerRef.current.terminate();
      }
    };
  }, []);

  // Load the GIF.js library dynamically
  useEffect(() => {
    // Only load the GIF.js library if it hasn't been loaded yet
    if (!window.GIF && outputFormat === 'gif') {
      // Create script element for the main GIF.js library
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.async = true;
      
      script.onload = () => {
        console.log('GIF.js library loaded successfully');
        // No need to modify defaults - we'll pass all options directly when creating the GIF
      };
      
      script.onerror = () => {
        console.error('Failed to load GIF.js library');
        setError('Failed to load GIF processing library. Please try a different output format.');
      };
      
      document.body.appendChild(script);
      
      return () => {
        // Clean up script on unmount if it's still loading
        document.body.removeChild(script);
      };
    }
  }, [outputFormat]);

  // Function to find a supported MIME type for video recording
  const getSupportedMimeType = (format = 'webm') => {
    let possibleTypes = [];
    
    // Select possible MIME types based on the requested format
    if (format === 'webm') {
      possibleTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
    } else if (format === 'mp4') {
      possibleTypes = [
        'video/mp4;codecs=h264',
        'video/mp4'
      ];
    } else {
      // For GIF format we'll still record as WebM initially
      possibleTypes = [
        'video/webm;codecs=vp8',
        'video/webm'
      ];
    }
    
    // Fallback types for all formats
    possibleTypes.push('video/webm', 'video/mp4');
    
    for (const type of possibleTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`Using MIME type: ${type}`);
        return type;
      }
    }
    
    // Fallback to default if no specific types are supported
    console.log('No specific MIME types supported, using browser default');
    return '';
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format duration to MM:SS format
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format current playback time
  const formatCurrentTime = () => {
    return `${formatDuration(currentTime)} / ${formatDuration(duration)}`;
  };

  // Get estimated output duration
  const getEstimatedDuration = () => {
    if (!duration) return '00:00';
    const estimatedDuration = duration / playbackSpeed;
    return formatDuration(estimatedDuration);
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setError('');
    setSuccess('');
    setProcessedVideoUrl('');
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Check file size (limit to 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError('Video file is too large. Maximum size is 500MB');
      return;
    }

    // Set video file and create URL
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    // Log success message
    console.log(`File loaded successfully: ${file.name} (${file.type}, ${formatBytes(file.size)})`);

    // Get video info when loaded
    const video = videoRef.current;
    if (video) {
      video.onloadedmetadata = () => {
        setVideoInfo({
          name: file.name,
          type: file.type,
          size: formatBytes(file.size),
          duration: formatDuration(video.duration),
          width: video.videoWidth,
          height: video.videoHeight
        });
        setDuration(video.duration);
        
        // Set a reasonable GIF width based on original video dimensions
        // but don't go larger than 800px to maintain performance
        const scaledWidth = Math.min(800, video.videoWidth);
        setGifWidth(scaledWidth);
      };
      
      // Handle video load error
      video.onerror = (e) => {
        console.error('Video load error:', e);
        setError(`There was an error loading this video. It may be in an unsupported format or corrupted.`);
        setVideoFile(null);
        setVideoUrl('');
      };
    }
  };

  // Handle video playback
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update current time during playback
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
  };

  // Handle playback speed change
  const handleSpeedChange = (e) => {
    setPlaybackSpeed(parseFloat(e.target.value));
  };

  // Function to delay execution
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Create a GIF from a series of canvas frames
  const createGifFromFrames = (frames, width, height, frameDelay) => {
    return new Promise((resolve, reject) => {
      try {
        // Check if the GIF.js library exists
        if (typeof window.GIF !== 'function') {
          throw new Error("GIF.js library not properly loaded. Using fallback method.");
        }
        
        // Determine quality settings based on user selection
        let gifQualitySettings = {
          workers: 2, // Use fewer workers to avoid memory issues
          quality: 10, // Lower is better but slower
          // Don't specify the worker script - let the library handle it internally
          width,
          height
        };
        
        if (gifQuality === 'low') {
          gifQualitySettings.quality = 20;
          gifQualitySettings.workers = 1;
        } else if (gifQuality === 'high') {
          gifQualitySettings.quality = 5;
          gifQualitySettings.workers = 3;
        }
        
        // Create a new GIF
        const gif = new window.GIF(gifQualitySettings);
        
        // Add frames to the GIF
        let framesAdded = 0;
        const totalFrames = frames.length;
        
        frames.forEach(frame => {
          try {
            gif.addFrame(frame, { delay: frameDelay });
            framesAdded++;
            // Update progress as frames are added
            const addProgress = 60 + ((framesAdded / totalFrames) * 10);
            setProcessingProgress(Math.min(70, addProgress));
          } catch (frameError) {
            console.warn(`Warning: Could not add frame ${framesAdded}`, frameError);
          }
        });
        
        // Add progress handler
        gif.on('progress', progress => {
          console.log(`GIF encoding progress: ${Math.round(progress * 100)}%`);
          // Update progress display (scale from 70-99% to show GIF encoding after frame capture)
          setProcessingProgress(70 + Math.round(progress * 29));
        });
        
        // Set a timeout to detect if processing gets stuck
        const timeoutId = setTimeout(() => {
          reject(new Error("GIF processing timed out. Using fallback method."));
        }, 30000); // 30 seconds timeout
        
        // Handle completion
        gif.on('finished', blob => {
          clearTimeout(timeoutId); // Clear the timeout
          resolve(blob);
        });
        
        // Start rendering
        gif.render();
      } catch (error) {
        reject(error);
      }
    });
  };

  // Process video with selected speed
  const processVideo = async () => {
    const video = videoRef.current;
    if (!video || !videoFile) {
      setError('Please upload a video first');
      return;
    }

    setError('');
    setSuccess('');
    setIsProcessing(true);
    setProcessingProgress(0);
    processingCancelledRef.current = false;
    
    // Clear previous frames reference
    gifFramesRef.current = [];

    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('Your browser does not support MediaRecorder. Please try a different browser like Chrome or Firefox.');
      }
      
      // Check if canvas.captureStream is supported
      const testCanvas = document.createElement('canvas');
      if (!testCanvas.captureStream) {
        throw new Error('Your browser does not support canvas.captureStream. Please try a different browser like Chrome or Firefox.');
      }

      // Pause the original video if playing
      video.pause();
      setIsPlaying(false);

      // Create an offscreen canvas element
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');
      
      // Calculate dimensions
      let targetWidth, targetHeight;
      
      if (outputFormat === 'gif') {
        // For GIF, use the user-defined width and calculate height to maintain aspect ratio
        targetWidth = gifWidth;
        targetHeight = Math.round(targetWidth * (video.videoHeight / video.videoWidth));
      } else {
        // For video formats, use original dimensions
        targetWidth = video.videoWidth;
        targetHeight = video.videoHeight;
      }
      
      // Set canvas dimensions 
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Set quality based on user selection for video formats
      let videoQualitySettings = { 
        videoBitsPerSecond: 5000000 // 5Mbps for high quality
      };
      
      if (videoQuality === 'medium') {
        videoQualitySettings.videoBitsPerSecond = 2500000; // 2.5Mbps
      } else if (videoQuality === 'low') {
        videoQualitySettings.videoBitsPerSecond = 1000000; // 1Mbps
      }

      // For GIF, we'll handle processing differently
      if (outputFormat === 'gif') {
        setSuccess('Preparing to generate GIF...');
        
        // Set initial time
        const startTime = 0;
        const totalDuration = video.duration;
        video.currentTime = startTime;
        
        // Calculate frame delays based on playback speed
        const frameDelay = Math.round(100 / playbackSpeed); // in ms (e.g., 100ms for 1x speed)
        
        // Determine frame capture rate based on playback speed and quality
        // More frames = smoother animation but larger file size
        let frameSkip = 1; // By default, capture every frame
        
        if (gifQuality === 'low') {
          frameSkip = 3; // Capture every 3rd frame
        } else if (gifQuality === 'medium') {
          frameSkip = 2; // Capture every 2nd frame
        }
        
        // For very slow motion, we need more frames
        if (playbackSpeed < 0.5) {
          frameSkip = Math.max(1, Math.floor(frameSkip / 2));
        }
        
        // Track the frames we've captured
        let frameCount = 0;
        let framesProcessed = 0;
        
        // Process frame by frame
        const processGifFrame = async () => {
          if (processingCancelledRef.current) {
            return;
          }
          
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          
          // Only capture the frame if it's a frame we want (based on frameSkip)
          if (frameCount % frameSkip === 0) {
            // Capture this frame
            const frameImg = document.createElement('img');
            // We need to clone the canvas to create a snapshot
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = targetWidth;
            frameCanvas.height = targetHeight;
            const frameCtx = frameCanvas.getContext('2d');
            frameCtx.drawImage(canvas, 0, 0);
            
            // Add this frame to our collection
            gifFramesRef.current.push(frameCanvas);
            framesProcessed++;
          }
          
          frameCount++;
          
          // Calculate next frame time based on playback speed
          // We use a small increment to ensure smooth frame capture
          const frameDuration = 1/30; // Aim for 30fps capture
          const nextTime = video.currentTime + (frameDuration * playbackSpeed);
          
          // Update progress (use 60% of the progress bar for frame capture)
          const progress = (video.currentTime / totalDuration) * 60;
          setProcessingProgress(Math.min(60, progress)); 
          
          // Check if we've reached the end
          if (nextTime >= totalDuration) {
            // We've captured all frames, now create the GIF
            setSuccess(`Creating GIF with ${gifFramesRef.current.length} frames...`);
            try {
              // First try with GIF.js
              try {
                const gifBlob = await createGifFromFrames(
                  gifFramesRef.current, 
                  targetWidth, 
                  targetHeight, 
                  frameDelay
                );
                
                const gifUrl = URL.createObjectURL(gifBlob);
                setProcessedVideoUrl(gifUrl);
                setSuccess(`GIF created successfully! ${gifFramesRef.current.length} frames at ${targetWidth}x${targetHeight}`);
                setProcessingProgress(100);
                setIsProcessing(false);
              } catch (gifError) {
                console.error('Error creating GIF with GIF.js:', gifError);
                // Fall back to our manual GIF creation approach
                setSuccess('Using alternative GIF creation method...');
                
                // Create an animated canvas as fallback
                const animatedCanvas = document.createElement('canvas');
                animatedCanvas.width = targetWidth;
                animatedCanvas.height = targetHeight;
                const animCtx = animatedCanvas.getContext('2d');
                
                // Simulate GIF with a video by using MediaRecorder on a canvas stream
                const stream = animatedCanvas.captureStream();
                const alternateRecorder = new MediaRecorder(stream, {
                  mimeType: getSupportedMimeType('webm'),
                  videoBitsPerSecond: 2000000 // 2Mbps is good for animated content
                });
                
                const animChunks = [];
                alternateRecorder.ondataavailable = e => {
                  if (e.data.size > 0) animChunks.push(e.data);
                };
                
                alternateRecorder.onstop = () => {
                  const fallbackBlob = new Blob(animChunks, { type: 'video/webm' });
                  const fallbackUrl = URL.createObjectURL(fallbackBlob);
                  setProcessedVideoUrl(fallbackUrl);
                  setSuccess('Your animation has been created. Due to browser security limitations, it has been saved as a WebM video instead of a GIF. You can convert this video to GIF using desktop software if needed.');
                  setProcessingProgress(100);
                  setIsProcessing(false);
                };
                
                alternateRecorder.start();
                
                // Now animate through the frames
                let frameIndex = 0;
                const renderFrame = () => {
                  if (frameIndex >= gifFramesRef.current.length) {
                    alternateRecorder.stop();
                    return;
                  }
                  
                  const frame = gifFramesRef.current[frameIndex];
                  animCtx.clearRect(0, 0, targetWidth, targetHeight);
                  animCtx.drawImage(frame, 0, 0);
                  frameIndex++;
                  
                  // Update progress during animation
                  const animProgress = 60 + (frameIndex / gifFramesRef.current.length) * 39;
                  setProcessingProgress(Math.min(99, animProgress));
                  
                  // Schedule next frame
                  setTimeout(renderFrame, frameDelay);
                };
                
                // Start the animation
                renderFrame();
              }
            } catch (finalError) {
              console.error('All GIF creation methods failed:', finalError);
              setError(`Could not create animation: ${finalError.message}`);
              setIsProcessing(false);
            }
            return;
          }
          
          // Set next frame time
          video.currentTime = nextTime;
        };
        
        // Handle seeking completion for GIF frames
        video.onseeked = processGifFrame;
        
        // Start GIF processing
        processGifFrame();
        
      } else {
        // For video formats, use MediaRecorder

        // Create a media stream from the canvas
        const stream = canvas.captureStream();
        
        // Create media recorder
        const mimeType = getSupportedMimeType(outputFormat);
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: mimeType,
          ...videoQualitySettings
        });
        
        // Clear chunks array
        chunksRef.current = [];
        
        // Handle data available event
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        
        // Handle recording stop event
        mediaRecorderRef.current.onstop = async () => {
          try {
            // Determine the correct MIME type for the blob
            let blobMimeType = 'video/webm';
            if (outputFormat === 'mp4') {
              blobMimeType = 'video/mp4';
            }
            
            const blob = new Blob(chunksRef.current, { type: blobMimeType });
            const url = URL.createObjectURL(blob);
            setProcessedVideoUrl(url);
            setSuccess('Video processing complete!');
            setProcessingProgress(100);
            setIsProcessing(false);
            
            // Ensure the processed video loads properly
            if (processedVideoRef.current) {
              processedVideoRef.current.load();
            }
          } catch (error) {
            console.error('Error processing video output:', error);
            setError(`Error in final processing: ${error.message}`);
            setIsProcessing(false);
          }
        };
        
        // Start recording
        mediaRecorderRef.current.start(100);
        
        // Set initial time and track progress
        const startTime = 0;
        const totalDuration = video.duration;
        video.currentTime = startTime;
        
        // Process frame by frame
        const processFrame = () => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive' || processingCancelledRef.current) {
            return;
          }
          
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Calculate next frame time based on playback speed
          const frameRate = 30; // Frames per second
          const frameDuration = 1 / frameRate;
          const nextTime = video.currentTime + (frameDuration * playbackSpeed);
          
          // Update progress
          const progress = (video.currentTime / totalDuration) * 100;
          setProcessingProgress(Math.min(99, progress)); // Cap at 99% until we're completely done
          
          // Check if we've reached the end
          if (nextTime >= totalDuration) {
            mediaRecorderRef.current.stop();
            return;
          }
          
          // Set next frame time
          video.currentTime = nextTime;
        };
        
        // Handle seeking completion
        video.onseeked = processFrame;
        
        // Start processing
        processFrame();
      }
      
    } catch (err) {
      console.error('Error processing video:', err);
      setError(`Processing error: ${err.message}`);
      setIsProcessing(false);
      // Clean up
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Cancel processing
  const cancelProcessing = () => {
    processingCancelledRef.current = true;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Clear GIF frames to free memory
    gifFramesRef.current = [];
    
    setIsProcessing(false);
    setError('Processing canceled');
  };

  // Reset everything
  const resetAll = () => {
    // Stop any ongoing processing
    processingCancelledRef.current = true;
    
    // Revoke existing URLs to free up memory
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
    
    // Clear GIF frames to free memory
    gifFramesRef.current = [];
    
    // Reset all state variables
    setVideoFile(null);
    setVideoUrl('');
    setProcessedVideoUrl('');
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setPlaybackSpeed(1.0);
    setIsProcessing(false);
    setError('');
    setSuccess('');
    setVideoInfo(null);
    setProcessingProgress(0);
    
    // Pause any playing videos
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    if (processedVideoRef.current) {
      processedVideoRef.current.pause();
    }
    
    // Reset the file input by changing the key to force re-render
    setFileKey(Date.now());
  };

  // Download processed video
  const downloadVideo = () => {
    if (!processedVideoUrl) return;
    
    const a = document.createElement('a');
    a.href = processedVideoUrl;
    
    // Create a filename based on original name and speed
    const speedText = playbackSpeed < 1 ? 
      `slow-${playbackSpeed}x` : 
      `fast-${playbackSpeed}x`;
      
    const originalName = videoFile.name.split('.').slice(0, -1).join('.');
    
    // Determine extension - for GIF format, we're actually producing WebM
    let extension = 'webm'; // Default extension
    
    // Only use MP4 if that was specifically selected
    if (outputFormat === 'mp4') {
      extension = 'mp4';
    }
    
    // If user selected GIF, add a note in the filename
    const formatNote = outputFormat === 'gif' ? '-animation' : '';
    
    a.download = `${originalName}-${speedText}${formatNote}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Description for Layout component
  const descriptionElement = (
    <div className="info-banner">
      <div className="info-icon">
        <Info size={20} />
      </div>
      <div className="info-content">
        Upload a video and adjust its playback speed to create slow-motion or fast-motion effects. All processing happens locally in your browser - no data is sent to any server.
      </div>
    </div>
  );

  return (
    <Layout
      title="Video Speed Controller"
      description={descriptionElement}
    >
      <div className="video-speed-container">
        {/* File upload section */}
        <div className="upload-section">
          <div className="input-group">
            <label htmlFor="video-upload">Upload Video:</label>
            <div className="file-upload-wrapper">
              <label className="file-upload-button" htmlFor={`video-upload-${fileKey}`}>
                <Upload size={18} />
                <span>Choose Video File</span>
              </label>
              <input 
                id={`video-upload-${fileKey}`}
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="video/*"
                disabled={isProcessing}
                className="hidden-file-input"
                key={fileKey}
              />
              {videoFile && (
                <div className="file-name">
                  {videoFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Video info details */}
          {videoInfo && (
            <div className="video-info">
              <h3>Video Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{videoInfo.duration}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Size:</span>
                  <span className="info-value">{videoInfo.size}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Dimensions:</span>
                  <span className="info-value">{videoInfo.width}×{videoInfo.height}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{videoInfo.type.split('/')[1]}</span>
                </div>
              </div>
            </div>
          )}

          {/* Video preview */}
          {videoUrl && (
            <div className="video-preview">
              <h3>Original Video Preview</h3>
              <div className="video-container">
                <video 
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  muted
                />
                
                <div className="video-controls">
                  <button 
                    className="play-pause-button" 
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <StopCircle size={20} /> : <PlayCircle size={20} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <div className="time-display">
                    {formatCurrentTime()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Speed control section */}
          {videoUrl && !isProcessing && !processedVideoUrl && (
            <div className="speed-control-section">
              <h3>Playback Speed Control</h3>
              
              {/* OUTPUT FORMAT SELECTION - Moved outside advanced options */}
              <div className="format-control">
                <label>Output Format:</label>
                <div className="format-options">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="format" 
                      value="webm" 
                      checked={outputFormat === 'webm'} 
                      onChange={() => setOutputFormat('webm')} 
                    />
                    <span>WebM (best quality, most compatible)</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="format" 
                      value="mp4" 
                      checked={outputFormat === 'mp4'} 
                      onChange={() => setOutputFormat('mp4')} 
                    />
                    <span>MP4 (widely supported)</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="format" 
                      value="gif" 
                      checked={outputFormat === 'gif'} 
                      onChange={() => setOutputFormat('gif')} 
                    />
                    <span>GIF (animated image format)</span>
                  </label>
                </div>
              </div>
              
              <div className="speed-slider-container">
                <div className="speed-slider-labels">
                  <span>Slow Motion</span>
                  <span>Normal</span>
                  <span>Fast Motion</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={playbackSpeed}
                  onChange={handleSpeedChange}
                  className="speed-slider"
                />
                <div className="current-speed">
                  <div className="speed-badge">
                    {playbackSpeed}x speed
                  </div>
                  <div className="output-duration">
                    Estimated output duration: {getEstimatedDuration()}
                  </div>
                </div>
              </div>
              
              <div className="preset-speeds">
                <button 
                  onClick={() => setPlaybackSpeed(0.25)} 
                  className={`preset-button ${playbackSpeed === 0.25 ? 'active' : ''}`}
                >
                  0.25x
                </button>
                <button 
                  onClick={() => setPlaybackSpeed(0.5)} 
                  className={`preset-button ${playbackSpeed === 0.5 ? 'active' : ''}`}
                >
                  0.5x
                </button>
                <button 
                  onClick={() => setPlaybackSpeed(1)} 
                  className={`preset-button ${playbackSpeed === 1 ? 'active' : ''}`}
                >
                  1x
                </button>
                <button 
                  onClick={() => setPlaybackSpeed(1.5)} 
                  className={`preset-button ${playbackSpeed === 1.5 ? 'active' : ''}`}
                >
                  1.5x
                </button>
                <button 
                  onClick={() => setPlaybackSpeed(2)} 
                  className={`preset-button ${playbackSpeed === 2 ? 'active' : ''}`}
                >
                  2x
                </button>
                <button 
                  onClick={() => setPlaybackSpeed(4)} 
                  className={`preset-button ${playbackSpeed === 4 ? 'active' : ''}`}
                >
                  4x
                </button>
              </div>
              
              <div className="advanced-options-toggle" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                <Settings size={16} />
                <span>{showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}</span>
              </div>
              
              {showAdvancedOptions && (
                <div className="advanced-options">
                  {outputFormat === 'gif' ? (
                    <>
                      {/* GIF-specific options */}
                      <div className="quality-control">
                        <label>GIF Quality:</label>
                        <div className="quality-options">
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name="gif-quality" 
                              value="low" 
                              checked={gifQuality === 'low'} 
                              onChange={() => setGifQuality('low')} 
                            />
                            <span>Low (smaller file, faster)</span>
                          </label>
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name="gif-quality" 
                              value="medium" 
                              checked={gifQuality === 'medium'} 
                              onChange={() => setGifQuality('medium')} 
                            />
                            <span>Medium (balanced)</span>
                          </label>
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name="gif-quality" 
                              value="high" 
                              checked={gifQuality === 'high'} 
                              onChange={() => setGifQuality('high')} 
                            />
                            <span>High (better quality, larger file)</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="gif-size-control">
                        <label>GIF Width: {gifWidth}px</label>
                        <input
                          type="range"
                          min="160"
                          max="800"
                          step="80"
                          value={gifWidth}
                          onChange={(e) => setGifWidth(Number(e.target.value))}
                          className="gif-width-slider"
                        />
                        <div className="size-note">
                          <Info size={14} />
                          <span>Smaller width = smaller file size. Height will adjust proportionally.</span>
                        </div>
                      </div>
                      
                      <div className="gif-warning">
                        <AlertCircle size={16} />
                        <span>
                          Note: Creating GIFs can be memory-intensive. For high-quality results with longer videos, 
                          consider using a video format instead.
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Video format options */}
                      <div className="quality-control">
                        <label>Output Quality:</label>
                        <div className="quality-options">
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name="quality" 
                              value="low" 
                              checked={videoQuality === 'low'} 
                              onChange={() => setVideoQuality('low')} 
                            />
                            <span>Low (faster processing)</span>
                          </label>
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name="quality" 
                              value="medium" 
                              checked={videoQuality === 'medium'} 
                              onChange={() => setVideoQuality('medium')} 
                            />
                            <span>Medium</span>
                          </label>
                          <label className="radio-label">
                            <input 
                              type="radio" 
                              name="quality" 
                              value="high" 
                              checked={videoQuality === 'high'} 
                              onChange={() => setVideoQuality('high')} 
                            />
                            <span>High (larger file size)</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="process-controls">
                <button 
                  onClick={processVideo} 
                  className="process-button"
                  disabled={isProcessing}
                >
                  <PlayCircle size={18} />
                  <span>Process {outputFormat === 'gif' ? 'GIF' : 'Video'} with {playbackSpeed}x Speed</span>
                </button>
                
                <button onClick={resetAll} className="reset-button">
                  <RefreshCw size={18} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="processing-section">
              <h3>Processing {outputFormat === 'gif' ? 'GIF' : 'Video'}...</h3>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${processingProgress}%` }}></div>
              </div>
              <div className="progress-info">
                <span>{Math.round(processingProgress)}% Complete</span>
                <button onClick={cancelProcessing} className="cancel-button">
                  <StopCircle size={16} />
                  <span>Cancel</span>
                </button>
              </div>
              <p className="processing-note">
                <Info size={16} />
                <span>
                  {outputFormat === 'gif' 
                    ? "Creating GIFs requires significant processing. This may take several minutes depending on video length and quality settings." 
                    : "Depending on the video size and your device's performance, this might take a while. Please don't close this page."}
                </span>
              </p>
            </div>
          )}

          {/* Processed video section */}
          {processedVideoUrl && (
            <div className="processed-video-section">
              <h3>Processed {outputFormat === 'gif' ? 'Animation' : 'Video'} ({playbackSpeed}x Speed)</h3>
              
              {/* Always use video tag since we're now always producing WebM */}
              <div className="video-container">
                <video 
                  ref={processedVideoRef}
                  src={processedVideoUrl}
                  controls
                  autoPlay
                  loop
                  key={processedVideoUrl} // Add key to force re-render
                />
              </div>
              
              <div className="download-controls">
                <button onClick={downloadVideo} className="download-button">
                  <Download size={18} />
                  <span>Download Processed {outputFormat === 'gif' ? 'Animation' : 'Video'}</span>
                </button>
                
                <button onClick={resetAll} className="reset-button">
                  <RefreshCw size={18} />
                  <span>Process Another {outputFormat === 'gif' ? 'Animation' : 'Video'}</span>
                </button>
              </div>

              {outputFormat === 'gif' && (
                <div className="info-message">
                  <Info size={16} />
                  <span>
                    Due to browser limitations, your animation has been created as a WebM video instead of a GIF. 
                    This format still preserves all speed adjustments and plays perfectly in browsers, and can be 
                    converted to GIF using desktop tools if needed.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error and success messages */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <Check size={16} />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Instructions section */}
        <div className="instructions-section">
          <h3>How to Use This Tool</h3>
          <ol>
            <li>Upload a video file using the selector above</li>
            <li>Choose your preferred output format (WebM, MP4, or GIF)</li>
            <li>Adjust the playback speed using the slider or preset buttons</li>
            <li>Click "Process Video" to create your speed-adjusted video</li>
            <li>Preview the result and download your new video file</li>
          </ol>
          
          <div className="tips">
            <h4>Tips</h4>
            <ul>
              <li>For smooth slow motion, use values less than 1 (0.5x, 0.25x)</li>
              <li>For time-lapse effects, use faster speeds (2x, 4x)</li>
              <li>Processing high-resolution videos may take longer</li>
              <li>For best results with slow motion, try to use videos recorded at high frame rates (60fps or higher)</li>
              <li>When creating GIFs, using smaller dimensions and lower quality settings will result in smaller file sizes</li>
            </ul>
          </div>
          
          <div className="technical-notes">
            <h4>Technical Notes</h4>
            <ul>
              <li>All processing happens in your browser - videos are not uploaded to any server</li>
              <li>You can choose from multiple output formats (WebM, MP4, GIF)</li>
              <li>Maximum supported file size is 500MB</li>
              <li>Processing large videos may use significant system resources</li>
              <li>GIF creation uses the GIF.js library and can be memory-intensive. For longer videos, video formats are recommended.</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default VideoSpeedController;
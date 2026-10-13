These tiny local test clips contain 0.8 seconds of red followed by 0.8 seconds of blue at 640×320 pixels and 25 FPS. They exercise native browser seeking and independent GIF decoding. No external media is fetched during tests.

To regenerate them locally with FFmpeg:

```bash
ffmpeg -f lavfi -i 'color=c=red:s=640x320:r=25:d=0.8' -f lavfi -i 'color=c=blue:s=640x320:r=25:d=0.8' -filter_complex '[0:v][1:v]concat=n=2:v=1:a=0[out]' -map '[out]' -c:v libx264 -pix_fmt yuv420p -movflags +faststart colors.mp4
ffmpeg -i colors.mp4 -c:v libvpx-vp9 colors.webm
ffmpeg -i colors.mp4 -c:v libvpx-vp9 -live 1 colors-no-duration.webm
```

FFmpeg is only needed to regenerate these committed fixtures. The application uses native browser decoding and does not depend on FFmpeg.

export function captureFrameFromVideo(videoElement, options = {}) {
  if (!videoElement) {
    return null
  }

  const { maxSide = 512, quality = 0.6 } = options
  const { videoWidth, videoHeight } = videoElement

  if (!videoWidth || !videoHeight) {
    return null
  }

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, maxSide / Math.max(videoWidth, videoHeight))
  const targetWidth = Math.max(1, Math.round(videoWidth * scale))
  const targetHeight = Math.max(1, Math.round(videoHeight * scale))
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.drawImage(videoElement, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function captureFramesAtOnePerSecond(videoElement, durationSeconds = 5, options = {}) {
  const frames = []

  for (let second = 0; second < durationSeconds; second += 1) {
    if (second > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const frame = captureFrameFromVideo(videoElement, options)

    if (frame) {
      frames.push(frame)
    }
  }

  return frames
}

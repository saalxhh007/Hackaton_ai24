import { useEffect, useRef, useState } from "react"

export function CameraFeed({ id, fullscreen = false }) {
  const canvasRef = useRef(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Create a placeholder image
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = `https://via.placeholder.com/480x270/111827/6B7280?text=Camera+${id}`

    // Draw timestamp and camera info
    const drawInfo = () => {
      if (!ctx) return

      const now = new Date()
      const timeString = now.toLocaleTimeString()
      const dateString = now.toLocaleDateString()

      // Clear the bottom area for text
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20)

      // Draw text
      ctx.fillStyle = "white"
      ctx.font = "12px monospace"
      ctx.fillText(`CAM${id} | ${dateString} ${timeString}`, 5, canvas.height - 5)

      // Add random movement to simulate activity
      const x = Math.random() * canvas.width
      const y = Math.random() * (canvas.height - 30)
      const size = Math.random() * 10 + 5

      // Only occasionally show movement (10% chance)
      if (Math.random() > 0.9) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw pan/zoom indicators if in fullscreen mode
      if (fullscreen) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(0, 0, 150, 20)
        ctx.fillStyle = "white"
        ctx.font = "12px monospace"
        ctx.fillText(`Zoom: ${zoom.toFixed(1)}x | Pan: ${pan.x}, ${pan.y}`, 5, 15)
      }
    }

    // Draw the image when loaded
    img.onload = () => {
      const aspectRatio = img.width / img.height
      let drawWidth = canvas.width
      let drawHeight = canvas.width / aspectRatio

      if (drawHeight > canvas.height) {
        drawHeight = canvas.height
        drawWidth = canvas.height * aspectRatio
      }

      // Apply zoom and pan
      const zoomedWidth = drawWidth * zoom
      const zoomedHeight = drawHeight * zoom

      // Calculate center position
      const centerX = (canvas.width - drawWidth) / 2
      const centerY = (canvas.height - drawHeight) / 2

      // Apply pan offset
      const x = centerX - pan.x * 10 + (drawWidth - zoomedWidth) / 2
      const y = centerY - pan.y * 10 + (drawHeight - zoomedHeight) / 2

      // Animation loop
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, x, y, zoomedWidth, zoomedHeight)
        drawInfo()
        requestAnimationFrame(animate)
      }

      animate()
    }

    // Handle window resize
    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [id, fullscreen, pan, zoom])

  // Reset pan and zoom when switching cameras
  useEffect(() => {
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }, [id])

  // Expose pan and zoom controls to parent component
  useEffect(() => {
    if (!fullscreen) return

    // Add to window object for access from camera controls
    window.cameraControls = window.cameraControls || {}
    window.cameraControls[id] = {
      panUp: () => setPan((prev) => ({ ...prev, y: prev.y - 1 })),
      panDown: () => setPan((prev) => ({ ...prev, y: prev.y + 1 })),
      panLeft: () => setPan((prev) => ({ ...prev, x: prev.x - 1 })),
      panRight: () => setPan((prev) => ({ ...prev, x: prev.x + 1 })),
      zoomIn: () => setZoom((prev) => Math.min(prev + 0.1, 2)),
      zoomOut: () => setZoom((prev) => Math.max(prev - 0.1, 0.5)),
      resetView: () => {
        setPan({ x: 0, y: 0 })
        setZoom(1)
      },
    }

    return () => {
      if (window.cameraControls) {
        delete window.cameraControls[id]
      }
    }
  }, [id, fullscreen])

  return (
    <canvas
      ref={canvasRef}
      className={`bg-black relative ${fullscreen ? "h-[200px]" : "aspect-video"}`}
    //   style={{ minHeight: fullscreen ? "400px" : "180px" }}
    />
  )
}

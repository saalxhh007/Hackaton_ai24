import { useState } from "react"
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react"

import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

export function CameraControls({ cameraId, isRecording, onToggleRecording }) {
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(50)
  const [activeTab, setActiveTab] = useState("controls")

  const handlePanUp = () => window.cameraControls?.[cameraId]?.panUp()
  const handlePanDown = () => window.cameraControls?.[cameraId]?.panDown()
  const handlePanLeft = () => window.cameraControls?.[cameraId]?.panLeft()
  const handlePanRight = () => window.cameraControls?.[cameraId]?.panRight()
  const handleZoomIn = () => window.cameraControls?.[cameraId]?.zoomIn()
  const handleZoomOut = () => window.cameraControls?.[cameraId]?.zoomOut()
  const handleResetView = () => window.cameraControls?.[cameraId]?.resetView()

  const handleScreenshot = () => {
    const canvas = document.querySelector(`canvas`)
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `camera-${cameraId}-${new Date().toISOString()}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="controls">Camera Controls</TabsTrigger>
        <TabsTrigger value="playback">Playback</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="controls" className="space-y-4">
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="col-span-1 flex flex-col items-center justify-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleResetView}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePanUp}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePanLeft}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePanRight}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={handlePanDown}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center gap-2">
            <Button variant={isRecording ? "destructive" : "outline"} className="w-full" onClick={onToggleRecording}>
              <Video className="mr-2 h-4 w-4" />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleScreenshot}>
              <Camera className="mr-2 h-4 w-4" />
              Screenshot
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setMuted(!muted)}>
              {muted ? (
                <>
                  <VolumeX className="mr-2 h-4 w-4" />
                  Unmute
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Mute
                </>
              )}
            </Button>
          </div>
        </div>

        {!muted && (
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <Slider value={[volume]} max={100} step={1} onValueChange={(value) => setVolume(value[0])} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="playback" className="space-y-4">
        <div className="rounded-md border p-4">
          <h3 className="mb-2 font-medium">Recorded Footage</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md bg-muted p-2">
              <span>Today 10:24 AM</span>
              <Button variant="ghost" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted p-2">
              <span>Today 08:15 AM</span>
              <Button variant="ghost" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted p-2">
              <span>Yesterday 11:42 PM</span>
              <Button variant="ghost" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <div className="rounded-md border p-4">
          <h3 className="mb-2 font-medium">Camera Settings</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Motion Detection</span>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Notification Rules</span>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Video Quality</span>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

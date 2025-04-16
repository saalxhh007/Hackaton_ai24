import { useState } from "react"
import { Video } from "lucide-react"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"

export function CameraMapView({ cameras, onCameraSelect }) {
  const [selectedCamera, setSelectedCamera] = useState(null)

  const handleCameraClick = (camera) => {
    setSelectedCamera(camera)
  }

  const handleViewFullscreen = () => {
    if (selectedCamera) {
      onCameraSelect(selectedCamera)
      setSelectedCamera(null)
    }
  }

  return (
    <div className="p-4">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <div className="aspect-[16/9] w-full bg-muted p-4">
              <div className="relative h-full w-full border border-dashed border-border bg-card">
                <div className="absolute left-[10%] top-[20%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "1")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[30%] top-[30%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "3")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[50%] top-[40%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "7")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[70%] top-[20%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "8")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[20%] top-[60%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "9")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[40%] top-[70%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "10")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[60%] top-[60%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "11")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[80%] top-[80%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "5")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[90%] top-[40%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "2")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[10%] top-[80%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "4")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[30%] top-[90%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "6")} onClick={handleCameraClick} />
                </div>
                <div className="absolute left-[80%] top-[10%]">
                  <CameraMarker camera={cameras.find((c) => c.id === "12")} onClick={handleCameraClick} />
                </div>

                {/* Floor plan labels */}
                <div className="absolute left-[25%] top-[25%] text-sm font-medium">Main Office</div>
                <div className="absolute left-[65%] top-[25%] text-sm font-medium">Conference Rooms</div>
                <div className="absolute left-[30%] top-[75%] text-sm font-medium">Cafeteria</div>
                <div className="absolute left-[70%] top-[75%] text-sm font-medium">IT Department</div>
                <div className="absolute left-[85%] top-[30%] text-sm font-medium">Parking</div>
                <div className="absolute left-[15%] top-[75%] text-sm font-medium">Warehouse</div>

                {/* Building outline */}
                <div className="absolute left-[5%] top-[15%] h-[70%] w-[90%] border border-dashed border-muted-foreground"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCamera} onOpenChange={(open) => !open && setSelectedCamera(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCamera?.name}</DialogTitle>
            <DialogDescription>{selectedCamera?.location}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${selectedCamera?.status === "online" ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span>{selectedCamera?.status === "online" ? "Online" : "Offline"}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCamera(null)}>
                Close
              </Button>
              <Button onClick={handleViewFullscreen}>View Camera</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CameraMarker({ camera, onClick }) {
  if (!camera) return null

  return (
    <Button
      variant="outline"
      size="icon"
      className={`rounded-full ${camera.status === "online" ? "bg-green-500/10 hover:bg-green-500/20" : "bg-red-500/10 hover:bg-red-500/20"}`}
      onClick={() => onClick(camera)}
    >
      <Video className={`h-4 w-4 ${camera.status === "online" ? "text-green-500" : "text-red-500"}`} />
      <span className="sr-only">{camera.name}</span>
    </Button>
  )
}

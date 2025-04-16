import { MoreVertical, Video } from "lucide-react"

import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export function CameraListView({ cameras, onFullscreen, isRecording, onToggleRecording }) {
  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recording</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cameras.map((camera) => (
            <TableRow key={camera.id}>
              <TableCell className="font-medium">{camera.id}</TableCell>
              <TableCell>{camera.name}</TableCell>
              <TableCell>{camera.location}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${camera.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  {camera.status === "online" ? "Online" : "Offline"}
                </div>
              </TableCell>
              <TableCell>
                {camera.recording || isRecording[camera.id] ? (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                    Recording
                  </div>
                ) : (
                  "Not Recording"
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onToggleRecording(camera.id)}>
                    <Video className="h-4 w-4" />
                    <span className="sr-only">{isRecording[camera.id] ? "Stop Recording" : "Start Recording"}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onFullscreen(camera)}>
                    View
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onFullscreen(camera)}>View Fullscreen</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleRecording(camera.id)}>
                        {isRecording[camera.id] ? "Stop Recording" : "Start Recording"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>Take Screenshot</DropdownMenuItem>
                      <DropdownMenuItem>Camera Settings</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

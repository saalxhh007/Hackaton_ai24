import { MoreVertical } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { CameraFeed } from "./camera-feed";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const CameraCard = ({
    id,
    name,
    location,
    status,
    recording,
    isRecording,
    onFullscreen,
    onToggleRecording,
  }) => {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <CameraFeed id={id} />
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-xs text-white">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "online" ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              {status === "online" ? "Live" : "Offline"}
              {(recording || isRecording) && (
                <span className="ml-2 flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                  Rec
                </span>
              )}
            </div>
            <div className="absolute right-2 top-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onFullscreen}>
                    View Fullscreen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleRecording}>
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>Take Screenshot</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Camera Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{name}</h3>
                <p className="text-sm text-muted-foreground">{location}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onFullscreen}>
                Expand
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

export default CameraCard;
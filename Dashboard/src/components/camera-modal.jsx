import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { CameraControls } from "./camera-controls";
import { CameraFeed } from "./camera-feed";

const CameraModal = ({open, onOpenChange, isRecording, toggleRecording}) => {
  return (
    <div>
      {" "}
      {/* Fullscreen Camera Dialog */}
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="p-0 sm:rounded-lg max-w-none w-full">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{open?.name}</DialogTitle>
            <DialogDescription>{open?.location}</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video w-full bg-black">
            {open && (
              <>
                <CameraFeed id={open.id} fullscreen />
                <div className="absolute left-4 top-4 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-sm text-white">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      open.status === "online"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                  {open.status === "online" ? "Live" : "Offline"}
                  {(open.recording ||
                    isRecording[open.id]) && (
                    <span className="ml-2 flex items-center gap-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                      Recording
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="p-4">
            <CameraControls
              cameraId={open?.id || ""}
              isRecording={
                !!open &&
                (open.recording ||
                  !!isRecording[open.id])
              }
              onToggleRecording={() =>
                open && toggleRecording(open.id)
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CameraModal;

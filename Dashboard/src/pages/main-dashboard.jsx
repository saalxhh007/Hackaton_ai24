import { useState } from "react";
import { CameraSidebar } from "../components/camera-sidebar";
import CameraModal from "@/components/camera-modal";
import { Outlet } from "react-router-dom";

// Camera data
const cameras = [
  {
    id: "1",
    name: "Front Entrance",
    location: "Main Building",
    status: "online",
    recording: true,
  },
  {
    id: "2",
    name: "Parking Lot",
    location: "North Side",
    status: "online",
    recording: false,
  },
  {
    id: "3",
    name: "Lobby",
    location: "Main Building",
    status: "online",
    recording: true,
  },
  {
    id: "4",
    name: "Back Entrance",
    location: "Warehouse",
    status: "offline",
    recording: false,
  },
  {
    id: "5",
    name: "Server Room",
    location: "IT Department",
    status: "online",
    recording: true,
  },
  {
    id: "6",
    name: "Loading Dock",
    location: "Warehouse",
    status: "online",
    recording: false,
  },
  {
    id: "7",
    name: "Hallway 1",
    location: "Main Building",
    status: "online",
    recording: true,
  },
  {
    id: "8",
    name: "Hallway 2",
    location: "Main Building",
    status: "online",
    recording: false,
  },
  {
    id: "9",
    name: "Cafeteria",
    location: "Main Building",
    status: "online",
    recording: true,
  },
  {
    id: "10",
    name: "Executive Office",
    location: "Main Building",
    status: "online",
    recording: false,
  },
  {
    id: "11",
    name: "Conference Room",
    location: "Main Building",
    status: "offline",
    recording: false,
  },
  {
    id: "12",
    name: "Storage Area",
    location: "Warehouse",
    status: "online",
    recording: true,
  },
];

function MainDashboard() {
  const [fullscreenCamera, setFullscreenCamera] = useState(null);

  const [isRecording, setIsRecording] = useState({});

  

  // Toggle recording for a camera
  const toggleRecording = (id) => {
    setIsRecording((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Create context object for Outlet
  const outletContext = {
    cameras,
    isRecording,
    toggleRecording,
    setFullscreenCamera
  };

  return (
    <div className="flex max-h-screen bg-background">
      <div className="flex flex-1">
        <aside className="hidden w-[270px] flex-col border-r bg-muted/40 md:flex">
          <CameraSidebar
            onCameraSelect={(id) => {
              const camera = cameras.find((c) => c.id === id);
              if (camera) setFullscreenCamera(camera);
            }}
          />
        </aside>
        <main className="flex-1 overflow-auto">
          <Outlet context={outletContext}/>
        </main>
      </div>

      <CameraModal
        onOpenChange={(open) => !open && setFullscreenCamera(null)}
        open={!!fullscreenCamera}
        isRecording={isRecording}
        toggleRecording={toggleRecording}
      ></CameraModal>
    </div>
  );
}

export default MainDashboard;

import {
  Activity,
  Home,
  MapPin,
  PersonStanding,
  Plus,
  Video,
} from "lucide-react";

import { Button } from "./ui/button";

import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import CameraGroup from "./camera-group";
import { useLocation, useNavigate } from "react-router-dom";

// Navigation button component
function NavButton({ icon, label, link, onClick }) {
  const isSelected = location === link
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full justify-start gap-2 ${
        isSelected && "bg-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </Button>
  );
}

export function CameraSidebar({ onCameraSelect }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Camera data organized by groups
  const cameraGroups = [
    {
      title: "Main Building",
      defaultOpen: true,
      cameras: [
        { name: "Front Entrance", id: "1", status: "online" },
        { name: "Lobby", id: "3", status: "online" },
        { name: "Hallway 1", id: "7", status: "online" },
        { name: "Hallway 2", id: "8", status: "online" },
        { name: "Cafeteria", id: "9", status: "online" },
        { name: "Executive Office", id: "10", status: "online" },
        { name: "Conference Room", id: "11", status: "offline" },
      ],
    },
    {
      title: "Warehouse",
      cameras: [
        { name: "Back Entrance", id: "4", status: "offline" },
        { name: "Loading Dock", id: "6", status: "online" },
        { name: "Storage Area", id: "12", status: "online" },
      ],
    },
    {
      title: "Parking",
      cameras: [
        { name: "Parking Lot", id: "2", status: "online" },
        { name: "Garage Entrance", id: "13", status: "online" },
      ],
    },
    {
      title: "IT Department",
      cameras: [
        { name: "Server Room", id: "5", status: "online" },
        { name: "IT Office", id: "14", status: "online" },
      ],
    },
  ];

  // Navigation items
  const navItems = [
    { icon: <Home className="h-4 w-4" />, label: "Dashboard", link: "/" },
    {
      icon: <Video className="h-4 w-4" />,
      label: "All Cameras",
      link: "/cameras",
    },
    {
      icon: <PersonStanding className="h-4 w-4" />,
      label: "Employees",
      link: "/employees",
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "Activity",
      link: "/activity",
    },
    // { icon: <MapPin className="h-4 w-4" />, label: "Map View", link: "map"},
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cameras</h2>
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="mt-3">
          <Input placeholder="Search cameras..." />
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <ScrollArea className="flex-1 px-3 py-2">
        {/* Navigation Buttons */}
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <NavButton
              key={index}
              icon={item.icon}
              label={item.label}
              link={item.link}
              onClick={() => navigate(item.link)}
            />
          ))}
        </div>

        <Separator className="my-4" />

        {/* Camera Groups */}
        {location === "/cameras" && (
          <div className="space-y-3">
            {cameraGroups.map((group, index) => (
              <CameraGroup
                key={index}
                title={group.title}
                cameras={group.cameras}
                onCameraSelect={onCameraSelect}
                defaultOpen={group.defaultOpen}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button variant="outline" className="w-full">
          System Status
        </Button>
      </div>
    </div>
  );
}

import { ChevronDown } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "./ui/collapsible";
import CameraItem from "./camera-item";


// Collapsible camera group component for better organization
function CameraGroup({ title, cameras, onCameraSelect, defaultOpen = false }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-sm font-medium">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-2 space-y-1 pt-1">
          {cameras.map((camera) => (
            <CameraItem
              key={camera.id}
              name={camera.name}
              id={camera.id}
              status={camera.status}
              onSelect={onCameraSelect}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CameraGroup;

import { Button } from "./ui/button";

// Camera item component extracted for reusability
function CameraItem({ name, id, status, onSelect }) {
  return (
    <Button
      variant="ghost"
      className="h-auto w-full justify-start px-2 py-1 text-sm"
      onClick={() => onSelect?.(id)}
    >
      <div className="flex w-full items-center justify-between">
        <span>{name}</span>
        <span
          className={`h-2 w-2 rounded-full ${
            status === "online" ? "bg-green-500" : "bg-red-500"
          }`}
        />
      </div>
    </Button>
  );
}

export default CameraItem;

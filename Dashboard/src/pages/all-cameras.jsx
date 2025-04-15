import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

import { CameraListView } from "../components/camera-list-view";
import { CameraMapView } from "../components/camera-map-view";
import CameraCard from "@/components/camera-card";
import { Bell, ChevronDown, Menu, Search, Settings } from "lucide-react";

import { Button } from "../components/ui/button";
import { CameraSidebar } from "@/components/camera-sidebar";
import { useOutletContext } from "react-router-dom";



const AllCameras = () => {
  const [gridSize, setGridSize] = useState("4");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedView, setSelectedView] = useState("grid");

  const {cameras, isRecording, toggleRecording, setFullscreenCamera} = useOutletContext()
  // Filter cameras based on status
  const filteredCameras = cameras.filter((camera) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "online" && camera.status === "online") return true;
    if (statusFilter === "offline" && camera.status === "offline") return true;
    if (statusFilter === "recording" && camera.recording) return true;
    return false;
  });
  return (
    <div>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <CameraSidebar
              onCameraSelect={(id) => {
                const camera = cameras.find((c) => c.id === id);
                if (camera) setFullscreenCamera(camera);
              }}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h12Z" />
                <path d="M18 2H6a4 4 0 0 0-4 4v2h20V6a4 4 0 0 0-4-4Z" />
                <path d="M10 16h4" />
                <path d="M12 14v4" />
              </svg>
            </div>
            <span>SecureView</span>
          </a>
        </div>
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cameras..."
            className="w-full rounded-lg bg-background pl-8 md:w-[240px] lg:w-[440px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                View
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Layout</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedView("grid")}>
                Grid View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedView("list")}>
                List View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedView("map")}>
                Map View
              </DropdownMenuItem>
              {selectedView === "grid" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Grid Size</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setGridSize("2")}>
                    2x2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGridSize("3")}>
                    3x3
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGridSize("4")}>
                    4x4
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
        <h1 className="text-lg font-semibold">All Cameras</h1>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cameras</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="recording">Recording</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={selectedView}
        onValueChange={setSelectedView}
        className="w-full"
      >
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3 bg-muted">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-0">
          <div
            className={`grid gap-4 p-4 grid-cols-1 md:grid-cols-2 ${
              gridSize === "2"
                ? "lg:grid-cols-2"
                : gridSize === "3"
                ? "lg:grid-cols-3"
                : "lg:grid-cols-3 xl:grid-cols-4"
            }`}
          >
            {filteredCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                {...camera}
                isRecording={!!isRecording[camera.id]}
                onFullscreen={() => setFullscreenCamera(camera)}
                onToggleRecording={() => toggleRecording(camera.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <CameraListView
            cameras={filteredCameras}
            onFullscreen={(camera) => setFullscreenCamera(camera)}
            isRecording={isRecording}
            onToggleRecording={toggleRecording}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <CameraMapView
            cameras={filteredCameras}
            onCameraSelect={(camera) => setFullscreenCamera(camera)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AllCameras;

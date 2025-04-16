import { useEffect, useState, useRef } from "react";

export default function SocketComponent() {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameData, setFrameData] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const imageRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const setupConnection = () => {
      console.log("[INFO] Attempting to connect to server...");
      setConnectionError(null);

      const socket = new WebSocket("https://lfr5hc39-8000.euw.devtunnels.ms");

      wsRef.current = socket;
      setWs(socket);

      socket.onopen = () => {
        console.log("[INFO] Connected to the server");
        setIsConnected(true);
        setConnectionError(null);

        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      socket.onclose = () => {
        console.log("[INFO] Disconnected from the server");
        setIsConnected(false);
        setIsStreaming(false);
        setFrameData(null);

        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            console.log("[INFO] Attempting to reconnect...");
            reconnectTimerRef.current = null;
            setupConnection();
          }, 5000);
        }
      };

      socket.onerror = (error) => {
        console.error("[ERROR] WebSocket error:", error);
        setConnectionError("WebSocket error");
        socket.close(); // trigger onclose
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.frame) {
            const base64Frame = arrayBufferToBase64(data.frame);
            setFrameData(`data:image/jpeg;base64,${base64Frame}`);
          }
        } catch (error) {
          console.error("[ERROR] Failed to process message:", error);
        }
      };
    };

    const arrayBufferToBase64 = (buffer) => {
      let binary;
      if (buffer instanceof ArrayBuffer) {
        binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
      } else if (Array.isArray(buffer)) {
        binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
      } else if (typeof buffer === "string") {
        return btoa(buffer);
      } else {
        throw new Error("Unexpected buffer type");
      }
      return btoa(binary);
    };

    setupConnection();

    return () => {
      if (wsRef.current) {
        console.log("[INFO] Cleaning up WebSocket connection");
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  const toggleFrameStreaming = (enable) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("[WARN] WebSocket not open.");
      return;
    }

    const message = enable ? "1" : "0";
    try {
      ws.send(JSON.stringify({ command: "start_frame_stream", value: message }));
      console.log(`[INFO] ${enable ? "Starting" : "Stopping"} frame streaming...`);
      setIsStreaming(enable);

      if (!enable) {
        setFrameData(null);
      }
    } catch (error) {
      console.error("[ERROR] Failed to send message:", error);
      setIsStreaming(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mt-8">
        <h1 className="text-2xl font-bold mb-4">Real-Time Frame Streaming</h1>

        <p className="mb-4">
          Connection Status:{" "}
          <span className={isConnected ? "text-green-600" : "text-red-600 font-semibold"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </p>

        {connectionError && <p className="mb-4 text-red-600">{connectionError}</p>}

        <div className="flex justify-center gap-4 my-4">
          <button
            onClick={() => toggleFrameStreaming(true)}
            disabled={isStreaming || !isConnected}
            className={`px-4 py-2 rounded ${
              isStreaming || !isConnected
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Start Streaming
          </button>
          <button
            onClick={() => toggleFrameStreaming(false)}
            disabled={!isStreaming || !isConnected}
            className={`px-4 py-2 rounded ${
              !isStreaming || !isConnected
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            Stop Streaming
          </button>
        </div>

        <p className="mb-4">
          Streaming Status:{" "}
          <span className={isStreaming ? "text-green-600" : "text-red-600 font-semibold"}>
            {isStreaming ? "Streaming Active" : "Streaming Inactive"}
          </span>
        </p>

        <div className="flex justify-center mt-4">
          {frameData ? (
            <img
              ref={imageRef}
              src={frameData}
              alt="Video Stream"
              className="max-w-full border border-gray-300 rounded"
            />
          ) : (
            <div className="w-full max-w-lg h-80 bg-gray-100 flex items-center justify-center border border-gray-300 rounded">
              <p className="text-gray-500">
                {isStreaming ? "Waiting for video stream..." : "Video stream inactive"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

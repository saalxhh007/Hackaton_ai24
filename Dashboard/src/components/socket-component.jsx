import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const SocketComponent = () => {
  const [frame, setFrame] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to the Socket.IO server
    socketRef.current = io("http://localhost:8000"); // Replace with your server URL

    // Handle frame updates from the server
    socketRef.current.on("frame_update", (data) => {
      const base64Image = `data:image/jpeg;base64,${btoa(
        new Uint8Array(data.frame.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      )}`;
      setFrame(base64Image);
    });

    // Cleanup on component unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const startStreaming = () => {
    socketRef.current.emit("start_frame_stream", "1");
    setIsStreaming(true);
  };

  const stopStreaming = () => {
    socketRef.current.emit("start_frame_stream", "0");
    setIsStreaming(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Real-Time Frame Streaming</h1>
      <div>
        {frame ? (
          <img src={frame} alt="Live Frame" style={{ maxWidth: "100%" }} />
        ) : (
          <p>No frames received yet...</p>
        )}
      </div>
      <div style={{ marginTop: "20px" }}>
        <button onClick={startStreaming} disabled={isStreaming}>
          Start Streaming
        </button>
        <button
          onClick={stopStreaming}
          disabled={!isStreaming}
          style={{ marginLeft: "10px" }}
        >
          Stop Streaming
        </button>
      </div>
    </div>
  );
};

export default SocketComponent;
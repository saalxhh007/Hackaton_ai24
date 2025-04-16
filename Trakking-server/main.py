import os
import time
import asyncio
import cv2
import numpy as np
import torch
from ultralytics import YOLO
from fastapi import FastAPI
from cors_config import setup_cors
from socket_config import sio, create_socket_app

# --- Configuration ---
SAVE_DIR = "tracked_persons"
os.makedirs(SAVE_DIR, exist_ok=True)

FRAME_WIDTH, FRAME_HEIGHT = 640, 480
DETECT_EVERY_N_FRAMES = 5
MAX_DETECTIONS = 10
MIN_CONFIDENCE_FOR_SAVE = 0.5

# Define box coordinates (Outside and Inside)
box1 = (100, 100, 300, 500)  # First box coordinates (Outside)
box2 = (400, 100, 600, 600)  # Second box coordinates (Inside)

# --- Init ---
np.random.seed(42)
COLORS = np.random.randint(0, 255, size=(100, 3), dtype=np.uint8).tolist()
model = YOLO("yolov8n.pt")

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

if torch.backends.mkldnn.is_available():
    torch.backends.mkldnn.enabled = True

print("Loading camera...")
print("Press 'q' to exit")

# --- State ---
fps = frame_count = 0
start_time = time.time()
detect_counter = 0

person_class_id = 0
saved_ids = set()
db_id_trakking = {}  # Store user states {track_id: {"state": "enter" or "out"}}

last_boxes, last_track_ids, last_confidences = [], [], []
detection_valid = False

# Initialize FastAPI app and Socket.IO server
app = FastAPI()

# Setup CORS middleware
setup_cors(app)

# Create and integrate Socket.IO app
socket_app = create_socket_app(app)

# Mount the Socket.IO app to the FastAPI app at the "/ws" path
app.mount("/ws", socket_app)

# Flag to check if frame streaming is enabled
frame_streaming_enabled = False

@sio.event
async def connect(sid, environ):
    print(f"[INFO] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[INFO] Client disconnected: {sid}")

@sio.on('start_frame_stream')
async def start_frame_stream(sid, message):
    global frame_streaming_enabled
    if message == "1":
        print("[INFO] Starting frame streaming...")
        frame_streaming_enabled = True
    else:
        print("[INFO] Stopping frame streaming...")
        frame_streaming_enabled = False

def send_to_database(track_id, state):
    """
    Simulates sending data to a database asynchronously.
    Replace this with actual database logic.
    """
    async def async_send():
        print(f"[INFO] Sending to database: User ID {track_id}, State: {state}")
        await asyncio.sleep(2)  # Simulate network delay
        print(f"[INFO] Data sent successfully for User ID {track_id}")
    asyncio.run(async_send())

def trakking(display_frame):
    if detection_valid:
        for box, track_id, conf in zip(last_boxes, last_track_ids, last_confidences):
            x1, y1, x2, y2 = box  # Person's bounding box coordinates

            # Check overlap with box1 and box2 based on horizontal position only
            def is_overlapping(boxA, boxB):
                """
                Check if two boxes overlap horizontally.
                boxA and boxB are tuples (x1, y1, x2, y2).
                """
                return not (boxA[2] <= boxB[0] or boxA[0] >= boxB[2])

            in_box1 = is_overlapping((x1, y1, x2, y2), box1)
            in_box2 = is_overlapping((x1, y1, x2, y2), box2)

            # Determine the current state
            if in_box1:
                current_state = "out"
            elif in_box2:
                current_state = "enter"
            else:
                current_state = None

            # Ensure track_id exists in db_id_trakking
            if track_id not in db_id_trakking:
                db_id_trakking[track_id] = {"state": None}

            # Get the previous state of the user
            previous_state = db_id_trakking[track_id]["state"]

            # Check for state transitions
            if previous_state != current_state:
                if previous_state == "out" and current_state == "enter":
                    print(f"[INFO] User with ID {track_id} entered Box 2 (Inside).")
                    print(f"[INFO] Status: {current_state}, ID: {track_id}")  # Print status and ID
                    send_to_database(track_id, "enter")  # Send to database
                elif previous_state == "enter" and current_state == "out":
                    print(f"[INFO] User with ID {track_id} exited to Box 1 (Outside).")
                    print(f"[INFO] Status: {current_state}, ID: {track_id}")  # Print status and ID
                    send_to_database(track_id, "out")  # Send to database

            # Update the user's state
            db_id_trakking[track_id]["state"] = current_state

            # Display ID above the person
            color = COLORS[track_id % len(COLORS)]
            cv2.putText(
                display_frame,
                f"ID: {track_id}",
                (x1, y1 - 10),  # Position above the person
                cv2.FONT_HERSHEY_SIMPLEX,
                1.2,  # Larger font size
                color,  # Use the same color as the track
                2,  # Thicker font
            )

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("[ERROR] Camera error! Unable to capture frame.")
        break

    display_frame = frame.copy()
    detect_counter += 1

    # Run detection every N frames
    if detect_counter >= DETECT_EVERY_N_FRAMES:
        detect_counter = 0
        results = model.track(
            frame,
            persist=True,
            device="cpu",  # Use GPU if available ("cuda")
            classes=[person_class_id],
            tracker="bytetrack.yaml",
            imgsz=320,  # Smaller image size for better performance
            conf=0.35,
            iou=0.45,
            max_det=MAX_DETECTIONS,
        )

        if results[0].boxes.id is not None:
            last_boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
            last_track_ids = results[0].boxes.id.cpu().numpy().astype(int)
            last_confidences = results[0].boxes.conf.cpu().numpy()
            detection_valid = True

    trakking(display_frame)

    # FPS calculation
    frame_count += 1
    if frame_count >= 30:
        fps = frame_count / (time.time() - start_time)
        frame_count, start_time = 0, time.time()

    # Display FPS
    cv2.putText(
        display_frame,
        f"FPS: {fps:.1f}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2,
    )

    # Draw fixed boxes
    cv2.rectangle(display_frame, (box1[0], box1[1]), (box1[2], box1[3]), (255, 0, 0), 2)  # Box 1 (Blue, Outside)
    cv2.rectangle(display_frame, (box2[0], box2[1]), (box2[2], box2[3]), (0, 0, 255), 2)  # Box 2 (Red, Inside)

    # Send frames to frontend using Socket.IO
    if frame_streaming_enabled:
        _, buffer = cv2.imencode('.jpg', display_frame)
        frame_bytes = buffer.tobytes()
        asyncio.run(sio.emit('frame_update', {'frame': frame_bytes}))

    cv2.imshow("Person Tracking with ID Images", display_frame)

    key = cv2.waitKey(1)
    if key == ord("q"):
        print("[INFO] Exiting program...")
        break

cap.release()
cv2.destroyAllWindows()

# Run FastAPI app
if __name__ == '__main__':
    import uvicorn
    print("Starting FastAPI server on port 8000...")
    uvicorn.run(app, host='0.0.0.0', port=8000)



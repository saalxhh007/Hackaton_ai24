import asyncio
import os
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import torch
from ultralytics import YOLO

# --- Configuration ---
SAVE_DIR = "tracked_persons"
os.makedirs(SAVE_DIR, exist_ok=True)

FRAME_WIDTH, FRAME_HEIGHT = 640, 480
DISPLAY_WIDTH, DISPLAY_HEIGHT, DISPLAY_MARGIN = 100, 120, 10
PANEL_HEIGHT = 150
DETECT_EVERY_N_FRAMES = 2
MAX_TRACK_HISTORY = 15
MAX_DETECTIONS = 10
MIN_BOX_SIZE = (60, 100)
MIN_CONFIDENCE_FOR_SAVE = 0.5
THUMB_HEIGHT = 120
GRID_CELL_WIDTH, GRID_CELL_HEIGHT = 150, 180
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
print("Press 'q' to exit, 'c' to clear tracking paths, 's' to show saved person images")

# --- State ---
fps = frame_count = 0
start_time = time.time()
detect_counter = 0

person_class_id = 0
saved_ids = set()
person_images = {}
display_positions = {}
tracks_history = defaultdict(list)
db_id_trakking = {}

# Dictionary to track the previous state of each user
user_state = {}  # Example: {track_id: "خارج", ...}

last_boxes, last_track_ids, last_confidences = [], [], []
detection_valid = False

# --- Functions send database---
def send_to_database(track_id, state):
    """
    Simulates sending data to a database.
    Replace this with actual database logic.
    """
    try:
      
        print(f"[INFO] Sending to database: User ID {track_id}, State: {state}")
        # Simulate network delay
        time.sleep(2)
        print(f"[INFO] Data sent successfully for User ID {track_id}")
    except Exception as e:
        print(f"[ERROR] Error sending data for User ID {track_id}: {e}")

# Create a thread pool executor
executor = ThreadPoolExecutor(max_workers=5)

def trakking():
    global user_state  # Access the global state dictionary

    if detection_valid:
        for box, track_id, conf in zip(last_boxes, last_track_ids, last_confidences):
            x1, y1, x2, y2 = box
            color = COLORS[track_id % len(COLORS)]
            center = ((x1 + x2) // 2, (y1 + y2) // 2)

            # Store tracking history
            tracks_history[track_id].append(center)
            if len(tracks_history[track_id]) > MAX_TRACK_HISTORY:
                tracks_history[track_id] = tracks_history[track_id][-MAX_TRACK_HISTORY:]

            # Draw tracking path
            if len(tracks_history[track_id]) > 3:
                pts = np.array(tracks_history[track_id], np.int32).reshape((-1, 1, 2))
                cv2.polylines(display_frame, [pts], False, color, 2)

            # Draw bounding box around the person
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)

            # Display the ID above the bounding box
            cv2.putText(
                display_frame,
                f"ID: {track_id}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
            )

            # Check if the person is inside a box based on horizontal position only
            in_box1 = box1[0] <= center[0] <= box1[2]
            in_box2 = box2[0] <= center[0] <= box2[2]

            # Determine the current state
            if in_box1:
                current_state = "out"
            elif in_box2:
                current_state = "enter"
            else:
                current_state = None

            # Get the previous state of the user
            previous_state = user_state.get(track_id, None)
            print("mossab",previous_state != current_state,previous_state,current_state)
            # Check for state transitions
            if previous_state != current_state:
                if previous_state == "out" and current_state == "enter":
                    print(f"[INFO] User with ID {track_id} entered Box 2 (Inside).")
                    # Submit the database task to the thread pool
                    executor.submit(send_to_database, track_id, "enter")
                elif previous_state == "enter" and current_state == "out":
                    print(f"[INFO] User with ID {track_id} exited to Box 1 (Outside).")
                    # Submit the database task to the thread pool
                    executor.submit(send_to_database, track_id, "out")

            # Update the user's state
            if current_state:
                user_state[track_id] = current_state

            # Draw fixed boxes
            cv2.rectangle(display_frame, (box1[0], box1[1]), (box1[2], box1[3]), (255, 0, 0), 2)  # Box 1 (Blue, Outside)
            cv2.rectangle(display_frame, (box2[0], box2[1]), (box2[2], box2[3]), (0, 0, 255), 2)  # Box 2 (Red, Inside)

        # Print all users and their states
        print("[INFO] Current User States:")
        for track_id, state in user_state.items():

                print(f"User ID: {track_id}, State: {state}")

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
            device="cpu",
            classes=[person_class_id],
            tracker="bytetrack.yaml",
            imgsz=320,
            conf=0.35,
            iou=0.45,
            max_det=MAX_DETECTIONS,
        )

        if results[0].boxes.id is not None:
            last_boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
            last_track_ids = results[0].boxes.id.cpu().numpy().astype(int)
            last_confidences = results[0].boxes.conf.cpu().numpy()
            detection_valid = True

    trakking()

    # FPS calculation
    frame_count += 1
    if frame_count >= 30:
        fps = frame_count / (time.time() - start_time)
        frame_count, start_time = 0, time.time()

    cv2.putText(
        display_frame,
        f"FPS: {fps:.1f}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2,
    )

    cv2.imshow("Person Tracking with ID Images", display_frame)

    key = cv2.waitKey(1)
    if key == ord("q"):
        print("[INFO] Exiting program...")
        break
    elif key == ord("e"):
        print("[INFO] Force exiting program...")
        break

# Shutdown the thread pool executor
executor.shutdown(wait=True)

cap.release()
cv2.destroyAllWindows()
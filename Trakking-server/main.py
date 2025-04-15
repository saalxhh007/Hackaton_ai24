import asyncio
import os
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import torch
from ID import *
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

last_boxes, last_track_ids, last_confidences = [], [], []
detection_valid = False


# --- Main loop ---


async def get_id_from_db(frame, track_id):
    id = req_id(frame)
    if id != None:
        db_id_trakking[track_id] = id
    print(type(frame))


def trakking():
    if detection_valid:
        for box, track_id, conf in zip(last_boxes, last_track_ids, last_confidences):
            x1, y1, x2, y2 = box
            color = COLORS[track_id % len(COLORS)]
            center = ((x1 + x2) // 2, (y1 + y2) // 2)
            tracks_history[track_id].append(center)
            if len(tracks_history[track_id]) > MAX_TRACK_HISTORY:
                tracks_history[track_id] = tracks_history[track_id][-MAX_TRACK_HISTORY:]

            if len(tracks_history[track_id]) > 3:
                pts = np.array(tracks_history[track_id], np.int32).reshape((-1, 1, 2))
                cv2.polylines(display_frame, [pts], False, color, 2)

            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
            status = "📷" if track_id in saved_ids else ""
            cv2.putText(
                display_frame,
                f"ID:{track_id} {status}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
            )


while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Camera error!")
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

            for box, track_id, conf in zip(
                last_boxes, last_track_ids, last_confidences
            ):
                x1, y1, x2, y2 = box
                box_w, box_h = x2 - x1, y2 - y1

                if (
                    track_id not in saved_ids
                    and box_w > MIN_BOX_SIZE[0]
                    and box_h > MIN_BOX_SIZE[1]
                    and conf > MIN_CONFIDENCE_FOR_SAVE
                ):
                    person_img = frame[
                        max(0, y1) : min(frame.shape[0], y2),
                        max(0, x1) : min(frame.shape[1], x2),
                    ]
                    if person_img.size > 0:
                        person_images[track_id] = person_img.copy()

                        display_positions[track_id] = len(display_positions) * (
                            DISPLAY_WIDTH + DISPLAY_MARGIN
                        )

    trakking()

    print(db_id_trakking)
    for box, track_id, conf in zip(last_boxes, last_track_ids, last_confidences):
        if track_id not in db_id_trakking:
            print(box)
            x1, y1, x2, y2 = box
            print(tracks_history[track_id][-1])
            person_img = frame[
                max(0, y1) : min(frame.shape[0], y2),
                max(0, x1) : min(frame.shape[1], x2),
            ]
            print(person_img)
            asyncio.run(get_id_from_db(person_img, track_id))
        pass
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

cap.release()
cv2.destroyAllWindows()

import os
import time
import cv2
import numpy as np
import torch
from threading import Thread
from ultralytics import YOLO

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
db_id_trakking = {}  # Store user states {track_id: {"state": "enter" or "out", "captured": False, "name": None}}
tracked_persons_list = []  # List to store tracked persons with their names and IDs

last_boxes, last_track_ids, last_confidences = [], [], []
detection_valid = False

import requests

# def send_to_database(track_id, image_path):
#     """
#     Sends an image to a database using an HTTP POST request and receives a response.
#     Returns a dictionary with the response from the database.
#     """
#     print(f"[INFO] Sending image of User ID {track_id} to database: {image_path}")

#     try:
#         with open(image_path, "rb") as image_file:
#             image_data = image_file.read()

#         url = "https://example.com/api/upload"  # Replace with your actual API endpoint
#         files = {"image": (os.path.basename(image_path), image_data, "image/jpeg")}
#         data = {"track_id": track_id}

#         response = requests.post(url, files=files, data=data)

#         if response.status_code == 200:
#             response_data = response.json()
#             print(f"[INFO] Database response for User ID {track_id}: {response_data}")
#             return response_data
#         else:
#             print(f"[ERROR] Failed to send image for User ID {track_id}. Status Code: {response.status_code}")
#             return {"status": "error", "message": f"HTTP Error {response.status_code}"}

#     except FileNotFoundError:
#         print(f"[ERROR] Image file not found for User ID {track_id}: {image_path}")
#         return {"status": "error", "message": "File not found"}
#     except requests.exceptions.RequestException as e:
#         print(f"[ERROR] Network error while sending image for User ID {track_id}: {e}")
#         return {"status": "error", "message": "Network error"}
#     except Exception as e:
#         print(f"[ERROR] Unexpected error while sending image for User ID {track_id}: {e}")
#         return {"status": "error", "message": "Unexpected error"}
def send_to_database(track_id, image_path):
    """
    Simulates sending an image to a database and receiving a response.
    Returns a dictionary with the response from the database.
    """
    print(f"[INFO] Sending image of User ID {track_id} to database: {image_path}")
    time.sleep(2)  # Simulate network delay

    # Simulate database response
    if track_id % 2 == 0:  # Example condition for retry
        print(f"[INFO] Database response for User ID {track_id}: Retry needed.")
        return {"status": "retry"}
    else:
        name = f"Person_{track_id}"  # Simulated name from database
        print(f"[INFO] Database response for User ID {track_id}: Success, Name: {name}.")
        return {"status": "success", "name": name}



def capture_image(track_id, display_frame, box):
    """
    Captures an image of the person and saves it to disk.
    """
    x1, y1, x2, y2 = box

    # Check if coordinates are valid
    if x1 < 0 or y1 < 0 or x2 > FRAME_WIDTH or y2 > FRAME_HEIGHT:
        print(f"[WARNING] Invalid coordinates for User ID {track_id}. Skipping capture.")
        return None

    person_image = display_frame[y1:y2, x1:x2]
    image_path = os.path.join(SAVE_DIR, f"person_{track_id}.jpg")
    cv2.imwrite(image_path, person_image)
    print(f"[INFO] Captured image of User ID {track_id}: {image_path}")
    return image_path

def trakking(display_frame):
    if detection_valid:
        if not last_boxes or not last_track_ids or not last_confidences:
            print("[WARNING] No detections available. Skipping tracking.")
            return

        for box, track_id, conf in zip(last_boxes, last_track_ids, last_confidences):
            x1, y1, x2, y2 = box

            def is_overlapping(boxA, boxB):
                return not (boxA[2] <= boxB[0] or boxA[0] >= boxB[2])

            in_box1 = is_overlapping((x1, y1, x2, y2), box1)
            in_box2 = is_overlapping((x1, y1, x2, y2), box2)

            current_state = "out" if in_box1 else ("enter" if in_box2 else None)

            if track_id not in db_id_trakking:
                db_id_trakking[track_id] = {"state": None, "captured": False, "name": None}

            previous_state = db_id_trakking[track_id]["state"]

            if previous_state != current_state:
                if previous_state == "out" and current_state == "enter":
                    print(f"[INFO] User with ID {track_id} entered Box 2 (Inside).")
                elif previous_state == "enter" and current_state == "out":
                    print(f"[INFO] User with ID {track_id} exited to Box 1 (Outside).")

            db_id_trakking[track_id]["state"] = current_state

            if not db_id_trakking[track_id]["captured"]:
                image_path = capture_image(track_id, display_frame, box)

                if image_path:
                    def process_image():
                        response = send_to_database(track_id, image_path)
                        if response["status"] == "success":
                            db_id_trakking[track_id]["captured"] = True
                            db_id_trakking[track_id]["name"] = response["name"]
                            tracked_persons_list.append({"id": track_id, "name": response["name"]})
                            print(f"[INFO] Added User ID {track_id} with Name: {response['name']} to tracked list.")
                        elif response["status"] == "retry":
                            print(f"[INFO] Retry needed for User ID {track_id}.")

                    thread = Thread(target=process_image)
                    thread.start()

            color = COLORS[track_id % len(COLORS)]
            text = f"{db_id_trakking[track_id]['name']}" if db_id_trakking[track_id]["name"] else f"ID: {track_id}"
            cv2.putText(
                display_frame,
                text,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.2,
                color,
                2,
            )

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("[ERROR] Camera error! Unable to capture frame.")
        break

    if not cap.isOpened():
        print("[ERROR] Camera is not available. Exiting program...")
        break

    display_frame = frame.copy()
    detect_counter += 1

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
            last_boxes[:] = results[0].boxes.xyxy.cpu().numpy().astype(int)
            last_track_ids[:] = results[0].boxes.id.cpu().numpy().astype(int)
            last_confidences[:] = results[0].boxes.conf.cpu().numpy()
            detection_valid = True

    thread = Thread(target=trakking, args=(display_frame,))
    thread.start()

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

    cv2.rectangle(display_frame, (box1[0], box1[1]), (box1[2], box1[3]), (255, 0, 0), 2)
    cv2.rectangle(display_frame, (box2[0], box2[1]), (box2[2], box2[3]), (0, 0, 255), 2)

    cv2.imshow("Person Tracking with ID Images", display_frame)

    key = cv2.waitKey(1)
    if key == ord("q"):
        print("[INFO] Exiting program...")
        break

cap.release()
cv2.destroyAllWindows()
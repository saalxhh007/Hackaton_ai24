import os
import time
import cv2
import numpy as np
import torch
from threading import Thread, Lock
from queue import Queue, Empty
from ultralytics import YOLO
import requests

# --- Configuration ---
SAVE_DIR = "tracked_persons"
os.makedirs(SAVE_DIR, exist_ok=True)

FRAME_WIDTH, FRAME_HEIGHT = 640, 480
DETECT_EVERY_N_FRAMES = 8  # Increased from 5 to reduce CPU load
MAX_DETECTIONS = 10
MIN_CONFIDENCE_FOR_SAVE = 0.5

# Define box coordinates (Outside and Inside)
box1 = (100, 100, 300, 500)  # First box coordinates (Outside)
box2 = (400, 100, 600, 600)  # Second box coordinates (Inside)

# --- Init ---
np.random.seed(42)
COLORS = np.random.randint(0, 255, size=(100, 3), dtype=np.uint8).tolist()

# Initialize YOLO with performance optimizations
model = YOLO("yolov8n.pt")
model.fuse()  # Fuse model layers for optimized inference

# Enable available hardware acceleration
if torch.cuda.is_available():
    device = "cpu"
    torch.backends.cudnn.benchmark = True  # Enable cudnn autotuner
elif torch.backends.mps.is_available():  # For Apple Silicon
    device = "mps"
elif torch.backends.mkldnn.is_available():
    device = "cpu"
    torch.backends.mkldnn.enabled = True
else:
    device = "cuda"

print(f"Using device: {device}")

# Initialize camera with buffer optimization
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer to reduce latency

print("Loading camera...")
print("Press 'q' to exit")

# --- State ---
fps = 0
start_time = time.time()
detect_counter = 0
person_class_id = 0
frame_time = 0  # Track frame processing time

# Enhanced tracking state management with pre-allocated memory
db_id_tracking = {}  # Store user states {track_id: {"state": "enter" or "out", "identified": False, "name": None, "processing": False}}
tracked_persons_list = []  # List to store tracked persons with their names and IDs

# Queue for processing photos with size limit
photo_queue = Queue(maxsize=20)  # Limit queue size to prevent memory issues
queue_lock = Lock()
processing_lock = Lock()
is_processing = False

# Pre-allocate arrays for detection results
last_boxes = np.array([], dtype=np.int32).reshape(0, 4)
last_track_ids = np.array([], dtype=np.int32)
last_confidences = np.array([], dtype=np.float32)
detection_valid = False

# Cache for processed images to avoid redundant disk operations
image_cache = {}
MAX_CACHE_SIZE = 50

def send_to_database(image_path, track_id):
    """
    Sends an image to a database using an HTTP POST request with multipart/form-data.
    Returns a dictionary with the response from the database.
    """
    try:
        # Use cache if available to avoid re-reading the same image file
        if track_id in image_cache:
            image_data = image_cache[track_id]
        else:
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                # Store in cache, maintain cache size
                if len(image_cache) >= MAX_CACHE_SIZE:
                    # Remove oldest item (first key)
                    image_cache.pop(next(iter(image_cache)))
                image_cache[track_id] = image_data

        url = "http://127.0.0.1:8000/api/get-embedding-from-image/"
        
        # Create a multipart/form-data request
        files = {"image": (os.path.basename(image_path), image_data, "image/jpeg")}
        
        # Set timeout to prevent hanging
        response = requests.post(url, files=files)

        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "error", "message": f"HTTP Error {response.status_code}"}

    except FileNotFoundError:
        return {"status": "error", "message": "File not found"}
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"Network error: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}

def capture_image(track_id, display_frame, box):
    """
    Captures an image of the person and saves it to disk.
    Returns the image path.
    """
    x1, y1, x2, y2 = box

    # Boundary checking
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(FRAME_WIDTH, x2)
    y2 = min(FRAME_HEIGHT, y2)
    
    # Skip if box is too small
    if (x2 - x1) < 20 or (y2 - y1) < 20:
        return None

    # Fast slicing with numpy
    person_image = display_frame[y1:y2, x1:x2].copy()
    image_path = os.path.join(SAVE_DIR, f"person_{track_id}.jpg")
    
    # Use IMWRITE_JPEG_QUALITY for better compression/speed balance
    cv2.imwrite(image_path, person_image, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return image_path

def process_photo_queue():
    """
    Process the photo queue continuously.
    After 3 failed attempts, mark the person as "Unknown Person".
    """
    global is_processing
    
    with processing_lock:
        is_processing = True
    
    while True:
        try:
            # Block until an item is available (with timeout)
            try:
                track_id, image_path = photo_queue.get(timeout=3)
            except Empty:
                # If no new items after timeout, exit the thread
                with processing_lock:
                    is_processing = False
                return
                
            # Skip if person is already being processed or identified
            skip_processing = False
            with processing_lock:
                if track_id in db_id_tracking:
                    if db_id_tracking[track_id]["identified"] or db_id_tracking[track_id]["processing"]:
                        skip_processing = True
                    else:
                        db_id_tracking[track_id]["processing"] = True
            
            if not skip_processing:
                # Process the image
                response = send_to_database(image_path, track_id)
                
                with processing_lock:
                    if track_id in db_id_tracking:
                        db_id_tracking[track_id]["processing"] = False
                        
                        if "payload" in response and "name" in response["payload"] and response["score"] > 0.2:
                            # Person identified successfully
                            name = response["payload"]["name"]
                            db_id_tracking[track_id]["identified"] = True
                            db_id_tracking[track_id]["name"] = name
                            db_id_tracking[track_id]["recognition_attempts"] = 0  # Reset attempts on success
                            
                            # Add to tracked persons list if not already there
                            person_entry = {"id": track_id, "name": name}
                            if person_entry not in tracked_persons_list:
                                tracked_persons_list.append(person_entry)
                        else:
                            # Increment attempts counter
                            db_id_tracking[track_id]["recognition_attempts"] += 1
                            attempts = db_id_tracking[track_id]["recognition_attempts"]
                            
                            # If 3 attempts have been made, mark as "Unknown Person"
                            if attempts >= 3:
                                db_id_tracking[track_id]["identified"] = True
                                db_id_tracking[track_id]["name"] = "Unknown Person"
                                
                                # Add to tracked persons list
                                person_entry = {"id": track_id, "name": "Unknown Person"}
                                if person_entry not in tracked_persons_list:
                                    tracked_persons_list.append(person_entry)
            
            # Mark this task as done
            photo_queue.task_done()
                
        except Exception as e:
            # Error handling
            if 'track_id' in locals():
                with processing_lock:
                    if track_id in db_id_tracking:
                        db_id_tracking[track_id]["processing"] = False
                photo_queue.task_done()
                
def is_in_box(box_coords, target_box):
    """Check if the center of the box is within the target box"""
    center_x = (box_coords[0] + box_coords[2]) / 2
    center_y = (box_coords[1] + box_coords[3]) / 2
    return (target_box[0] <= center_x <= target_box[2] and 
            target_box[1] <= center_y <= target_box[3])

def tracking(display_frame):
    """Handle tracking of detected persons"""
    if not detection_valid or len(last_boxes) == 0:
        return

    # Process all detections in one loop for efficiency
    for box, track_id, conf in zip(last_boxes, last_track_ids, last_confidences):
        x1, y1, x2, y2 = box

        in_box1 = is_in_box((x1, y1, x2, y2), box1)
        in_box2 = is_in_box((x1, y1, x2, y2), box2)

        current_state = "out" if in_box1 else ("enter" if in_box2 else None)

        # Initialize tracking entry if not exists - use dict.setdefault for efficiency
        if track_id not in db_id_tracking:
            db_id_tracking[track_id] = {
                "state": None, 
                "identified": False, 
                "name": None, 
                "processing": False,
                "last_photo_time": 0,
                "recognition_attempts": 0
            }

        previous_state = db_id_tracking[track_id]["state"]

        # Only update state if it changed to avoid unnecessary processing
        if previous_state != current_state:
            db_id_tracking[track_id]["state"] = current_state

        # Logic for taking photos - only if needed
        if (not db_id_tracking[track_id]["identified"] and 
            not db_id_tracking[track_id]["processing"]):
            
            current_time = time.time()
            if current_time - db_id_tracking[track_id]["last_photo_time"] > 3:
                # Take a photo
                image_path = capture_image(track_id, display_frame, box)
                if image_path:
                    db_id_tracking[track_id]["last_photo_time"] = current_time
                    
                    # Add to queue for processing if not full
                    if not photo_queue.full():
                        photo_queue.put((track_id, image_path))
                    
                    global is_processing
                    with processing_lock:
                        if not is_processing:
                            thread = Thread(target=process_photo_queue)
                            thread.daemon = True
                            thread.start()

        # Display name or ID on screen - optimize text drawing
        color = COLORS[int(track_id) % len(COLORS)]
        text = f"Name: {db_id_tracking[track_id]['name']}" if db_id_tracking[track_id]["name"] else f"ID: {track_id}"
        
        # Add indicator if currently processing
        if db_id_tracking[track_id]["processing"]:
            text += " (proc...)"
            
        cv2.putText(
            display_frame,
            text,
            (x1, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,  # Smaller font
            color,
            1,    # Thinner line
        )

# Main loop with performance optimizations
frame_count = 0
frame_skip = 0  # Skip frames when system is under load

# Function to draw UI elements - separate from main processing
def draw_ui(display_frame, fps, frame_time):
    # Draw boxes - these are static and could be pre-computed for even more efficiency
    cv2.rectangle(display_frame, (box1[0], box1[1]), (box1[2], box1[3]), (255, 0, 0), 2)
    cv2.putText(display_frame, "Outside", (box1[0], box1[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    
    cv2.rectangle(display_frame, (box2[0], box2[1]), (box2[2], box2[3]), (0, 0, 255), 2)
    cv2.putText(display_frame, "Inside", (box2[0], box2[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # Display stats
    identified_count = sum(1 for entry in db_id_tracking.values() if entry["identified"])
    pending_count = sum(1 for entry in db_id_tracking.values() if not entry["identified"])
    
    cv2.putText(
        display_frame,
        f"FPS: {fps:.1f} | Time: {frame_time*1000:.1f}ms | ID: {identified_count} | Pending: {pending_count}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 255, 0),
        1,
    )

# Use adaptive frame skipping based on system load
try:
    while cap.isOpened():
        loop_start = time.time()
        
        # Skip frames if processing is taking too long
        if frame_skip > 0:
            frame_skip -= 1
            cap.grab()  # Just grab frame without decoding
            continue
            
        success, frame = cap.read()
        if not success:
            if not cap.isOpened():
                print("[ERROR] Camera is not available. Exiting program...")
                break
            print("[ERROR] Camera error! Unable to capture frame.")
            continue

        # Create a shallow copy for display
        display_frame = frame.copy()
        detect_counter += 1

        # Run detection periodically
        if detect_counter >= DETECT_EVERY_N_FRAMES:
            detect_counter = 0
            
            # Run model with optimized settings
            results = model.track(
                frame,
                persist=True,
                device=device,
                classes=[person_class_id],
                tracker="bytetrack.yaml",
                imgsz=320,
                conf=0.35,
                iou=0.45,
                max_det=MAX_DETECTIONS,
                verbose=False  # Disable verbose output
            )

            if results[0].boxes.id is not None:
                # Update tracking data
                last_boxes = results[0].boxes.xyxy.cpu().numpy().astype(np.int32)
                last_track_ids = results[0].boxes.id.cpu().numpy().astype(np.int32)
                last_confidences = results[0].boxes.conf.cpu().numpy()
                detection_valid = True

        # Run tracking
        tracking(display_frame)

        # Calculate FPS
        frame_count += 1
        current_time = time.time()
        elapsed = current_time - start_time
        
        if elapsed >= 1.0:  # Update FPS once per second
            fps = frame_count / elapsed
            frame_count, start_time = 0, current_time

        # Draw UI
        draw_ui(display_frame, fps, frame_time)
        
        # Show display frame
        cv2.imshow("Person Tracking with Smart Photo Management", display_frame)

        # Handle user input with non-blocking wait
        key = cv2.waitKey(1)
        if key == ord("q"):
            print("[INFO] Exiting program...")
            break
            
        # Calculate frame processing time
        frame_time = time.time() - loop_start
        
        # Adaptive frame skipping - skip frames if processing is taking too long
        if frame_time > 0.05:  # If processing takes longer than 50ms
            frame_skip = int(frame_time / 0.033)  # Skip enough frames to catch up

except KeyboardInterrupt:
    print("[INFO] Interrupted by user")
finally:
    # Clean up resources
    cap.release()
    cv2.destroyAllWindows()
    # Wait for threads to finish if any are running
    if is_processing:
        photo_queue.join(timeout=1.0)
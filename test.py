import cv2
import time

# Open default camera
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

frame_count = 0
start_time = time.time()
print("Webcam started")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Failed to grab frame.")
        break

    # Resize for consistency (optional)
    frame = cv2.resize(frame, (1080//5, 1080//5))

    # Show the frame
    cv2.imshow("Webcam Feed", frame)

    # Frame count & FPS
    frame_count += 1
    elapsed = time.time() - start_time
    if elapsed >= 1.0:
        fps = frame_count / elapsed
        print(f"FPS: {fps:.2f}")
        frame_count = 0
        start_time = time.time()

    # Quit on 'q' key
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()

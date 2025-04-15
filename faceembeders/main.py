from io import BytesIO

import insightface
import numpy as np
from fastapi import FastAPI, HTTPException
from insightface.app import cv2
from PIL import Image
from pydantic import BaseModel

# Initialize FastAPI
app = FastAPI()

# Load the InsightFace model once at startup
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)  # Use 0 for GPU, -1 for CPU


# Define a Pydantic model for incoming data
class FaceData(BaseModel):
    data: list[list[int]]  # List of pixel values (RGB format)


# Helper function to convert pixel data to NumPy array
def pixels_to_numpy(data: list, height: int, width: int) -> np.ndarray:
    img_array = np.array(data, dtype=np.uint8).reshape((height, width, 3))
    return img_array


@app.post("/embed-face")
async def embed_face(data: FaceData):
    # Convert the pixel data into a numpy array representing the image
    frame = np.array(data.data)
    frame = cv2.resize(frame, (640, 640))
    print(frame.shape)
    # Get face embeddings
    faces = model.get(frame)
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected")

    # Extract the embedding (assume one face per image)
    embedding = faces[0].embedding
    return {"embedding": embedding.tolist()}

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import insightface
import numpy as np
from io import BytesIO
from PIL import Image

# Initialize FastAPI
app = FastAPI()

# Load the InsightFace model once at startup
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)  # Use 0 for GPU, -1 for CPU

# Define a Pydantic model for incoming data
class FaceData(BaseModel):
    data: list[list[int]]  # List of pixel values (RGB format)
    height: int
    width: int

# Helper function to convert pixel data to NumPy array
def pixels_to_numpy(data: list, height: int, width: int) -> np.ndarray:
    img_array = np.array(data, dtype=np.uint8).reshape((height, width, 3))
    return img_array

@app.post("/embed-face")
async def embed_face(data: FaceData):
    # Convert the pixel data into a numpy array representing the image
    img_array = pixels_to_numpy(data.data, data.height, data.width)

    # Get face embeddings
    faces = model.get(img_array)
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected")

    # Extract the embedding (assume one face per image)
    embedding = faces[0].embedding
    return {"embedding": embedding.tolist()}

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import insightface
import numpy as np
from pydantic import BaseModel
import json

# Initialize FastAPI
app = FastAPI()

# Load the InsightFace model once at startup
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)  # Use 0 for GPU, -1 for CPU

# Pydantic model for receiving the NumPy array as a list
class ImageArray(BaseModel):
    img_array: list  # This will accept the NumPy array as a list

# Function to get embeddings from the image array
def get_image_embedding(img_array, model):
    faces = model.get(img_array)
    if len(faces) == 0:
        return None  # No face detected

    # Extract the embedding (assume one face per image)
    embedding = faces[0].embedding
    return embedding.tolist()  # Convert numpy array to list for JSON response

# Endpoint to process the NumPy array and return the embedding
@app.post("/embed-face")
async def embed_face(data: ImageArray):
    try:
        # Convert the list to a NumPy array
        img_array = np.array(data.img_array)

        # Get embedding from the image array
        embedding = get_image_embedding(img_array, model)
        
        if embedding is None:
            raise HTTPException(status_code=404, detail="No face detected in the image")

        return JSONResponse(content={"embedding": embedding})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""
example request
{
  "img_array": [
    [255, 255, 255, ...],  # Row 1
    [0, 0, 0, ...],        # Row 2
    ...
  ]
}
"""


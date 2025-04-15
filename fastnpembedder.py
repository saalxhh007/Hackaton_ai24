from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import insightface
import numpy as np
import cv2
from typing import List

app = FastAPI()

# Load the InsightFace model once at startup
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)  # Use 0 for GPU, -1 for CPU

class ImgArray(BaseModel):
    array: List[List[List[int]]]  # 3D array for RGB image

@app.post("/embed/")
async def embed(data: ImgArray):
    img = np.array(data.array, dtype=np.uint8)
    resized = cv2.resize(img, (640, 640), interpolation=cv2.INTER_LINEAR)

    # Run face detection and extract embedding
    faces = model.get(resized)
    if not faces:
        raise HTTPException(status_code=400, detail="No face detected in the image")

    embedding = faces[0].embedding
    return {"embedding": embedding.tolist()}

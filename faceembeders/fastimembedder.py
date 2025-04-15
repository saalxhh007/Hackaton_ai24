from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import insightface
import numpy as np
from PIL import Image
import io

app = FastAPI()

# Load the InsightFace model once at startup
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)  # Use 0 for GPU, -1 for CPU

def get_image_embedding(file) -> list | None:
    image = Image.open(file).convert('RGB')
    img_array = np.array(image)
    faces = model.get(img_array)
    if len(faces) == 0:
        return None
    embedding = faces[0].embedding
    return embedding.tolist()
@app.post("/embed-face")
async def embed_face(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_bytes = io.BytesIO(contents)

        embedding = get_image_embedding(file_bytes)
        if embedding is None:
            raise HTTPException(status_code=404, detail="No face detected in the image")

        return JSONResponse(content={"embedding": embedding})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

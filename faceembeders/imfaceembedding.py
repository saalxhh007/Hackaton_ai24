import io

import cv2
import insightface
import numpy as np
from PIL import Image

# Load the InsightFace model once at module level (optional but more efficient)
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)  # ctx_id=0 to use GPU, -1 for CPU


# Function to get embeddings from an uploaded image (in-memory)
def get_image_embedding(file, model):
    image = Image.open(file).convert("RGB")
    img_array = np.array(image)

    # Get face embeddings
    faces = model.get(img_array)
    if len(faces) == 0:
        return None  # No face detected

    # Extract the embedding (assume one face per image)
    embedding = faces[0].embedding
    return embedding.tolist()  # Convert numpy array to list for JSON response

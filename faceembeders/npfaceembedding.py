import insightface
import cv2
import numpy as np
from PIL import Image
import io

# Load the InsightFace model once at module level (optional but more efficient)
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)  # ctx_id=0 to use GPU, -1 for CPU

def get_np_array(file):
    image = Image.open(file).convert('RGB')
    img_array = np.array(image)
    return img_array

# Function to get embeddings from an uploaded image (in-memory)
def get_image_embedding(img_array, model):


    # Get face embeddings
    faces = model.get(img_array)
    if len(faces) == 0:
        return None  # No face detected

    # Extract the embedding (assume one face per image)
    embedding = faces[0].embedding
    return embedding.tolist()  # Convert numpy array to list for JSON response


print(get_image_embedding(get_np_array("img.jpeg"),model))
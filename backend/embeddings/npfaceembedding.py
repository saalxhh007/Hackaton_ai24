import insightface
import numpy as np
from PIL import Image

# Load the InsightFace model once at module level (optional but more efficient)
model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)


def get_np_array(file):
    image = Image.open(file).convert("RGB")
    img_array = np.array(image)
    # print(img_array.shape)
    return img_array


# Function to get embeddings from an uploaded image (in-memory)
def get_image_embedding(img_array, model):
    # Get face embeddings
    faces = model.get(img_array)
    if len(faces) == 0:
        return None  # No face detected

    # Extract the embedding (assume one face per image)
    embedding = faces[0].embedding
    # print(embedding.shape)
    return embedding.tolist()  # Convert numpy array to list for JSON response


if __name__ == "__main__":
    print(get_image_embedding(get_np_array("img.jpeg"), model))

import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .qdrant_client import collection_name, qdrant
import insightface
import cv2


def get_embeddings(request):
    result = qdrant.scroll(
        collection_name=collection_name, limit=100, with_vectors=True
    )
    points, _ = result
    data = []

    for point in points:
        vector = [float(v) for v in point.vector]
        data.append({"id": point.id, "vector": vector, "payload": point.payload})

    return JsonResponse(data, safe=False)


import json

from django.http import JsonResponse
from django.views.decorators.http import require_GET



@require_GET
def get_embedding(request):
    """
    Handles a GET request to retrieve the closest embedding based on a given query vector.
    Expects a 'vector' query parameter in the format: '0.1,0.2,0.3,...'
    """

    # Step 1: Extract vector string from query params
    vector_param = request.GET.get("vector")
    if not vector_param:
        return JsonResponse({"error": "Missing 'vector' query parameter."}, status=400)

    # Step 2: Convert comma-separated string to a list of floats
    try:
        query_vector = [float(x) for x in vector_param.split(",")]
    except ValueError:
        return JsonResponse({
            "error": "Invalid 'vector' format. Ensure it's a comma-separated list of numbers."
        }, status=400)

    # Step 3: Perform vector search with Qdrant
    try:
        search_result = qdrant.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=1,
            with_vectors=True,
        )
    except Exception as e:
        return JsonResponse({"error": f"Vector search failed: {str(e)}"}, status=500)

    # Step 4: Handle no results
    if not search_result:
        return JsonResponse({"message": "No matching embedding found."}, status=404)

    # Step 5: Format and return response
    point = search_result[0]
    response_data = {
        "id": point.id,
        "score": point.score,
        "vector": point.vector,
        "payload": point.payload,
    }

    return JsonResponse(response_data)

import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from qdrant_client.http.models import PointStruct

from .qdrant_client import collection_name, qdrant


@csrf_exempt
@require_http_methods(["POST"])
def add_embedding(request):
    try:
        body = json.loads(request.body)
        user_id = body.get("user_id")
        name = body.get("name")
        embedding = body.get("embedding")

        if not isinstance(user_id, int):
            return JsonResponse({"error": "Invalid or missing 'user_id'."}, status=400)
        if not isinstance(name, str):
            return JsonResponse({"error": "Invalid or missing 'name'."}, status=400)
        if not isinstance(embedding, list) or not all(
            isinstance(x, (int, float)) for x in embedding
        ):
            return JsonResponse(
                {"error": "Invalid or missing 'embedding'."}, status=400
            )

        point = PointStruct(
            id=user_id, vector=embedding, payload={"name": name, "user_id": user_id}
        )

        qdrant.upsert(collection_name=collection_name, points=[point])

        return JsonResponse(
            {
                "message": "Embedding added successfully",
                "user_id": user_id,
                "name": name,
            }
        )

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

from django.http import JsonResponse
from .qdrant_client import qdrant, collection_name
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.decorators.http import require_POST
import json
from qdrant_client.http.models import PointStruct
import cv2
import numpy as np

model = insightface.app.FaceAnalysis()
model.prepare(ctx_id=0)

def get_embeddings(request):
    result = qdrant.scroll(collection_name=collection_name, limit=100, with_vectors=True)
    points, _ = result
    data = []

    for point in points:
        vector = [float(v) for v in point.vector]
        data.append({
            "id": point.id,
            "vector": vector,
            "payload": point.payload
        })

    return JsonResponse(data, safe=False)

@csrf_exempt
@require_POST
def get_embedding_from_image(request):
    """
    Accepts a POST request with an image file, extracts its embedding,
    and performs a similarity search using Qdrant.
    """

    image_file = request.FILES.get('image')
    print(image_file)
    if not image_file:
        return JsonResponse({"message": "No image file provided."}, status=400)

    try:
        file_bytes = np.asarray(bytearray(image_file.read()), dtype=np.uint8)
        img_array = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    except Exception as e:
        return JsonResponse({"message": f"Failed to decode image: {str(e)}"}, status=400)

    embedding = get_image_embedding(img_array, model)
    if embedding is None:
        return JsonResponse({"message": "No face detected in image."}, status=404)

    try:
        search_result = qdrant.search(
            collection_name=collection_name,
            query_vector=embedding,
            limit=1,
            with_vectors=True,
        )
    except Exception as e:
        return JsonResponse({"message": f"Vector search failed: {str(e)}"}, status=500)

    if not search_result:
        return JsonResponse({"message": "No matching embedding found."}, status=404)

    point = search_result[0]
    response_data = {
        "id": point.id,
        "score": point.score,
        "vector": point.vector,
        "payload": point.payload,
    }
    
    

    return JsonResponse(response_data)

def get_image_embedding(img_array, model):
    # Get face embeddings
    faces = model.get(img_array)
    if len(faces) == 0:
        return None  # No face detected

    # Extract the embedding (assume one face per image)
    embedding = faces[0].embedding
    # print(embedding.shape)
    return embedding.tolist()

@csrf_exempt
@require_http_methods(["POST"])
def add_embedding(request):
    try:
        body = json.loads(request.body)
        user_id = body.get("user_id")
        name = body.get("name")
        embedding = body.get("embedding")

        if not isinstance(user_id, int):
            return JsonResponse({"error": "Invalid or missing 'user_id'."}, status=400)
        if not isinstance(name, str):
            return JsonResponse({"error": "Invalid or missing 'name'."}, status=400)
        if not isinstance(embedding, list) or not all(isinstance(x, (int, float)) for x in embedding):
            return JsonResponse({"error": "Invalid or missing 'embedding'."}, status=400)

        point = PointStruct(
            id=user_id,
            vector=embedding,
            payload={"name": name, "user_id": user_id}
        )

        qdrant.upsert(collection_name=collection_name, points=[point])

        return JsonResponse({
            "message": "Embedding added successfully",
            "user_id": user_id,
            "name": name
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
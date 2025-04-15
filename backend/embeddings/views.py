from django.http import JsonResponse
from .qdrant_client import qdrant, collection_name
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

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
@require_http_methods(["GET"])
def get_embedding(request):
    try:
        body = json.loads(request.body)
        query_vector = body.get("vector")

        if not isinstance(query_vector, list) or not all(isinstance(x, (int, float)) for x in query_vector):
            return JsonResponse({"error": "Invalid or missing 'vector' in request body."}, status=400)

        search_result = qdrant.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=1,
            with_vectors=True
        )

        if not search_result:
            return JsonResponse({"message": "No matching embedding found."}, status=404)

        point = search_result[0]
        response_data = {
            "id": point.id,
            "score": point.score,
            "vector": point.vector,
            "payload": point.payload
        }

        return JsonResponse(response_data)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from qdrant_client.http.models import PointStruct
from .qdrant_client import qdrant, collection_name

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

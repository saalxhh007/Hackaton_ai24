from django.http import JsonResponse
from .qdrant_client import qdrant, collection_name

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

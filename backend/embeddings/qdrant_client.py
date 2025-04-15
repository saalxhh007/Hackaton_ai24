import uuid

from qdrant_client import QdrantClient, models


def generate_session() -> str:
    session_id = str(uuid.uuid4())
    return session_id


qdrant = QdrantClient(host="localhost", port=6333)
collection_name = "face_embeddings"

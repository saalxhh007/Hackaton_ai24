import uuid
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance

def generate_session() -> str:
    session_id = str(uuid.uuid4())
    return session_id


qdrant = QdrantClient(host="localhost", port=6333)
collection_name = "face_embeddings"



qdrant.recreate_collection(
    collection_name="face_embeddings",
    vectors_config=VectorParams(size=512, distance=Distance.COSINE)
)

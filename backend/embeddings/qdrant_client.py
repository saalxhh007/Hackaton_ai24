from qdrant_client import QdrantClient

qdrant = QdrantClient(host="localhost", port=6333)
collection_name = "face_embeddings"

from enum import Enum

import requests
from dotenv import load_dotenv
from npfaceembedding import *
from ultralytics import os

load_dotenv()


class ENV(Enum):
    EMMBEDING_MODEL_URL = os.getenv("EMMBEDING_MODEL_URL") or ""


# print()


def req_id(frame):
    embedding = get_image_embedding(cv2.resize(frame, (640, 640)), model)

    if embedding is None:
        return embedding

    return embedding

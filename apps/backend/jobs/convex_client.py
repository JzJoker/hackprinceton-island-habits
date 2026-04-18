import os
from typing import Optional
from convex import ConvexClient

_client: Optional[ConvexClient] = None


def get_client() -> ConvexClient:
    global _client
    if _client is None:
        url = os.environ.get("CONVEX_URL")
        if not url:
            raise RuntimeError("CONVEX_URL environment variable is not set")
        _client = ConvexClient(url)
    return _client

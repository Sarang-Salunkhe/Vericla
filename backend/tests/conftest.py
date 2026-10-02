import os

from fastapi.testclient import TestClient
import pytest

os.environ["VERICLA_AI_PROVIDER"] = "fake"

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)

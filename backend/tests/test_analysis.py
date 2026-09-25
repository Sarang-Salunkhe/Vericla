from fastapi.testclient import TestClient
import pytest


def test_analysis_accepts_json_body(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analysis",
        json={"document_text": "Sample agreement text."},
    )

    assert response.status_code == 501
    assert response.json() == {
        "status": "not_available",
        "message": "Document analysis is not available yet.",
    }


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"document_text": ""},
        {"document_text": "   \t\n"},
        {"document_text": "Sample agreement text.", "unexpected": "value"},
    ],
)
def test_analysis_rejects_invalid_request_bodies(
    client: TestClient, payload: dict[str, str]
) -> None:
    response = client.post("/api/v1/analysis", json=payload)

    assert response.status_code == 422
    assert response.json() == {"detail": "Request validation failed."}


def test_analysis_openapi_documents_501_response(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    responses = response.json()["paths"]["/api/v1/analysis"]["post"]["responses"]
    assert "501" in responses
    assert "200" not in responses

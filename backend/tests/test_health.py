from fastapi.testclient import TestClient
import logging

from app.main import configure_logging


def test_health_check(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_configure_logging_sets_root_level() -> None:
    root_logger = logging.getLogger()
    original_level = root_logger.level

    try:
        configure_logging("WARNING")
        assert root_logger.level == logging.WARNING
    finally:
        root_logger.setLevel(original_level)


def test_cors_preflight_allows_configured_development_origin(
    client: TestClient,
) -> None:
    response = client.options(
        "/api/v1/analysis",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"

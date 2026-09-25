from fastapi import APIRouter

from app.api.v1.endpoints import analysis, compare, documents, health, qa

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(analysis.router, tags=["analysis"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(qa.router, tags=["qa"])
api_router.include_router(compare.router, tags=["compare"])

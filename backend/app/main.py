from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import ALLOWED_ORIGINS
from app.core.database import init_databases
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api.reviews import router as reviews_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_databases()
    yield

app = FastAPI(
    title="Alqualite CourseBox API",
    description="Interactive Learning & Cognitive Mastery Engine (آلکالیت اینتراکتیو)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(courses_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Alqualite CourseBox",
        "persian_name": "آلکالیت اینتراکتیو",
        "mode": "interactive_courses"
    }

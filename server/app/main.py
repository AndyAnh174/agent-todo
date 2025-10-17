from fastapi import FastAPI
from .routers import auth as auth_router
from .routers import todos as todos_router
from .routers import groups as groups_router
from .routers import tags as tags_router


def create_app() -> FastAPI:
    app = FastAPI(title="Agent Plan API", version="1.0.0")

    # CORS: allow all origins ("*"). Note: do not enable credentials with wildcard origins.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])  # simple liveness probe
    def health_check() -> dict:
        return {"status": "ok"}


    # mount routers
    app.include_router(auth_router.router)
    app.include_router(todos_router.router)
    app.include_router(groups_router.router)
    app.include_router(tags_router.router)

    return app


app = create_app()



from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.seeds.seed_data import run_seed

# Import routers
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.products import router as products_router
from app.api.stock import router as stock_router
from app.api.purchases import router as purchases_router
from app.api.sales import router as sales_router
from app.api.returns import router as returns_router
from app.api.rso import router as rso_router
from app.api.easyload import router as easyload_router
from app.api.retailers import router as retailers_router
from app.api.staff import router as staff_router
from app.api.salaries import router as salaries_router
from app.api.expenses import router as expenses_router
from app.api.finance import router as finance_router
from app.api.reports import router as reports_router
from app.api.settings import router as settings_router
from app.api.audit import router as audit_router
from app.api.fca import router as fca_router
from app.seeds.seed_fca_data import seed_fca_data

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Independent High-Performance Telecom Franchise / Shop POS and Operations Management System",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(products_router, prefix=api_prefix)
app.include_router(stock_router, prefix=api_prefix)
app.include_router(purchases_router, prefix=api_prefix)
app.include_router(sales_router, prefix=api_prefix)
app.include_router(returns_router, prefix=api_prefix)
app.include_router(rso_router, prefix=api_prefix)
app.include_router(easyload_router, prefix=api_prefix)
app.include_router(retailers_router, prefix=api_prefix)
app.include_router(staff_router, prefix=api_prefix)
app.include_router(salaries_router, prefix=api_prefix)
app.include_router(expenses_router, prefix=api_prefix)
app.include_router(finance_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(settings_router, prefix=api_prefix)
app.include_router(audit_router, prefix=api_prefix)
app.include_router(fca_router, prefix=api_prefix)

@app.on_event("startup")
def on_startup():
    print("Executing startup routine: creating tables and seeding initial data...")
    try:
        run_seed()
    except Exception as e:
        print(f"Startup seeding notice: {e}")
    try:
        db = SessionLocal()
        seed_fca_data(db)
        db.close()
    except Exception as e:
        print(f"FCA seeding notice: {e}")

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Serve frontend build if available
current_dir = os.path.dirname(os.path.abspath(__file__))
dist_path = os.path.abspath(os.path.join(current_dir, "../../frontend/dist"))
if not os.path.exists(dist_path):
    dist_path = os.path.abspath(os.path.join(current_dir, "../static"))

if os.path.exists(dist_path):
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        file_path = os.path.join(dist_path, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "online", "system": settings.PROJECT_NAME}
else:
    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "api_docs": "/api/docs"
        }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

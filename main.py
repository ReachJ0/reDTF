import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.database import engine
from app.api import ordenes, clientes, tarifas, usuarios, analitica, auditoria, reportes

app = FastAPI(
    title="API ReDTF",
    description="Backend del sistema de gestión ReDTF · auditoría, borrado lógico, roles y reportes",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8000", "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router,  prefix="/api/usuarios",  tags=["Usuarios"])
app.include_router(clientes.router,  prefix="/api/clientes",  tags=["Clientes"])
app.include_router(tarifas.router,   prefix="/api/tarifas",   tags=["Tarifas"])
app.include_router(ordenes.router,   prefix="/api/ordenes",   tags=["Órdenes"])
app.include_router(auditoria.router, prefix="/api/auditoria", tags=["Auditoría"])
app.include_router(reportes.router,  prefix="/api/reportes",  tags=["Reportes"])
app.include_router(analitica.router, prefix="/api/analitica", tags=["Analítica"])


@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as connection:
            print("✅ Conexión a PostgreSQL (DTF_systema) establecida con éxito.")
    except Exception as e:
        print(f"❌ Error al conectar con la base de datos: {e}")


# ── Modo producción: servir el frontend compilado (frontend/dist) en el mismo origen ──
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")

if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        candidato = os.path.normpath(os.path.join(DIST, full_path))
        if full_path and candidato.startswith(DIST) and os.path.isfile(candidato):
            return FileResponse(candidato)
        return FileResponse(os.path.join(DIST, "index.html"))
else:
    @app.get("/", include_in_schema=False)
    def root():
        return {
            "mensaje": "API ReDTF funcionando 🚀 (frontend sin compilar)",
            "compilar": "powershell -File scripts/compilar.ps1",
            "docs": "/docs",
        }
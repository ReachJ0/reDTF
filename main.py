from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.api import ordenes, clientes, reportes, tarifas, usuarios, analitica, auditoria, reportes

app = FastAPI(
    title="API ReDTF",
    description="Backend del sistema de gestión ReDTF · borrado lógico + auditoría + reglas de negocio",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router,  prefix="/api/usuarios",  tags=["Usuarios"])
app.include_router(clientes.router,  prefix="/api/clientes",  tags=["Clientes"])
app.include_router(tarifas.router,   prefix="/api/tarifas",   tags=["Tarifas"])
app.include_router(ordenes.router,   prefix="/api/ordenes",   tags=["Órdenes"])
app.include_router(auditoria.router, prefix="/api/auditoria", tags=["Auditoría"])
app.include_router(analitica.router, prefix="/api/analitica", tags=["Analítica"])
app.include_router(reportes.router,  prefix="/api/reportes",  tags=["Reportes"])

@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as connection:
            print("✅ Conexión a PostgreSQL (DTF_systema) establecida con éxito.")
    except Exception as e:
        print(f"❌ Error al conectar con la base de datos: {e}")

@app.get("/")
def read_root():
    return {
        "mensaje": "API ReDTF v2.1 🚀",
        "modulos": ["usuarios", "clientes", "tarifas", "ordenes", "auditoria", "analitica"],
    }
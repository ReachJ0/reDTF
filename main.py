from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.api import analitica, usuarios, operadores, tarifas, clientes, pedidos, facturas, auditoria, finanzas
from app.api.usuarios import router as usuarios_router

app = FastAPI(
    title="API ReDTF",
    description="Backend para el sistema de gestión ReDTF",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas de la api
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuarios"])
app.include_router(operadores.router, prefix="/api/operadores", tags=["Operadores"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["Clientes"])
app.include_router(pedidos.router, prefix="/api/pedidos", tags=["Pedidos"])
app.include_router(tarifas.router, prefix="/api/tarifas", tags=["Tarifas"])
app.include_router(facturas.router, prefix="/api/facturas", tags=["Facturas"])
app.include_router(finanzas.router, prefix="/api/finanzas", tags=["Finanzas"])
app.include_router(auditoria.router, prefix="/api/auditoria", tags=["Auditoria"])
app.include_router(analitica.router, prefix="/api/analitica", tags=["Analitica"])

@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as connection:
            print("✅ Conexión a PostgreSQL (DTF_systema) establecida con éxito.")
    except Exception as e:
        print(f"❌ Error al conectar con la base de datos: {e}")

@app.get("/")
def read_root():
    return {"mensaje": "API ReDTF funcionando correctamente 🚀"}

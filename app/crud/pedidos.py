from sqlalchemy.orm import Session
from app.models.pedidos import Orden
from app.schemas.pedidos import OrdenCreate

def crear_orden(db: Session, orden: OrdenCreate):
    nueva_orden = Orden(**orden.model_dump())
    db.add(nueva_orden)
    db.commit()
    db.refresh(nueva_orden)
    return nueva_orden

def obtener_ordenes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Orden).offset(skip).limit(limit).all()

from app.models.pedidos import Orden, EstadoOrden
from app.schemas.pedidos import OrdenCreate, EstadoOrdenCreate

def crear_estado(db: Session, estado: EstadoOrdenCreate):
    nuevo_estado = EstadoOrden(**estado.model_dump())
    db.add(nuevo_estado)
    db.commit()
    db.refresh(nuevo_estado)
    return nuevo_estado

def obtener_estados(db: Session, skip: int = 0, limit: int = 100):
    return db.query(EstadoOrden).offset(skip).limit(limit).all()
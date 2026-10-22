from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.pedidos import OrdenCreate, OrdenResponse, EstadoOrdenCreate, EstadoOrdenResponse
from app.crud.pedidos import crear_orden, obtener_ordenes, crear_estado, obtener_estados
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

#ruta para las ordenes
@router.post("/", response_model=OrdenResponse)
def registrar_orden(
    orden: OrdenCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crear_orden(db=db, orden=orden)

@router.get("/", response_model=List[OrdenResponse])
def listar_ordenes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return obtener_ordenes(db=db, skip=skip, limit=limit)

#estados de ordenes
@router.post("/estados/", response_model=EstadoOrdenResponse)
def registrar_estado(
    estado: EstadoOrdenCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crear_estado(db=db, estado=estado)

@router.get("/estados/", response_model=List[EstadoOrdenResponse])
def listar_estados(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return obtener_estados(db=db, skip=skip, limit=limit)
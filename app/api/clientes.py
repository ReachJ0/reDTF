from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.clientes import ClienteCreate, ClienteResponse
from app.crud.clientes import crear_cliente, obtener_clientes
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.post("/", response_model=ClienteResponse)
def registrar_cliente(
    cliente: ClienteCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crear_cliente(db=db, cliente=cliente)

@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return obtener_clientes(db=db, skip=skip, limit=limit)
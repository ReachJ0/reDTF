from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.operadores import OperadorCreate, OperadorResponse
from app.crud.operadores import crear_operador, obtener_operadores
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.post("/", response_model=OperadorResponse)
def registrar_operador(
    operador: OperadorCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crear_operador(db=db, operador=operador)

@router.get("/", response_model=List[OperadorResponse])
def listar_operadores(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return obtener_operadores(db=db, skip=skip, limit=limit)
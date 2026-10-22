from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.tarifas import TarifaCreate, TarifaResponse
from app.crud.tarifas import crear_tarifa, obtener_tarifas
# Importamos tu guardia de seguridad
from app.api.usuarios import obtener_usuario_actual 

router = APIRouter()

@router.post("/", response_model=TarifaResponse)
def registrar_tarifa(
    tarifa: TarifaCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual) 
):
    return crear_tarifa(db=db, tarifa=tarifa)

@router.get("/", response_model=List[TarifaResponse])
def listar_tarifas(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual) 
):
    return obtener_tarifas(db=db, skip=skip, limit=limit)
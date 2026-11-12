from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.crud import tarifas as crud_tarifas
from app.core.database import get_db
from app.schemas.tarifas import TarifaCreate, TarifaResponse, TarifaUpdate
from app.crud.tarifas import crear_tarifa, obtener_tarifas
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

@router.put("/{id_tarif}", response_model=TarifaResponse)
def actualizar_tarifa(
    id_tarif: int,
    tarifa: TarifaUpdate,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Actualiza el precio de una tarifa existente."""
    tarifa_actualizada = crud_tarifas.actualizar_tarifa(db, id_tarif, tarifa)
    if not tarifa_actualizada:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    return tarifa_actualizada
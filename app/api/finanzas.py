from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.finanzas import TarifaCreate, TarifaResponse, FacturaCreate, FacturaResponse
from app.crud import finanzas as crud_finanzas
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.post("/tarifas/", response_model=TarifaResponse, tags=["Tarifas"])
def crear_tarifa(
    tarifa: TarifaCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.crear_tarifa(db=db, tarifa=tarifa)

@router.get("/tarifas/", response_model=List[TarifaResponse], tags=["Tarifas"])
def listar_tarifas(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.obtener_tarifas(db=db, skip=skip, limit=limit)

@router.post("/facturas/", response_model=FacturaResponse, tags=["Facturas"])
def crear_factura(
    factura: FacturaCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.crear_factura(db=db, factura=factura)

@router.get("/facturas/", response_model=List[FacturaResponse], tags=["Facturas"])
def listar_facturas(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.obtener_facturas(db=db, skip=skip, limit=limit)
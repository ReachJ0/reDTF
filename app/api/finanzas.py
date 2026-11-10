from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.finanzas import FacturaEstadoUpdate, TarifaCreate, TarifaResponse, FacturaCreate, FacturaResponse, TarifaUpdate
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

@router.put("/tarifas/{id_tarif}", response_model=TarifaResponse, tags=["Tarifas"])
def editar_tarifa(
    id_tarif: int, 
    tarifa: TarifaUpdate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.actualizar_tarifa(
        db=db, 
        id_tarif=id_tarif, 
        tarifa_update=tarifa, 
        id_user=usuario_actual.id_user # o usuario_actual.id_usuario
    )

@router.put("/facturas/{id_fac}/estado", response_model=FacturaResponse, tags=["Facturas"])
def actualizar_estado_factura(
    id_fac: int, 
    estado_update: FacturaEstadoUpdate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.cambiar_estado_factura(db=db, id_fac=id_fac, id_esta=estado_update.id_esta)

@router.get("/facturas/{id_fac}", response_model=FacturaResponse, tags=["Facturas"])
def listar_factura_individual(
    id_fac: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.obtener_factura_por_id(db=db, id_fac=id_fac)

@router.get("/tarifas/{id_tarif}", response_model=TarifaResponse, tags=["Tarifas"])
def listar_tarifa_individual(
    id_tarif: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_finanzas.obtener_tarifa_por_id(db=db, id_tarif=id_tarif)
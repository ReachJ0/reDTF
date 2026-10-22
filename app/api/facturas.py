from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.facturas import FacturaCreate, FacturaResponse
from app.crud.facturas import crear_factura, obtener_facturas
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.post("/", response_model=FacturaResponse)
def registrar_factura(
    factura: FacturaCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crear_factura(db=db, factura=factura)

@router.get("/", response_model=List[FacturaResponse])
def listar_facturas(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return obtener_facturas(db=db, skip=skip, limit=limit)
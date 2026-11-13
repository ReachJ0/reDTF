from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class PedidoBase(BaseModel):
    id_cli: int
    id_tarif: int
    larcm_order: float = Field(..., gt=0, description="Largo en cm")
    ancm_order: float = Field(..., gt=0, description="Ancho en cm")
    can_order: int = Field(..., gt=0, description="Cantidad")
    id_estado: int = 1  # Estado de producción

class PedidoCreate(PedidoBase):
    pass

class PedidoUpdate(BaseModel):
    id_estado: Optional[int] = None
    larcm_order: Optional[float] = None
    ancm_order: Optional[float] = None
    can_order: Optional[int] = None

class PedidoResponse(PedidoBase):
    id_order: int
    id_fac: Optional[int] = None
    sub_order: Optional[float] = None
    m2_total: Optional[float] = None
    nombre_cliente: Optional[str] = None
    telf_cliente: Optional[str] = None
    nom_estado: Optional[str] = None
    tam_tarif: Optional[str] = None
    pre_tarif: Optional[float] = None
    fec_creacion: Optional[str] = None

    class Config:
        from_attributes = True

class EstadoPedidoResponse(BaseModel):
    id_estado: int
    nom_estado: str

    class Config:
        from_attributes = True
from pydantic import BaseModel
from decimal import Decimal

class OrdenBase(BaseModel):
    id_fac: int
    id_tarif: int
    larcm_order: Decimal
    ancm_order: Decimal
    can_order: int
    sub_order: Decimal

class OrdenCreate(OrdenBase):
    pass

class OrdenResponse(OrdenBase):
    id_order: int

    class Config:
        from_attributes = True

class EstadoOrdenBase(BaseModel):
    nom_esta: str

class EstadoOrdenCreate(EstadoOrdenBase):
    pass

class EstadoOrdenResponse(EstadoOrdenBase):
    id_esta: int

    class Config:
        from_attributes = True
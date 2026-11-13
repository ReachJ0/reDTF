from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FacturaBase(BaseModel):
    id_cli: int
    id_estado: int = 1  # Estado de pago
    mont_fac: float = Field(..., gt=0, description="Monto de la factura")
    fecc_fac: Optional[datetime] = None
    fece_fac: Optional[datetime] = None

class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    id_estado: Optional[int] = None
    mont_fac: Optional[float] = None
    fece_fac: Optional[datetime] = None

class FacturaResponse(FacturaBase):
    id_fac: int
    nombre_cliente: Optional[str] = None
    telf_cliente: Optional[str] = None
    nom_estado: Optional[str] = None

    class Config:
        from_attributes = True

class EstadoFacturaResponse(BaseModel):
    id_estado: int
    nom_estado: str

    class Config:
        from_attributes = True
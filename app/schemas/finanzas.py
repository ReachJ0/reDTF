from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from app.core.database import Base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TarifaBase(BaseModel):
    tam_tarif: str
    pre_tarif: float

class TarifaCreate(TarifaBase):
    pass

class TarifaResponse(TarifaBase):
    id_tarif: int

    class Config:
        from_attributes = True
        
class FacturaBase(BaseModel):
    id_cli: int
    id_esta: int
    mont_fac: float
    fecc_fac: datetime
    fece_fac: datetime
    id_oper_Operadores: Optional[int] = None

class FacturaCreate(FacturaBase):
    pass

class FacturaResponse(BaseModel):
    id_fac: int
    id_cli: int
    id_esta: int
    mont_fac: float
    fecc_fac: Optional[datetime] = None
    fece_fac: Optional[datetime] = None
    nombre_cliente: Optional[str] = None
    telf_cliente: Optional[str] = None
    nom_esta: Optional[str] = None 

    class Config:
        from_attributes = True
class TarifaUpdate(BaseModel):
    tam_tarif: Optional[str] = None
    pre_tarif: Optional[float] = None

class FacturaEstadoUpdate(BaseModel):
    id_esta: int


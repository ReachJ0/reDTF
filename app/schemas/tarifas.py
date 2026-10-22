from pydantic import BaseModel
from decimal import Decimal

class TarifaBase(BaseModel):
    tam_tarif: str  
    pre_tarif: Decimal

class TarifaCreate(TarifaBase):
    pass

class TarifaResponse(TarifaBase):
    id_tarif: int

    class Config:
        from_attributes = True
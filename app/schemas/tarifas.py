from pydantic import BaseModel, Field
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

class TarifaUpdate(BaseModel):
    pre_tarif: float = Field(..., gt=0, description="Nuevo precio por m²")
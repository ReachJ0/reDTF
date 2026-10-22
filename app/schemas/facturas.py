from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional

class FacturaBase(BaseModel):
    id_cli: int
    id_esta: int
    mont_fac: Decimal
    fecc_fac: datetime
    fece_fac: datetime
    id_oper_Operadores: Optional[int] = None # en caso de no haber un Operador agg

class FacturaCreate(FacturaBase):
    pass

class FacturaResponse(FacturaBase):
    id_fac: int

    class Config:
        from_attributes = True
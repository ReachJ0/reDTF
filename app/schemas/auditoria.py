from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditoriaBase(BaseModel):
    action_aud: str
    table_aud: str
    regid_aud: Optional[int] = None
    prev_aud: Optional[str] = None
    new_aud: Optional[str] = None
    id_user: Optional[int] = None

class AuditoriaCreate(AuditoriaBase):
    pass

class AuditoriaResponse(AuditoriaBase):
    id_aud: int
    fec_aud: Optional[datetime] = None

    class Config:
        from_attributes = True
from pydantic import BaseModel
from typing import Optional

class ClienteBase(BaseModel):
    nombre_user: str
    telf_user: str

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    id_cli: int
    id_user_Usuarios: Optional[int] = None

    class Config:
        from_attributes = True
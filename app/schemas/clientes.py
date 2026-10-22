from pydantic import BaseModel

class ClienteBase(BaseModel):
    nombre_user: str
    telf_user: str
    id_user_Usuarios: int

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    id_cli: int

    class Config:
        from_attributes = True
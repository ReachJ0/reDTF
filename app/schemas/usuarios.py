from pydantic import BaseModel, ConfigDict

class UsuarioBase(BaseModel):
    correo_user: str  # Lo pasamos a 'str' normal para evitar bloqueos
    id_rol: int

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id_user: int

    # Sintaxis correcta y moderna para Pydantic V2
    model_config = ConfigDict(from_attributes=True)
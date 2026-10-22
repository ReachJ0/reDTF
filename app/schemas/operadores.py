from pydantic import BaseModel

class OperadorBase(BaseModel):
    nom_oper: str
    ape_oper: str
    ced_oper: int 

class OperadorCreate(OperadorBase):
    pass

class OperadorResponse(OperadorBase):
    id_oper: int

    class Config:
        from_attributes = True
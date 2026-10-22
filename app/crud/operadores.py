from sqlalchemy.orm import Session
from app.models.usuarios import Operador
from app.schemas.operadores import OperadorCreate

def crear_operador(db: Session, operador: OperadorCreate):
    nuevo_operador = Operador(**operador.model_dump())
    db.add(nuevo_operador)
    db.commit()
    db.refresh(nuevo_operador)
    return nuevo_operador

def obtener_operadores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Operador).offset(skip).limit(limit).all()
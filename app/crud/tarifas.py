from sqlalchemy.orm import Session
from app.models.finanzas import Tarifa
from app.schemas.tarifas import TarifaCreate

def crear_tarifa(db: Session, tarifa: TarifaCreate):
    nueva_tarifa = Tarifa(**tarifa.model_dump())
    db.add(nueva_tarifa)
    db.commit()
    db.refresh(nueva_tarifa)
    return nueva_tarifa

def obtener_tarifas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Tarifa).offset(skip).limit(limit).all()
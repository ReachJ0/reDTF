from sqlalchemy.orm import Session
from app.models.finanzas import Tarifa
from app.schemas.tarifas import TarifaCreate, TarifaUpdate

def obtener_tarifas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Tarifa).offset(skip).limit(limit).all()

def obtener_tarifa_por_id(db: Session, id_tarif: int):
    return db.query(Tarifa).filter(Tarifa.id_tarif == id_tarif).first()

def crear_tarifa(db: Session, tarifa: TarifaCreate):
    db_tarifa = Tarifa(**tarifa.dict())
    db.add(db_tarifa)
    db.commit()
    db.refresh(db_tarifa)
    return db_tarifa

def actualizar_tarifa(db: Session, id_tarif: int, tarifa: TarifaUpdate):
    """Actualiza el precio de una tarifa."""
    db_tarifa = db.query(Tarifa).filter(Tarifa.id_tarif == id_tarif).first()
    if db_tarifa:
        db_tarifa.pre_tarif = tarifa.pre_tarif
        db.commit()
        db.refresh(db_tarifa)
    return db_tarifa
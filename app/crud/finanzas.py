from sqlalchemy.orm import Session
from app.models.finanzas import Tarifa, Factura
from app.schemas.finanzas import TarifaCreate, FacturaCreate

def crear_tarifa(db: Session, tarifa: TarifaCreate):
    db_tarifa = Tarifa(**tarifa.model_dump())
    db.add(db_tarifa)
    db.commit()
    db.refresh(db_tarifa)
    return db_tarifa

def obtener_tarifas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Tarifa).offset(skip).limit(limit).all()

def crear_factura(db: Session, factura: FacturaCreate):
    db_factura = Factura(**factura.model_dump())
    db.add(db_factura)
    db.commit()
    db.refresh(db_factura)
    return db_factura

def obtener_facturas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Factura).offset(skip).limit(limit).all()
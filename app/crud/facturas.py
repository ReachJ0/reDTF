from sqlalchemy.orm import Session
from app.models.finanzas import Factura
from app.schemas.facturas import FacturaCreate

def crear_factura(db: Session, factura: FacturaCreate):
    nueva_factura = Factura(**factura.model_dump())
    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)
    return nueva_factura

def obtener_facturas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Factura).offset(skip).limit(limit).all()
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.finanzas import Tarifa, Factura
from app.schemas.finanzas import TarifaCreate, FacturaCreate, TarifaUpdate, FacturaEstadoUpdate
from fastapi import HTTPException
from app.models.auditoria import Auditoria

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

def actualizar_tarifa(db: Session, id_tarif: int, tarifa_update: TarifaUpdate, id_user: int):
    db_tarifa = db.query(Tarifa).filter(Tarifa.id_tarif == id_tarif).first()
    if not db_tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    
    update_data = tarifa_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tarifa, key, value)
    
    db.commit()
    db.refresh(db_tarifa)
    
    registro_auditoria = Auditoria(
        action_aud="ACTUALIZAR",
        table_aud="Tarifas",
        regid_aud=db_tarifa.id_tarif,
        id_user=id_user
    )
    db.add(registro_auditoria)
    db.commit()
    
    return db_tarifa

def obtener_factura_por_id(db: Session, id_fac: int):
    db_factura = db.query(Factura).filter(Factura.id_fac == id_fac).first()
    if not db_factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return db_factura

def obtener_tarifa_por_id(db: Session, id_tarif: int):
    db_tarifa = db.query(Tarifa).filter(Tarifa.id_tarif == id_tarif).first()
    if not db_tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    return db_tarifa

def cambiar_estado_factura(db: Session, id_fac: int, id_esta: int):
    """Cambia el estado de una factura y retorna la factura actualizada."""
    # Buscar la factura
    factura = db.query(Factura).filter(Factura.id_fac == id_fac).first()
    
    if not factura:
        return None
    
    # Actualizar el estado
    factura.id_esta = id_esta
    db.commit()
    db.refresh(factura)
    
    return factura
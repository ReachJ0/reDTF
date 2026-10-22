from sqlalchemy.orm import Session
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaCreate

def registrar_auditoria(db: Session, auditoria: AuditoriaCreate):
    db_auditoria = Auditoria(**auditoria.model_dump())
    db.add(db_auditoria)
    db.commit()
    db.refresh(db_auditoria)
    return db_auditoria

def obtener_auditorias(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Auditoria).offset(skip).limit(limit).all()
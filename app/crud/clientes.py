from sqlalchemy.orm import Session
from app.models.usuarios import Cliente
from app.schemas.clientes import ClienteCreate
from fastapi import HTTPException

def crear_cliente(db: Session, cliente: ClienteCreate):
    nuevo_cliente = Cliente(**cliente.model_dump())
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

def obtener_clientes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Cliente).offset(skip).limit(limit).all()

def obtener_cliente_por_id(db: Session, id_cli: int):
    db_cliente = db.query(Cliente).filter(Cliente.id_cli == id_cli).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente
from sqlalchemy.orm import Session
from app.models.usuarios import Cliente
from app.schemas.clientes import ClienteCreate


def obtener_clientes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Cliente).offset(skip).limit(limit).all()


def obtener_cliente_por_id(db: Session, id_cli: int):
    return db.query(Cliente).filter(Cliente.id_cli == id_cli).first()


def crear_cliente(db: Session, cliente: ClienteCreate):
    """Crea un nuevo cliente generando el ID automáticamente."""
    # Obtener el último ID y sumarle 1 (estrategia simple para PostgreSQL)
    ultimo_id = db.query(Cliente).order_by(Cliente.id_cli.desc()).first()
    nuevo_id = (ultimo_id.id_cli + 1) if ultimo_id else 1

    db_cliente = Cliente(
        id_cli=nuevo_id,
        nombre_user=cliente.nombre_user,
        telf_user=cliente.telf_user
    )
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def eliminar_cliente(db: Session, id_cli: int):
    """Elimina un cliente de la base de datos."""
    cliente = db.query(Cliente).filter(Cliente.id_cli == id_cli).first()
    if cliente:
        db.delete(cliente)
        db.commit()
    return cliente
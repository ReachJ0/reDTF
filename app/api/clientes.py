from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.crud import clientes as crud_clientes
from app.core.database import get_db
from app.schemas.clientes import ClienteCreate, ClienteResponse
from app.crud.clientes import crear_cliente, obtener_clientes
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.post("/", response_model=ClienteResponse)
def registrar_cliente(
    cliente: ClienteCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crear_cliente(db=db, cliente=cliente)

@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return obtener_clientes(db=db, skip=skip, limit=limit)

@router.get("/{id_cli}", response_model=ClienteResponse, tags=["Clientes"])
def listar_cliente_individual(
    id_cli: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return crud_clientes.obtener_cliente_por_id(db=db, id_cli=id_cli)

@router.delete("/{id_cli}", status_code=204)
def eliminar_cliente(
    id_cli: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Elimina un cliente por su ID."""
    cliente = crud_clientes.obtener_cliente_por_id(db, id_cli)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    crud_clientes.eliminar_cliente(db, id_cli)
    return None
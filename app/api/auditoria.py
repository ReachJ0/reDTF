from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.auditoria import AuditoriaCreate, AuditoriaResponse
from app.crud.auditoria import registrar_auditoria, obtener_auditorias
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.post("/", response_model=AuditoriaResponse)
def crear_registro_auditoria(
    auditoria: AuditoriaCreate, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return registrar_auditoria(db=db, auditoria=auditoria)

@router.get("/", response_model=List[AuditoriaResponse])
def listar_auditorias(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    return obtener_auditorias(db=db, skip=skip, limit=limit)
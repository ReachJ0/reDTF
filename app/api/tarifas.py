from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()


class TarifaIn(BaseModel):
    tam_tarif: str = Field(min_length=2, max_length=80)
    pre_tarif: float = Field(gt=0, le=100000, description="Precio por m², mayor a cero")

    @field_validator("tam_tarif")
    @classmethod
    def v_nombre(cls, v: str) -> str:
        v = " ".join((v or "").split())
        if len(v) < 2:
            raise ValueError("El nombre de la tarifa debe tener al menos 2 caracteres")
        return v


class TarifaUp(BaseModel):
    tam_tarif: Optional[str] = Field(default=None, min_length=2, max_length=80)
    pre_tarif: Optional[float] = Field(default=None, gt=0, le=100000)


def _uid(u) -> str:
    for a in ("id_usu", "id_usuario", "id_user", "id"):
        v = getattr(u, a, None)
        if v is not None:
            return str(v)
    return "sistema"


@router.get("/", response_model=List[dict])
def listar_tarifas(
    skip: int = 0,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    rows = db.execute(
        text('''SELECT t.id_tarif, t.tam_tarif, t.pre_tarif,
                       (SELECT COUNT(*) FROM "Pedidos"."Ordenes" o WHERE o.id_tarif = t.id_tarif AND o.activo = TRUE) AS n_ordenes
                FROM "Finanzas"."Tarifas" t
                WHERE t.activo = TRUE
                ORDER BY t.pre_tarif DESC
                LIMIT :limit OFFSET :skip'''),
        {"skip": skip, "limit": limit},
    ).fetchall()
    return [
        {"id_tarif": r.id_tarif, "tam_tarif": r.tam_tarif, "pre_tarif": float(r.pre_tarif), "n_ordenes": r.n_ordenes}
        for r in rows
    ]


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_tarifa(
    tarifa: TarifaIn,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Regla: no se admiten tarifas vigentes con el mismo nombre."""
    dup = db.execute(text('SELECT id_tarif FROM "Finanzas"."Tarifas" WHERE activo=TRUE AND tam_tarif ILIKE :n'), {"n": tarifa.tam_tarif}).fetchone()
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Ya existe una tarifa vigente llamada '{tarifa.tam_tarif}'")
    id_tarif = db.execute(
        text('INSERT INTO "Finanzas"."Tarifas" (tam_tarif, pre_tarif) VALUES (:n, :p) RETURNING id_tarif'),
        {"n": tarifa.tam_tarif, "p": tarifa.pre_tarif},
    ).scalar()
    db.commit()
    return {"id_tarif": id_tarif, "detalle": "Tarifa creada"}


@router.put("/{id_tarif}", response_model=dict)
def actualizar_tarifa(
    id_tarif: int,
    tarifa: TarifaUp,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    actual = db.execute(text('SELECT id_tarif FROM "Finanzas"."Tarifas" WHERE id_tarif=:i AND activo=TRUE'), {"i": id_tarif}).fetchone()
    if not actual:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tarifa no encontrada o eliminada")
    campos, params = [], {"i": id_tarif}
    if tarifa.tam_tarif is not None:
        campos.append("tam_tarif = :n"); params["n"] = tarifa.tam_tarif
    if tarifa.pre_tarif is not None:
        campos.append("pre_tarif = :p"); params["p"] = tarifa.pre_tarif
    if not campos:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Debe enviar al menos un campo a actualizar")
    db.execute(text(f'UPDATE "Finanzas"."Tarifas" SET {", ".join(campos)} WHERE id_tarif = :i'), params)
    db.commit()
    return {"detalle": "Tarifa actualizada"}


@router.delete("/{id_tarif}", response_model=dict)
def eliminar_tarifa(
    id_tarif: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Borrado LÓGICO. Regla: no se elimina tarifa en uso por órdenes vigentes."""
    r = db.execute(text('SELECT tam_tarif FROM "Finanzas"."Tarifas" WHERE id_tarif=:i AND activo=TRUE'), {"i": id_tarif}).fetchone()
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tarifa no encontrada o ya eliminada")
    n = db.execute(text('SELECT COUNT(*) FROM "Pedidos"."Ordenes" WHERE id_tarif=:i AND activo=TRUE'), {"i": id_tarif}).scalar()
    if n:
        raise HTTPException(status.HTTP_409_CONFLICT, f"No se puede eliminar: {n} orden(es) vigentes la usan")
    db.execute(
        text('UPDATE "Finanzas"."Tarifas" SET activo=FALSE, fec_eliminacion=NOW(), eliminado_por=:u WHERE id_tarif=:i'),
        {"u": _uid(usuario_actual), "i": id_tarif},
    )
    db.commit()
    return {"detalle": f"Tarifa '{r.tam_tarif}' eliminada lógicamente"}
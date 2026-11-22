import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()
TEL_RE = re.compile(r"^[0-9+\-\s()]{7,15}$")


def _limpiar_nombre(v: str) -> str:
    v = " ".join((v or "").split())
    if len(v) < 3:
        raise ValueError("El nombre debe tener al menos 3 caracteres")
    return v


def _validar_telf(v: Optional[str]) -> Optional[str]:
    if v is None or v.strip() == "":
        return None
    v = v.strip()
    if not TEL_RE.match(v):
        raise ValueError("Teléfono inválido: usa entre 7 y 15 dígitos, +, -, ( ) o espacios")
    return v


class ClienteIn(BaseModel):
    nombre_user: str = Field(min_length=3, max_length=120)
    telf_user: Optional[str] = Field(default=None, max_length=15)

    @field_validator("nombre_user")
    @classmethod
    def v_nombre(cls, v: str) -> str:
        return _limpiar_nombre(v)

    @field_validator("telf_user")
    @classmethod
    def v_telf(cls, v: Optional[str]) -> Optional[str]:
        return _validar_telf(v)


class ClienteUp(BaseModel):
    nombre_user: Optional[str] = Field(default=None, min_length=3, max_length=120)
    telf_user: Optional[str] = Field(default=None, max_length=15)

    @field_validator("nombre_user")
    @classmethod
    def v_nombre(cls, v: Optional[str]) -> Optional[str]:
        return _limpiar_nombre(v) if v is not None else None

    @field_validator("telf_user")
    @classmethod
    def v_telf(cls, v: Optional[str]) -> Optional[str]:
        return _validar_telf(v)


def _uid(u) -> str:
    for a in ("id_usu", "id_usuario", "id_user", "id"):
        v = getattr(u, a, None)
        if v is not None:
            return str(v)
    return getattr(u, "nombre_user", None) or getattr(u, "username", None) or "sistema"


@router.get("/", response_model=List[dict])
def listar_clientes(
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Clientes vigentes: el borrado lógico se respeta en la lectura."""
    where, params = ["activo = TRUE"], {"skip": skip, "limit": limit}
    if q:
        where.append("(nombre_user ILIKE :q OR COALESCE(telf_user,'') ILIKE :q)")
        params["q"] = f"%{q}%"
    sql = f'''
        SELECT c.id_cli, c.nombre_user, c.telf_user,
               (SELECT COUNT(*) FROM "Pedidos"."Ordenes" o
                 JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
                WHERE f.id_cli = c.id_cli AND o.activo = TRUE) AS n_ordenes,
               (SELECT COALESCE(SUM(o.sub_order),0) FROM "Pedidos"."Ordenes" o
                 JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
                WHERE f.id_cli = c.id_cli AND o.activo = TRUE) AS total_facturado
        FROM "Personas"."Clientes" c
        WHERE {" AND ".join(where)}
        ORDER BY c.nombre_user
        LIMIT :limit OFFSET :skip
    '''
    rows = db.execute(text(sql), params).fetchall()
    return [
        {
            "id_cli": r.id_cli, "nombre_user": r.nombre_user, "telf_user": r.telf_user,
            "n_ordenes": r.n_ordenes, "total_facturado": float(r.total_facturado or 0),
        }
        for r in rows
    ]


@router.get("/{id_cli}", response_model=dict)
def obtener_cliente(id_cli: int, db: Session = Depends(get_db), usuario_actual=Depends(obtener_usuario_actual)):
    r = db.execute(
        text('SELECT id_cli, nombre_user, telf_user FROM "Personas"."Clientes" WHERE id_cli=:i AND activo=TRUE'),
        {"i": id_cli},
    ).fetchone()
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado o eliminado")
    return {"id_cli": r.id_cli, "nombre_user": r.nombre_user, "telf_user": r.telf_user}


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_cliente(
    cliente: ClienteIn,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Regla de negocio: no se admiten clientes vigentes duplicados (nombre+teléfono)."""
    dup = db.execute(
        text("SELECT id_cli FROM \"Personas\".\"Clientes\" WHERE activo=TRUE AND nombre_user ILIKE :n AND COALESCE(telf_user,'') = COALESCE(:t,'')"),
        {"n": cliente.nombre_user, "t": cliente.telf_user},
    ).fetchone()
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Ya existe un cliente vigente con ese nombre y teléfono (#{dup.id_cli})")
    id_cli = db.execute(
        text('INSERT INTO "Personas"."Clientes" (nombre_user, telf_user) VALUES (:n, :t) RETURNING id_cli'),
        {"n": cliente.nombre_user, "t": cliente.telf_user},
    ).scalar()
    db.commit()
    return {"id_cli": id_cli, "detalle": "Cliente registrado"}


@router.put("/{id_cli}", response_model=dict)
def actualizar_cliente(
    id_cli: int,
    cliente: ClienteUp,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    actual = db.execute(text('SELECT id_cli FROM "Personas"."Clientes" WHERE id_cli=:i AND activo=TRUE'), {"i": id_cli}).fetchone()
    if not actual:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado o eliminado")
    campos, params = [], {"i": id_cli}
    if cliente.nombre_user is not None:
        campos.append("nombre_user = :n"); params["n"] = cliente.nombre_user
    if cliente.telf_user is not None:
        campos.append("telf_user = :t"); params["t"] = cliente.telf_user
    if not campos:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Debe enviar al menos un campo a actualizar")
    db.execute(text(f'UPDATE "Personas"."Clientes" SET {", ".join(campos)} WHERE id_cli = :i'), params)
    db.commit()
    return {"detalle": "Cliente actualizado"}


@router.delete("/{id_cli}", response_model=dict)
def eliminar_cliente(
    id_cli: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Borrado LÓGICO. Regla: no se elimina cliente con órdenes vigentes."""
    r = db.execute(text('SELECT nombre_user FROM "Personas"."Clientes" WHERE id_cli=:i AND activo=TRUE'), {"i": id_cli}).fetchone()
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado o ya eliminado")
    n = db.execute(
        text('''SELECT COUNT(*) FROM "Pedidos"."Ordenes" o
                JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
                WHERE f.id_cli = :i AND o.activo = TRUE'''),
        {"i": id_cli},
    ).scalar()
    if n:
        raise HTTPException(status.HTTP_409_CONFLICT, f"No se puede eliminar: tiene {n} orden(es) vigentes asociadas")
    db.execute(
        text('UPDATE "Personas"."Clientes" SET activo=FALSE, fec_eliminacion=NOW(), eliminado_por=:u WHERE id_cli=:i'),
        {"u": _uid(usuario_actual), "i": id_cli},
    )
    db.commit()
    return {"detalle": f"Cliente '{r.nombre_user}' eliminado lógicamente (recuperable)"}
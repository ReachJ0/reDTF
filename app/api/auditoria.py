from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()


@router.get("/")
def listar_auditoria(
    tabla: Optional[str] = None,
    operacion: Optional[str] = None,
    usuario: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Trazabilidad completa: quién, qué, cuándo y valores antes/después."""
    where, params = ["1=1"], {"skip": skip, "limit": limit}
    if tabla:
        where.append("tabla ILIKE :tabla"); params["tabla"] = f"%{tabla}%"
    if operacion:
        where.append("operacion = :op"); params["op"] = operacion.upper()
    if usuario:
        where.append("usuario ILIKE :usu"); params["usu"] = f"%{usuario}%"
    if desde:
        where.append("fec_operacion >= CAST(:desde AS timestamp)"); params["desde"] = desde
    if hasta:
        where.append("fec_operacion <= CAST(:hasta AS timestamp) + INTERVAL '1 day'"); params["hasta"] = hasta
    if q:
        where.append("(id_registro ILIKE :q OR COALESCE(datos_nuevos::text, datos_antiguos::text) ILIKE :q)"); params["q"] = f"%{q}%"
    w = "WHERE " + " AND ".join(where)
    total = db.execute(text(f'SELECT COUNT(*) FROM "Auditoria"."Registro" {w}'), params).scalar()
    rows = db.execute(text(f'''
        SELECT id_aud, tabla, operacion, id_registro, datos_antiguos, datos_nuevos,
               usuario, aplicacion, fec_operacion
        FROM "Auditoria"."Registro" {w}
        ORDER BY id_aud DESC
        LIMIT :limit OFFSET :skip
    '''), params).fetchall()
    return {
        "total": total,
        "registros": [
            {
                "id_aud": r.id_aud, "tabla": r.tabla, "operacion": r.operacion,
                "id_registro": r.id_registro, "usuario": r.usuario,
                "aplicacion": r.aplicacion,
                "fec_operacion": r.fec_operacion.isoformat() if r.fec_operacion else None,
                "datos_antiguos": r.datos_antiguos, "datos_nuevos": r.datos_nuevos,
            }
            for r in rows
        ],
    }


@router.get("/resumen")
def resumen_auditoria(db: Session = Depends(get_db), usuario_actual=Depends(obtener_usuario_actual)):
    por_op = db.execute(text('SELECT operacion, COUNT(*) AS n FROM "Auditoria"."Registro" GROUP BY operacion ORDER BY n DESC')).fetchall()
    por_tabla = db.execute(text('SELECT tabla, COUNT(*) AS n FROM "Auditoria"."Registro" GROUP BY tabla ORDER BY n DESC LIMIT 8')).fetchall()
    por_usuario = db.execute(text('SELECT usuario, COUNT(*) AS n FROM "Auditoria"."Registro" GROUP BY usuario ORDER BY n DESC LIMIT 5')).fetchall()
    return {
        "por_operacion": [{"operacion": r.operacion, "cantidad": r.n} for r in por_op],
        "por_tabla": [{"tabla": r.tabla, "cantidad": r.n} for r in por_tabla],
        "por_usuario": [{"usuario": r.usuario, "cantidad": r.n} for r in por_usuario],
    }


@router.get("/{id_aud}")
def detalle_auditoria(id_aud: int, db: Session = Depends(get_db), usuario_actual=Depends(obtener_usuario_actual)):
    r = db.execute(text('SELECT * FROM "Auditoria"."Registro" WHERE id_aud=:i'), {"i": id_aud}).fetchone()
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro de auditoría no encontrado")
    return {
        "id_aud": r.id_aud, "tabla": r.tabla, "operacion": r.operacion, "id_registro": r.id_registro,
        "usuario": r.usuario, "aplicacion": r.aplicacion,
        "fec_operacion": r.fec_operacion.isoformat() if r.fec_operacion else None,
        "datos_antiguos": r.datos_antiguos, "datos_nuevos": r.datos_nuevos,
    }
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()


class EstadoIn(BaseModel):
    id_estado: int = Field(ge=1, description="ID del estado destino")


class OrdenIn(BaseModel):
    id_cli: int = Field(ge=1)
    id_tarif: int = Field(ge=1)
    larcm_order: float = Field(gt=0, le=10000, description="Largo en cm")
    ancm_order: float = Field(gt=0, le=10000, description="Ancho en cm")
    can_order: int = Field(ge=1, le=100000, description="Cantidad de piezas")
    id_estado: int = Field(default=1, ge=1)


def _uid(u) -> str:
    for a in ("id_usu", "id_usuario", "id_user", "id"):
        v = getattr(u, a, None)
        if v is not None:
            return str(v)
    return "sistema"


def _pedido_completo(db: Session, id_order: int) -> Optional[dict]:
    row = db.execute(text('''
        SELECT o.id_order, o.id_fac, o.id_tarif, o.larcm_order, o.ancm_order, o.can_order,
               o.sub_order, o.id_estado AS id_estado_prod, o.fec_creacion,
               f.id_cli, f.id_estado AS id_estado_pago, f.mont_fac, f.fece_fac,
               c.nombre_user AS nombre_cliente, c.telf_user AS telf_cliente,
               ep.nom_estado AS nom_estado_prod, ef.nom_estado AS nom_estado_pago,
               t.tam_tarif, t.pre_tarif
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        LEFT JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        LEFT JOIN "Finanzas"."EstadoFactura" ef ON f.id_estado = ef.id_estado
        LEFT JOIN "Finanzas"."Tarifas" t ON o.id_tarif = t.id_tarif
        WHERE o.id_order = :i AND o.activo = TRUE
    '''), {"i": id_order}).fetchone()
    if not row:
        return None
    m2 = (float(row.larcm_order) * float(row.ancm_order) * int(row.can_order)) / 10000.0
    return {
        "id_order": row.id_order, "id_fac": row.id_fac, "id_cli": row.id_cli, "id_tarif": row.id_tarif,
        "larcm_order": float(row.larcm_order), "ancm_order": float(row.ancm_order), "can_order": int(row.can_order),
        "sub_order": float(row.sub_order or 0), "m2_total": m2,
        "id_estado_prod": row.id_estado_prod, "id_estado_pago": row.id_estado_pago,
        "mont_fac": float(row.mont_fac or 0),
        "fec_creacion": row.fec_creacion.isoformat() if row.fec_creacion else None,
        "fece_fac": row.fece_fac.isoformat() if row.fece_fac else None,
        "nombre_cliente": row.nombre_cliente, "telf_cliente": row.telf_cliente,
        "nom_estado_prod": row.nom_estado_prod, "nom_estado_pago": row.nom_estado_pago,
        "tam_tarif": row.tam_tarif, "pre_tarif": float(row.pre_tarif or 0),
    }


@router.get("/", response_model=List[dict])
def listar_ordenes(
    skip: int = 0,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    rows = db.execute(text('''
        SELECT o.id_order, o.id_fac, o.id_tarif, o.larcm_order, o.ancm_order, o.can_order,
               o.sub_order, o.id_estado AS id_estado_prod, o.fec_creacion,
               f.id_cli, f.id_estado AS id_estado_pago, f.mont_fac, f.fece_fac,
               c.nombre_user AS nombre_cliente, c.telf_user AS telf_cliente,
               ep.nom_estado AS nom_estado_prod, ef.nom_estado AS nom_estado_pago,
               t.tam_tarif, t.pre_tarif
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        LEFT JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        LEFT JOIN "Finanzas"."EstadoFactura" ef ON f.id_estado = ef.id_estado
        LEFT JOIN "Finanzas"."Tarifas" t ON o.id_tarif = t.id_tarif
        WHERE o.activo = TRUE
        ORDER BY o.id_order DESC
        LIMIT :limit OFFSET :skip
    '''), {"skip": skip, "limit": limit}).fetchall()

    ordenes = []
    for r in rows:
        m2 = (float(r.larcm_order) * float(r.ancm_order) * int(r.can_order)) / 10000.0
        ordenes.append({
            "id_order": r.id_order, "id_fac": r.id_fac, "id_cli": r.id_cli, "id_tarif": r.id_tarif,
            "larcm_order": float(r.larcm_order), "ancm_order": float(r.ancm_order), "can_order": int(r.can_order),
            "sub_order": float(r.sub_order or 0), "m2_total": m2,
            "id_estado_prod": r.id_estado_prod, "id_estado_pago": r.id_estado_pago,
            "mont_fac": float(r.mont_fac or 0),
            "fec_creacion": r.fec_creacion.isoformat() if r.fec_creacion else None,
            "fece_fac": r.fece_fac.isoformat() if r.fece_fac else None,
            "nombre_cliente": r.nombre_cliente, "telf_cliente": r.telf_cliente,
            "nom_estado_prod": r.nom_estado_prod, "nom_estado_pago": r.nom_estado_pago,
            "tam_tarif": r.tam_tarif, "pre_tarif": float(r.pre_tarif or 0),
        })
    return ordenes


@router.get("/estados-produccion/")
def listar_estados_produccion(db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id_estado, nom_estado FROM "Pedidos"."EstadoPedido" ORDER BY id_estado')).fetchall()
    return [{"id_estado": r.id_estado, "nom_estado": r.nom_estado} for r in rows]


@router.get("/estados-pago/")
def listar_estados_pago(db: Session = Depends(get_db)):
    rows = db.execute(text('SELECT id_estado, nom_estado FROM "Finanzas"."EstadoFactura" ORDER BY id_estado')).fetchall()
    return [{"id_estado": r.id_estado, "nom_estado": r.nom_estado} for r in rows]


@router.get("/estadisticas")
def obtener_estadisticas(db: Session = Depends(get_db), usuario_actual=Depends(obtener_usuario_actual)):
    stats = db.execute(text('''
        SELECT COUNT(o.id_order) AS total_ordenes,
               COALESCE(SUM(o.sub_order),0) AS ingresos_totales,
               COUNT(CASE WHEN ep.nom_estado='Entregado' THEN 1 END) AS entregadas,
               COALESCE(SUM(CASE WHEN ef.nom_estado='Pendiente' THEN o.sub_order ELSE 0 END),0) AS por_cobrar_monto
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        LEFT JOIN "Finanzas"."EstadoFactura" ef ON f.id_estado = ef.id_estado
        WHERE o.activo = TRUE
    ''')).fetchone()
    estados_prod = db.execute(text('''
        SELECT ep.nom_estado, COUNT(o.id_order) AS cantidad
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        WHERE o.activo = TRUE
        GROUP BY ep.nom_estado ORDER BY cantidad DESC
    ''')).fetchall()
    top = db.execute(text('''
        SELECT c.nombre_user, COUNT(o.id_order) AS total_ordenes, COALESCE(SUM(o.sub_order),0) AS monto_total
        FROM "Pedidos"."Ordenes" o
        JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        WHERE o.activo = TRUE
        GROUP BY c.nombre_user ORDER BY total_ordenes DESC LIMIT 3
    ''')).fetchall()
    return {
        "total_ordenes": stats.total_ordenes or 0,
        "ingresos_totales": float(stats.ingresos_totales or 0),
        "entregadas": stats.entregadas or 0,
        "por_cobrar_monto": float(stats.por_cobrar_monto or 0),
        "ordenes_por_estado": [{"estado": r.nom_estado or "Sin estado", "cantidad": r.cantidad} for r in estados_prod],
        "top_clientes": [{"nombre": r.nombre_user, "ordenes": r.total_ordenes, "monto": float(r.monto_total)} for r in top],
    }


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_orden(
    orden: OrdenIn,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Reglas: cliente y tarifa vigentes; factura generada automáticamente."""
    cli = db.execute(text('SELECT id_cli FROM "Personas"."Clientes" WHERE id_cli=:i AND activo=TRUE'), {"i": orden.id_cli}).fetchone()
    if not cli:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "El cliente no existe o fue eliminado")
    tar = db.execute(text('SELECT pre_tarif FROM "Finanzas"."Tarifas" WHERE id_tarif=:i AND activo=TRUE'), {"i": orden.id_tarif}).fetchone()
    if not tar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La tarifa no existe o fue eliminada")

    m2 = (orden.larcm_order * orden.ancm_order * orden.can_order) / 10000.0
    subtotal = round(m2 * float(tar.pre_tarif), 2)

    id_fac = db.execute(text('''
        INSERT INTO "Finanzas"."Factura" (id_cli, id_estado, mont_fac, fecc_fac, fece_fac)
        VALUES (:cli, 1, :mont, NOW(), NOW()) RETURNING id_fac
    '''), {"cli": orden.id_cli, "mont": subtotal}).scalar()

    id_order = db.execute(text('''
        INSERT INTO "Pedidos"."Ordenes"
          (id_fac, id_tarif, larcm_order, ancm_order, can_order, sub_order, id_estado, fec_creacion)
        VALUES (:fac, :tar, :l, :a, :c, :sub, :est, NOW()) RETURNING id_order
    '''), {"fac": id_fac, "tar": orden.id_tarif, "l": orden.larcm_order, "a": orden.ancm_order,
           "c": orden.can_order, "sub": subtotal, "est": orden.id_estado}).scalar()
    db.commit()
    return _pedido_completo(db, id_order)


@router.put("/{id_order}/dimensiones", response_model=dict)
def actualizar_dimensiones(
    id_order: int,
    orden: OrdenIn,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Regla: recalcula m², subtotal y monto de factura; prohibido si la factura está pagada."""
    o = _pedido_completo(db, id_order)
    if not o:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada o eliminada")
    if o["nom_estado_pago"] == "Pagada":
        raise HTTPException(status.HTTP_409_CONFLICT, "No se puede modificar una orden con factura pagada")
    m2 = (orden.larcm_order * orden.ancm_order * orden.can_order) / 10000.0
    subtotal = round(m2 * float(o["pre_tarif"]), 2)
    db.execute(text('''
        UPDATE "Pedidos"."Ordenes"
        SET larcm_order=:l, ancm_order=:a, can_order=:c, sub_order=:sub
        WHERE id_order=:i
    '''), {"l": orden.larcm_order, "a": orden.ancm_order, "c": orden.can_order, "sub": subtotal, "i": id_order})
    db.execute(text('UPDATE "Finanzas"."Factura" SET mont_fac=:m WHERE id_fac=:f'), {"m": subtotal, "f": o["id_fac"]})
    db.commit()
    return _pedido_completo(db, id_order)


@router.put("/{id_order}/estado-prod", response_model=dict)
def actualizar_estado_produccion(
    id_order: int,
    data: EstadoIn,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    o = _pedido_completo(db, id_order)
    if not o:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada o eliminada")
    existe = db.execute(text('SELECT 1 FROM "Pedidos"."EstadoPedido" WHERE id_estado=:e'), {"e": data.id_estado}).fetchone()
    if not existe:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Estado de producción inexistente")
    db.execute(text('UPDATE "Pedidos"."Ordenes" SET id_estado=:e WHERE id_order=:i'), {"e": data.id_estado, "i": id_order})
    db.commit()
    return {"detalle": "Estado de producción actualizado"}


@router.put("/{id_order}/estado-pago", response_model=dict)
def actualizar_estado_pago(
    id_order: int,
    data: EstadoIn,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Regla: al marcar Pagada se sella la fecha de pago efectiva."""
    o = _pedido_completo(db, id_order)
    if not o:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada o eliminada")
    if not o["id_fac"]:
        raise HTTPException(status.HTTP_409_CONFLICT, "La orden no tiene factura asociada")
    est = db.execute(text('SELECT nom_estado FROM "Finanzas"."EstadoFactura" WHERE id_estado=:e'), {"e": data.id_estado}).fetchone()
    if not est:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Estado de pago inexistente")
    if est.nom_estado == "Pagada":
        db.execute(text('UPDATE "Finanzas"."Factura" SET id_estado=:e, fece_fac=NOW() WHERE id_fac=:f'), {"e": data.id_estado, "f": o["id_fac"]})
    else:
        db.execute(text('UPDATE "Finanzas"."Factura" SET id_estado=:e WHERE id_fac=:f'), {"e": data.id_estado, "f": o["id_fac"]})
    db.commit()
    return {"detalle": f"Estado de pago: {est.nom_estado}"}


@router.delete("/{id_order}", response_model=dict)
def eliminar_orden(
    id_order: int,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    """Borrado LÓGICO en cascada suave. Regla: no se elimina orden con factura pagada."""
    o = _pedido_completo(db, id_order)
    if not o:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada o ya eliminada")
    if o["nom_estado_pago"] == "Pagada":
        raise HTTPException(status.HTTP_409_CONFLICT, "No se puede eliminar una orden ya pagada (integridad contable)")
    uid = _uid(usuario_actual)
    db.execute(text('UPDATE "Pedidos"."Ordenes" SET activo=FALSE, fec_eliminacion=NOW(), eliminado_por=:u WHERE id_order=:i'), {"u": uid, "i": id_order})
    if o["id_fac"]:
        db.execute(text('UPDATE "Finanzas"."Factura" SET activo=FALSE, fec_eliminacion=NOW(), eliminado_por=:u WHERE id_fac=:f'), {"u": uid, "f": o["id_fac"]})
    db.commit()
    return {"detalle": f"Orden #{id_order} eliminada lógicamente"}
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.core.database import get_db
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.get("/", response_model=List[dict])
def listar_ordenes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Lista todas las órdenes uniendo pedidos y facturas."""
    query = text('''
        SELECT
            o.id_order,
            o.id_fac,
            o.id_tarif,
            o.larcm_order,
            o.ancm_order,
            o.can_order,
            o.sub_order,
            o.id_estado AS id_estado_prod,
            o.fec_creacion,
            f.id_cli,
            f.id_estado AS id_estado_pago,
            f.mont_fac,
            f.fece_fac,
            c.nombre_user AS nombre_cliente,
            c.telf_user AS telf_cliente,
            ep.nom_estado AS nom_estado_prod,
            ef.nom_estado AS nom_estado_pago,
            t.tam_tarif,
            t.pre_tarif
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        LEFT JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        LEFT JOIN "Finanzas"."EstadoFactura" ef ON f.id_estado = ef.id_estado
        LEFT JOIN "Finanzas"."Tarifas" t ON o.id_tarif = t.id_tarif
        ORDER BY o.id_order DESC
        LIMIT :limit OFFSET :skip
    ''')
    
    result = db.execute(query, {"limit": limit, "skip": skip})
    rows = result.fetchall()
    
    ordenes = []
    for row in rows:
        m2 = (float(row.larcm_order) * float(row.ancm_order) * int(row.can_order)) / 10000.0
        ordenes.append({
            "id_order": row.id_order,
            "id_fac": row.id_fac,
            "id_cli": row.id_cli,
            "id_tarif": row.id_tarif,
            "larcm_order": float(row.larcm_order),
            "ancm_order": float(row.ancm_order),
            "can_order": int(row.can_order),
            "sub_order": float(row.sub_order) if row.sub_order else 0,
            "m2_total": m2,
            "id_estado_prod": row.id_estado_prod,
            "id_estado_pago": row.id_estado_pago,
            "mont_fac": float(row.mont_fac) if row.mont_fac else 0,
            "fec_creacion": row.fec_creacion.isoformat() if row.fec_creacion else None,
            "fece_fac": row.fece_fac.isoformat() if row.fece_fac else None,
            "nombre_cliente": row.nombre_cliente,
            "telf_cliente": row.telf_cliente,
            "nom_estado_prod": row.nom_estado_prod,
            "nom_estado_pago": row.nom_estado_pago,
            "tam_tarif": row.tam_tarif,
            "pre_tarif": float(row.pre_tarif) if row.pre_tarif else 0,
        })
    return ordenes

@router.get("/estados-produccion/")
def listar_estados_produccion(db: Session = Depends(get_db)):
    """Lista estados de producción."""
    query = text('SELECT id_estado, nom_estado FROM "Pedidos"."EstadoPedido" ORDER BY id_estado')
    return [{"id_estado": r.id_estado, "nom_estado": r.nom_estado} for r in db.execute(query).fetchall()]

@router.get("/estados-pago/")
def listar_estados_pago(db: Session = Depends(get_db)):
    """Lista estados de pago."""
    query = text('SELECT id_estado, nom_estado FROM "Finanzas"."EstadoFactura" ORDER BY id_estado')
    return [{"id_estado": r.id_estado, "nom_estado": r.nom_estado} for r in db.execute(query).fetchall()]

@router.put("/{id_order}/estado-prod")
def actualizar_estado_produccion(
    id_order: int,
    data: dict,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Actualiza el estado de producción."""
    id_estado = data.get("id_estado")
    if not id_estado:
        raise HTTPException(status_code=400, detail="id_estado requerido")
    
    db.execute(
        text('UPDATE "Pedidos"."Ordenes" SET id_estado = :id_estado WHERE id_order = :id_order'),
        {"id_estado": id_estado, "id_order": id_order}
    )
    db.commit()
    return {"message": "Estado de producción actualizado"}

@router.put("/{id_order}/estado-pago")
def actualizar_estado_pago(
    id_order: int,
    data: dict,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Actualiza el estado de pago."""
    id_estado = data.get("id_estado")
    if not id_estado:
        raise HTTPException(status_code=400, detail="id_estado requerido")
    
    # Obtener id_fac del pedido
    fac_result = db.execute(
        text('SELECT id_fac FROM "Pedidos"."Ordenes" WHERE id_order = :id_order'),
        {"id_order": id_order}
    ).fetchone()
    
    if not fac_result or not fac_result.id_fac:
        raise HTTPException(status_code=404, detail="Factura no encontrada para este pedido")
    
    db.execute(
        text('UPDATE "Finanzas"."Factura" SET id_estado = :id_estado WHERE id_fac = :id_fac'),
        {"id_estado": id_estado, "id_fac": fac_result.id_fac}
    )
    db.commit()
    return {"message": "Estado de pago actualizado"}

@router.get("/estadisticas")
def obtener_estadisticas(
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Obtiene estadísticas generales para el Dashboard."""
    
    # 1. KPIs Generales
    stats = db.execute(text('''
        SELECT 
            COUNT(o.id_order) as total_ordenes,
            COALESCE(SUM(o.sub_order), 0) as ingresos_totales,
            COUNT(CASE WHEN ep.nom_estado = 'Entregado' THEN 1 END) as entregadas,
            COALESCE(SUM(CASE WHEN ef.nom_estado = 'Pendiente' THEN o.sub_order ELSE 0 END), 0) as por_cobrar_monto
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        LEFT JOIN "Finanzas"."EstadoFactura" ef ON f.id_estado = ef.id_estado
    ''')).fetchone()
    
    # 2. Órdenes por Estado de Producción (para gráfico)
    estados_prod = db.execute(text('''
        SELECT ep.nom_estado, COUNT(o.id_order) as cantidad
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        GROUP BY ep.nom_estado
        ORDER BY cantidad DESC
    ''')).fetchall()
    
    # 3. Top 3 Clientes
    top_clientes = db.execute(text('''
        SELECT c.nombre_user, COUNT(o.id_order) as total_ordenes, COALESCE(SUM(o.sub_order), 0) as monto_total
        FROM "Pedidos"."Ordenes" o
        JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        GROUP BY c.nombre_user
        ORDER BY total_ordenes DESC
        LIMIT 3
    ''')).fetchall()
    
    return {
        "total_ordenes": stats.total_ordenes or 0,
        "ingresos_totales": float(stats.ingresos_totales or 0),
        "entregadas": stats.entregadas or 0,
        "por_cobrar_monto": float(stats.por_cobrar_monto or 0),
        "ordenes_por_estado": [{"estado": row.nom_estado or 'Sin estado', "cantidad": row.cantidad} for row in estados_prod],
        "top_clientes": [{"nombre": row.nombre_user, "ordenes": row.total_ordenes, "monto": float(row.monto_total)} for row in top_clientes]
    }
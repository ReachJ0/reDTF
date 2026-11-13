from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.core.database import get_db
from app.schemas.pedidos import PedidoCreate, PedidoResponse, PedidoUpdate, EstadoPedidoResponse
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

@router.post("/", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    pedido: PedidoCreate,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Crea un nuevo pedido con cálculo automático de m² y precio."""
    # Calcular m² y subtotal
    m2 = (pedido.larcm_order * pedido.ancm_order * pedido.can_order) / 10000.0
    
    # Obtener precio de la tarifa
    tarifa_query = text('SELECT pre_tarif FROM "Finanzas"."Tarifas" WHERE id_tarif = :id_tarif')
    tarifa_result = db.execute(tarifa_query, {"id_tarif": pedido.id_tarif}).fetchone()
    
    if not tarifa_result:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    
    subtotal = m2 * float(tarifa_result.pre_tarif)
    
    # Insertar pedido
    insert_query = text('''
        INSERT INTO "Pedidos"."Ordenes" 
        (id_order, id_cli, id_tarif, larcm_order, ancm_order, can_order, sub_order, id_estado)
        VALUES 
        ((SELECT COALESCE(MAX(id_order), 0) + 1 FROM "Pedidos"."Ordenes"), 
         :id_cli, :id_tarif, :larcm, :ancm, :can, :sub, :id_estado)
        RETURNING id_order
    ''')
    
    result = db.execute(insert_query, {
        "id_cli": pedido.id_cli,
        "id_tarif": pedido.id_tarif,
        "larcm": pedido.larcm_order,
        "ancm": pedido.ancm_order,
        "can": pedido.can_order,
        "sub": subtotal,
        "id_estado": pedido.id_estado or 1
    })
    
    db.commit()
    id_order = result.scalar()
    
    # Obtener el pedido completo con JOIN
    return obtener_pedido_por_id(db, id_order)

@router.get("/", response_model=List[PedidoResponse])
def listar_pedidos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Lista todos los pedidos con información relacionada."""
    query = text('''
        SELECT 
            o.id_order,
            o.id_cli,
            o.id_tarif,
            o.id_fac,
            o.larcm_order,
            o.ancm_order,
            o.can_order,
            o.sub_order,
            o.id_estado,
            o.fec_creacion,
            c.nombre_user AS nombre_cliente,
            c.telf_user AS telf_cliente,
            e.nom_estado,
            t.tam_tarif,
            t.pre_tarif
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Personas"."Clientes" c ON o.id_cli = c.id_cli
        LEFT JOIN "Pedidos"."EstadoPedido" e ON o.id_estado = e.id_estado
        LEFT JOIN "Finanzas"."Tarifas" t ON o.id_tarif = t.id_tarif
        ORDER BY o.id_order DESC
        LIMIT :limit OFFSET :skip
    ''')
    
    result = db.execute(query, {"limit": limit, "skip": skip})
    rows = result.fetchall()
    
    pedidos = []
    for row in rows:
        m2 = (float(row.larcm_order) * float(row.ancm_order) * int(row.can_order)) / 10000.0
        pedidos.append({
            "id_order": row.id_order,
            "id_cli": row.id_cli,
            "id_tarif": row.id_tarif,
            "id_fac": row.id_fac,
            "larcm_order": float(row.larcm_order),
            "ancm_order": float(row.ancm_order),
            "can_order": int(row.can_order),
            "sub_order": float(row.sub_order) if row.sub_order else 0,
            "m2_total": m2,
            "id_estado": row.id_estado,
            "fec_creacion": row.fec_creacion.isoformat() if row.fec_creacion else None,
            "nombre_cliente": row.nombre_cliente,
            "telf_cliente": row.telf_cliente,
            "nom_estado": row.nom_estado,
            "tam_tarif": row.tam_tarif,
            "pre_tarif": float(row.pre_tarif) if row.pre_tarif else 0,
        })
    return pedidos

@router.get("/{id_order}", response_model=PedidoResponse)
def obtener_pedido(
    id_order: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Obtiene un pedido específico."""
    pedido = obtener_pedido_por_id(db, id_order)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido

@router.put("/{id_order}", response_model=PedidoResponse)
def actualizar_pedido(
    id_order: int,
    pedido: PedidoUpdate,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Actualiza un pedido existente."""
    update_fields = []
    params = {"id_order": id_order}
    
    if pedido.id_estado is not None:
        update_fields.append("id_estado = :id_estado")
        params["id_estado"] = pedido.id_estado
    
    if pedido.larcm_order is not None:
        update_fields.append("larcm_order = :larcm")
        params["larcm"] = pedido.larcm_order
    
    if pedido.ancm_order is not None:
        update_fields.append("ancm_order = :ancm")
        params["ancm"] = pedido.ancm_order
    
    if pedido.can_order is not None:
        update_fields.append("can_order = :can")
        params["can"] = pedido.can_order
    
    if not update_fields:
        return obtener_pedido_por_id(db, id_order)
    
    update_query = text(f'''
        UPDATE "Pedidos"."Ordenes"
        SET {', '.join(update_fields)}
        WHERE id_order = :id_order
    ''')
    
    db.execute(update_query, params)
    db.commit()
    
    return obtener_pedido_por_id(db, id_order)

@router.delete("/{id_order}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_pedido(
    id_order: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Elimina un pedido."""
    delete_query = text('DELETE FROM "Pedidos"."Ordenes" WHERE id_order = :id_order')
    result = db.execute(delete_query, {"id_order": id_order})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return None

@router.get("/estados/", response_model=List[EstadoPedidoResponse])
def listar_estados_pedido(
    db: Session = Depends(get_db)
):
    """Lista todos los estados de pedido disponibles."""
    query = text('SELECT id_estado, nom_estado FROM "Pedidos"."EstadoPedido" ORDER BY id_estado')
    result = db.execute(query).fetchall()
    
    return [
        {"id_estado": row.id_estado, "nom_estado": row.nom_estado}
        for row in result
    ]

def obtener_pedido_por_id(db: Session, id_order: int):
    """Función auxiliar para obtener un pedido con JOIN."""
    query = text('''
        SELECT 
            o.id_order,
            o.id_cli,
            o.id_tarif,
            o.id_fac,
            o.larcm_order,
            o.ancm_order,
            o.can_order,
            o.sub_order,
            o.id_estado,
            o.fec_creacion,
            c.nombre_user AS nombre_cliente,
            c.telf_user AS telf_cliente,
            e.nom_estado,
            t.tam_tarif,
            t.pre_tarif
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Personas"."Clientes" c ON o.id_cli = c.id_cli
        LEFT JOIN "Pedidos"."EstadoPedido" e ON o.id_estado = e.id_estado
        LEFT JOIN "Finanzas"."Tarifas" t ON o.id_tarif = t.id_tarif
        WHERE o.id_order = :id_order
    ''')
    
    result = db.execute(query, {"id_order": id_order})
    row = result.fetchone()
    
    if not row:
        return None
    
    m2 = (float(row.larcm_order) * float(row.ancm_order) * int(row.can_order)) / 10000.0
    
    return {
        "id_order": row.id_order,
        "id_cli": row.id_cli,
        "id_tarif": row.id_tarif,
        "id_fac": row.id_fac,
        "larcm_order": float(row.larcm_order),
        "ancm_order": float(row.ancm_order),
        "can_order": int(row.can_order),
        "sub_order": float(row.sub_order) if row.sub_order else 0,
        "m2_total": m2,
        "id_estado": row.id_estado,
        "fec_creacion": row.fec_creacion.isoformat() if row.fec_creacion else None,
        "nombre_cliente": row.nombre_cliente,
        "telf_cliente": row.telf_cliente,
        "nom_estado": row.nom_estado,
        "tam_tarif": row.tam_tarif,
        "pre_tarif": float(row.pre_tarif) if row.pre_tarif else 0,
    }
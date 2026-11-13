from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.usuarios import obtener_usuario_actual
from app.core.database import get_db
from app.schemas.facturas import FacturaCreate, FacturaResponse, FacturaUpdate, EstadoFacturaResponse

router = APIRouter()

@router.get("/facturas/", response_model=List[FacturaResponse])
def listar_facturas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Lista todas las facturas con información del cliente y estado."""
    query = text('''
        SELECT 
            f.id_fac,
            f.id_cli,
            f.id_estado,
            f.mont_fac,
            f.fecc_fac,
            f.fece_fac,
            c.nombre_user AS nombre_cliente,
            c.telf_user AS telf_cliente,
            e.nom_estado
        FROM "Finanzas"."Factura" f
        LEFT JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        LEFT JOIN "Finanzas"."EstadoFactura" e ON f.id_estado = e.id_estado
        ORDER BY f.id_fac DESC
        LIMIT :limit OFFSET :skip
    ''')
    
    result = db.execute(query, {"limit": limit, "skip": skip})
    rows = result.fetchall()
    
    facturas = []
    for row in rows:
        facturas.append({
            "id_fac": row.id_fac,
            "id_cli": row.id_cli,
            "id_estado": row.id_estado,
            "mont_fac": float(row.mont_fac) if row.mont_fac else 0,
            "fecc_fac": row.fecc_fac.isoformat() if row.fecc_fac else None,
            "fece_fac": row.fece_fac.isoformat() if row.fece_fac else None,
            "nombre_cliente": row.nombre_cliente,
            "telf_cliente": row.telf_cliente,
            "nom_estado": row.nom_estado,
        })
    return facturas

@router.get("/facturas/{id_fac}", response_model=FacturaResponse)
def obtener_factura(
    id_fac: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Obtiene una factura específica."""
    query = text('''
        SELECT 
            f.id_fac, f.id_cli, f.id_estado, f.mont_fac,
            f.fecc_fac, f.fece_fac,
            c.nombre_user AS nombre_cliente,
            c.telf_user AS telf_cliente,
            e.nom_estado
        FROM "Finanzas"."Factura" f
        LEFT JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        LEFT JOIN "Finanzas"."EstadoFactura" e ON f.id_estado = e.id_estado
        WHERE f.id_fac = :id_fac
    ''')
    
    result = db.execute(query, {"id_fac": id_fac})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    return {
        "id_fac": row.id_fac,
        "id_cli": row.id_cli,
        "id_estado": row.id_estado,
        "mont_fac": float(row.mont_fac) if row.mont_fac else 0,
        "fecc_fac": row.fecc_fac.isoformat() if row.fecc_fac else None,
        "fece_fac": row.fece_fac.isoformat() if row.fece_fac else None,
        "nombre_cliente": row.nombre_cliente,
        "telf_cliente": row.telf_cliente,
        "nom_estado": row.nom_estado,
    }

@router.post("/facturas/", response_model=FacturaResponse, status_code=status.HTTP_201_CREATED)
def crear_factura(
    factura: FacturaCreate,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Crea una nueva factura."""
    import datetime
    
    insert_query = text('''
        INSERT INTO "Finanzas"."Factura" 
        (id_fac, id_cli, id_estado, mont_fac, fecc_fac, fece_fac)
        VALUES 
        ((SELECT COALESCE(MAX(id_fac), 0) + 1 FROM "Finanzas"."Factura"), 
         :id_cli, :id_estado, :mont_fac, :fecc_fac, :fece_fac)
        RETURNING id_fac
    ''')
    
    ahora = factura.fecc_fac or datetime.datetime.now()
    
    result = db.execute(insert_query, {
        "id_cli": factura.id_cli,
        "id_estado": factura.id_estado or 1,
        "mont_fac": factura.mont_fac,
        "fecc_fac": ahora,
        "fece_fac": factura.fece_fac or ahora
    })
    
    db.commit()
    id_fac = result.scalar()
    
    return obtener_factura(id_fac, db, usuario_actual)

@router.put("/facturas/{id_fac}", response_model=FacturaResponse)
def actualizar_factura(
    id_fac: int,
    factura: FacturaUpdate,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Actualiza una factura."""
    update_fields = []
    params = {"id_fac": id_fac}
    
    if factura.id_estado is not None:
        update_fields.append("id_estado = :id_estado")
        params["id_estado"] = factura.id_estado
    
    if factura.mont_fac is not None:
        update_fields.append("mont_fac = :mont_fac")
        params["mont_fac"] = factura.mont_fac
    
    if factura.fece_fac is not None:
        update_fields.append("fece_fac = :fece_fac")
        params["fece_fac"] = factura.fece_fac
    
    if not update_fields:
        return obtener_factura(id_fac, db, usuario_actual)
    
    update_query = text(f'''
        UPDATE "Finanzas"."Factura"
        SET {', '.join(update_fields)}
        WHERE id_fac = :id_fac
    ''')
    
    db.execute(update_query, params)
    db.commit()
    
    return obtener_factura(id_fac, db, usuario_actual)

@router.delete("/facturas/{id_fac}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_factura(
    id_fac: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(obtener_usuario_actual)
):
    """Elimina una factura."""
    delete_query = text('DELETE FROM "Finanzas"."Factura" WHERE id_fac = :id_fac')
    result = db.execute(delete_query, {"id_fac": id_fac})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return None

@router.get("/estados-factura/", response_model=List[EstadoFacturaResponse])
def listar_estados_factura(
    db: Session = Depends(get_db)
):
    """Lista todos los estados de factura disponibles."""
    query = text('SELECT id_estado, nom_estado FROM "Finanzas"."EstadoFactura" ORDER BY id_estado')
    result = db.execute(query).fetchall()
    
    return [
        {"id_estado": row.id_estado, "nom_estado": row.nom_estado}
        for row in result
    ]
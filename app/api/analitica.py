from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.finanzas import Factura
import pandas as pd
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/resumen-ventas")
def obtener_resumen_ventas(db: Session = Depends(get_db)):
    # Extraer datos de la BD
    query = db.query(Factura.fecc_fac, Factura.mont_fac).all()
    
    # Convertir a DataFrame de Pandas
    df = pd.DataFrame(query, columns=['fecha', 'monto'])
    df['fecha'] = pd.to_datetime(df['fecha'])
    df.set_index('fecha', inplace=True)
    
    # Agrupar por mes
    ventas_mensuales = df.resample('M').sum().reset_index()
    ventas_mensuales['fecha'] = ventas_mensuales['fecha'].dt.strftime('%Y-%m')
    
    # Retornar JSON listo para que el Frontend lo grafique
    return {
        "total_ventas": float(df['monto'].sum()),
        "promedio_mensual": float(df['monto'].mean()),
        "detalle_mensual": ventas_mensuales.to_dict(orient='records')
    }

@router.get("/clientes-segmentados")
def segmentar_clientes(db: Session = Depends(get_db)):
# agrupar clientes por frecuencia y monto de compra.
    return {"mensaje": "Lógica de clustering en desarrollo"}
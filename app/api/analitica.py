from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

router = APIRouter()

@router.get("/dashboard-general")
def obtener_dashboard_general(db: Session = Depends(get_db)):
    # Ventas Totales y Promedio
    query_ventas = text('SELECT SUM(mont_fac) as total, AVG(mont_fac) as promedio FROM "Finanzas"."Factura"')
    result_ventas = db.execute(query_ventas).fetchone()
    
    # Uso de Material Estimado (Ordenes) en metros cuadrados
    query_material = text('''
        SELECT SUM((larcm_order * ancm_order * can_order) / 10000.0) as metros_cuadrados 
        FROM "Pedidos"."Ordenes"
    ''')
    result_material = db.execute(query_material).fetchone()

    # Top 5 Clientes por gasto
    query_top_clientes = text('''
        SELECT c.nombre_user, SUM(f.mont_fac) as total_gastado
        FROM "Finanzas"."Factura" f
        JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        GROUP BY c.nombre_user
        ORDER BY total_gastado DESC
        LIMIT 5
    ''')
    top_clientes = db.execute(query_top_clientes).fetchall()

    return {
        "ventas": {
            "total": float(result_ventas.total or 0),
            "promedio_por_factura": float(result_ventas.promedio or 0)
        },
        "material_estimado_consumido_m2": float(result_material.metros_cuadrados or 0),
        "top_clientes": [
            {"nombre": row.nombre_user, "total_gastado": float(row.total_gastado)} 
            for row in top_clientes
        ]
    }

@router.get("/prediccion-ventas")
def predecir_ventas_futuras(db: Session = Depends(get_db)):
    query_historial = text('''
        SELECT DATE_TRUNC('month', fecc_fac) as mes, SUM(mont_fac) as total
        FROM "Finanzas"."Factura"
        GROUP BY DATE_TRUNC('month', fecc_fac)
        ORDER BY mes ASC
    ''')
    historial = db.execute(query_historial).fetchall()
    
    if len(historial) < 2:
        raise HTTPException(status_code=404, detail="No hay suficientes datos históricos (mínimo 2 meses) para realizar una predicción.")

    df = pd.DataFrame(historial, columns=['mes', 'total'])
    df['mes_num'] = np.arange(len(df))
    
    X = df[['mes_num']]
    y = df['total']
    model = LinearRegression()
    model.fit(X, y)
    
    next_mes_num = len(df)
    prediccion = model.predict(pd.DataFrame({'mes_num': [next_mes_num]}))[0]
    
    tendencia = "Alza 📈" if model.coef_[0] > 50 else "Baja 📉" if model.coef_[0] < -50 else "Estable ➡️"

    historial_formateado = df[['mes', 'total']].copy()
    historial_formateado['mes'] = historial_formateado['mes'].dt.strftime('%Y-%m')
    
    return {
        "prediccion_proximo_mes": round(float(prediccion), 2),
        "tendencia_actual": tendencia,
        "historial": historial_formateado.to_dict(orient='records')
    }
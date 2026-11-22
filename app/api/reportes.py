import os
from datetime import datetime
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

try:
    import openpyxl
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
    EXCEL_OK, EXCEL_ERR = True, ""
except ImportError as e:  # pragma: no cover
    EXCEL_OK, EXCEL_ERR = False, str(e)

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    PDF_OK, PDF_ERR = True, ""
except ImportError as e:  # pragma: no cover
    PDF_OK, PDF_ERR = False, str(e)

from app.core.database import get_db
from app.api.usuarios import obtener_usuario_actual

router = APIRouter()

EMPRESA = {
    "nombre": os.getenv("EMPRESA_NOMBRE", "ReDTF Print Studio"),
    "rif": os.getenv("EMPRESA_RIF", "J-40291837-5"),
    "telefono": os.getenv("EMPRESA_TELEFONO", "+58 414 123 4567"),
    "direccion": os.getenv("EMPRESA_DIRECCION", "Av. Principal, Local 12 · Caracas"),
}
VIOLETA = "6D28D9"
VIOLETA_CLARO = "EDE9FE"


def _f(x) -> float:
    """Decimal/None -> float seguro."""
    try:
        return float(x or 0)
    except Exception:
        return 0.0


def _fecha(x, fmt="%d/%m/%Y") -> str:
    try:
        return x.strftime(fmt) if x else "-"
    except Exception:
        return "-"


def _periodo_txt(desde, hasta):
    return f"{desde or 'inicio'} → {hasta or 'hoy'}"


def _ordenes(db: Session, desde: Optional[str], hasta: Optional[str]):
    where, params = ["o.activo = TRUE"], {}
    if desde:
        where.append("o.fec_creacion >= CAST(:desde AS timestamp)"); params["desde"] = desde
    if hasta:
        where.append("o.fec_creacion < CAST(:hasta AS timestamp) + INTERVAL '1 day'"); params["hasta"] = hasta
    sql = f'''
        SELECT o.id_order, o.fec_creacion, c.nombre_user AS cliente, c.telf_user AS telefono,
               t.tam_tarif, o.larcm_order, o.ancm_order, o.can_order, o.sub_order,
               (o.larcm_order * o.ancm_order * o.can_order) / 10000.0 AS m2,
               o.id_fac, ep.nom_estado AS produccion, ef.nom_estado AS pago, f.mont_fac
        FROM "Pedidos"."Ordenes" o
        LEFT JOIN "Finanzas"."Factura" f ON o.id_fac = f.id_fac
        LEFT JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        LEFT JOIN "Pedidos"."EstadoPedido" ep ON o.id_estado = ep.id_estado
        LEFT JOIN "Finanzas"."EstadoFactura" ef ON f.id_estado = ef.id_estado
        LEFT JOIN "Finanzas"."Tarifas" t ON o.id_tarif = t.id_tarif
        WHERE {" AND ".join(where)}
        ORDER BY o.id_order
    '''
    return db.execute(text(sql), params).fetchall()


def _libro_base(titulo: str, periodo: str):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Reporte"
    ws["A1"] = EMPRESA["nombre"]
    ws["A1"].font = Font(bold=True, size=16, color="FFFFFF")
    ws["A1"].fill = PatternFill(patternType="solid", fgColor=VIOLETA)
    ws["A2"] = titulo
    ws["A2"].font = Font(bold=True, size=12, color=VIOLETA)
    ws["A3"] = f"Período: {periodo} · Generado: {datetime.now():%d/%m/%Y %H:%M}"
    ws["A3"].font = Font(italic=True, size=9, color="6B7280")
    return wb, ws


def _encabezados(ws, fila, cols):
    for i, (nombre, ancho) in enumerate(cols, start=1):
        c = ws.cell(row=fila, column=i, value=nombre)
        c.font = Font(bold=True, color="FFFFFF", size=10)
        c.fill = PatternFill(patternType="solid", fgColor=VIOLETA)
        c.alignment = Alignment(horizontal="center", vertical="center")
        ws.column_dimensions[get_column_letter(i)].width = ancho
    ws.freeze_panes = ws.cell(row=fila + 1, column=1)


def _respuesta(wb, nombre: str):
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{nombre}_{datetime.now():%Y%m%d}.xlsx"'},
    )


@router.get("/excel")
def reporte_excel(
    tipo: str = Query("ordenes", pattern="^(ordenes|clientes|tarifas)$"),
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    if not EXCEL_OK:
        raise HTTPException(501, f"Falta instalar openpyxl en el backend: pip install openpyxl ({EXCEL_ERR})")
    try:
        wb, ws = _libro_base(f"Reporte de {tipo.upper()}", _periodo_txt(desde, hasta))
        fila = 5

        if tipo == "ordenes":
            cols = [("ID", 8), ("Fecha", 12), ("Cliente", 24), ("Teléfono", 16), ("Tarifa", 18),
                    ("Largo", 8), ("Ancho", 8), ("Cant", 7), ("m²", 10), ("Subtotal", 12),
                    ("Factura", 9), ("Producción", 14), ("Pago", 12)]
            _encabezados(ws, fila, cols)
            r = fila + 1
            tot_sub = tot_m2 = 0.0
            for o in _ordenes(db, desde, hasta):
                m2, sub = _f(o.m2), _f(o.sub_order)
                ws.append([
                    o.id_order, _fecha(o.fec_creacion), o.cliente or "-", o.telefono or "-", o.tam_tarif or "-",
                    _f(o.larcm_order), _f(o.ancm_order), int(o.can_order or 0),
                    m2, sub, o.id_fac or "-", o.produccion or "-", o.pago or "-",
                ])
                ws.cell(row=r, column=9).number_format = "0.0000"
                ws.cell(row=r, column=10).number_format = "#,##0.00"
                tot_sub += sub; tot_m2 += m2
                r += 1
            ws.append(["", "", "", "", "", "", "", "", tot_m2, tot_sub, "", "TOTAL", ""])
            for c in range(1, len(cols) + 1):
                cell = ws.cell(row=r, column=c)
                cell.font = Font(bold=True, color=VIOLETA)
                cell.fill = PatternFill(patternType="solid", fgColor=VIOLETA_CLARO)
            ws.cell(row=r, column=9).number_format = "0.0000"
            ws.cell(row=r, column=10).number_format = "#,##0.00"
            ws.auto_filter.ref = f"A{fila}:{get_column_letter(len(cols))}{max(r - 1, fila + 1)}"

        elif tipo == "clientes":
            cols = [("ID", 8), ("Cliente", 30), ("Teléfono", 16), ("Órdenes", 10), ("Total facturado", 16), ("Vigente", 10)]
            _encabezados(ws, fila, cols)
            rows = db.execute(text('''
                SELECT c.id_cli, c.nombre_user, c.telf_user, c.activo,
                       (SELECT COUNT(*) FROM "Pedidos"."Ordenes" o JOIN "Finanzas"."Factura" f ON o.id_fac=f.id_fac
                         WHERE f.id_cli=c.id_cli AND o.activo=TRUE) AS n,
                       (SELECT COALESCE(SUM(o.sub_order),0) FROM "Pedidos"."Ordenes" o JOIN "Finanzas"."Factura" f ON o.id_fac=f.id_fac
                         WHERE f.id_cli=c.id_cli AND o.activo=TRUE) AS total
                FROM "Personas"."Clientes" c ORDER BY c.nombre_user
            ''')).fetchall()
            r = fila + 1
            for c in rows:
                ws.append([c.id_cli, c.nombre_user, c.telf_user or "-", int(c.n or 0), _f(c.total), "Sí" if c.activo else "No"])
                ws.cell(row=r, column=5).number_format = "#,##0.00"
                r += 1
            ws.auto_filter.ref = f"A{fila}:{get_column_letter(len(cols))}{max(r - 1, fila + 1)}"

        else:
            cols = [("ID", 8), ("Tarifa", 26), ("Precio/m²", 12), ("Órdenes vigentes", 16), ("Ingreso generado", 16)]
            _encabezados(ws, fila, cols)
            rows = db.execute(text('''
                SELECT t.id_tarif, t.tam_tarif, t.pre_tarif,
                       (SELECT COUNT(*) FROM "Pedidos"."Ordenes" o WHERE o.id_tarif=t.id_tarif AND o.activo=TRUE) AS n,
                       (SELECT COALESCE(SUM(o.sub_order),0) FROM "Pedidos"."Ordenes" o WHERE o.id_tarif=t.id_tarif AND o.activo=TRUE) AS ing
                FROM "Finanzas"."Tarifas" t WHERE t.activo=TRUE ORDER BY ing DESC
            ''')).fetchall()
            r = fila + 1
            for t in rows:
                ws.append([t.id_tarif, t.tam_tarif, _f(t.pre_tarif), int(t.n or 0), _f(t.ing)])
                ws.cell(row=r, column=3).number_format = "#,##0.00"
                ws.cell(row=r, column=5).number_format = "#,##0.00"
                r += 1
            ws.auto_filter.ref = f"A{fila}:{get_column_letter(len(cols))}{max(r - 1, fila + 1)}"

        return _respuesta(wb, f"reporte_{tipo}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error generando Excel: {type(e).__name__}: {e}")


@router.get("/pdf")
def reporte_pdf(
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    if not PDF_OK:
        raise HTTPException(501, f"Falta instalar reportlab en el backend: pip install reportlab ({PDF_ERR})")
    try:
        rows = _ordenes(db, desde, hasta)
        total = sum(_f(r.sub_order) for r in rows)
        pagado = sum(_f(r.mont_fac) for r in rows if r.pago == "Pagada")
        por_cobrar = sum(_f(r.mont_fac) for r in rows if r.pago == "Pendiente")

        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=1.5 * cm, rightMargin=1.5 * cm,
                                topMargin=1.8 * cm, bottomMargin=1.8 * cm, title="Reporte de Órdenes ReDTF")
        styles = getSampleStyleSheet()
        st_titulo = ParagraphStyle("tit", parent=styles["Title"], textColor=colors.HexColor("#6D28D9"), fontSize=18, spaceAfter=2)
        st_sub = ParagraphStyle("sub", parent=styles["Normal"], textColor=colors.HexColor("#6B7280"), fontSize=9)

        elems = [
            Paragraph(EMPRESA["nombre"], st_titulo),
            Paragraph(f"{EMPRESA['rif']} · {EMPRESA['telefono']} · {EMPRESA['direccion']}", st_sub),
            Spacer(1, 0.4 * cm),
            Paragraph(f"<b>Reporte de ordenes</b> · Período: {_periodo_txt(desde, hasta)} · Generado: {datetime.now():%d/%m/%Y %H:%M}", st_sub),
            Spacer(1, 0.5 * cm),
        ]

        kpi = Table(
            [["Órdenes", "Ingresos", "Cobrado", "Por cobrar"],
             [str(len(rows)), f"${total:,.2f}", f"${pagado:,.2f}", f"${por_cobrar:,.2f}"]],
            colWidths=[4.0 * cm] * 4,
        )
        kpi.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6D28D9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#EDE9FE")),
            ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 1), (-1, 1), 11),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#6D28D9")),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C4B5FD")),
        ]))
        elems += [kpi, Spacer(1, 0.6 * cm)]

        data = [["ID", "Fecha", "Cliente", "Tarifa", "Cant", "m2", "Subtotal", "Producción", "Pago"]]
        for r in rows:
            data.append([
                str(r.id_order), _fecha(r.fec_creacion, "%d/%m/%y"), (r.cliente or "-")[:28],
                (r.tam_tarif or "-")[:20], str(int(r.can_order or 0)), f"{_f(r.m2):.2f}",
                f"${_f(r.sub_order):,.2f}", (r.produccion or "-")[:12], (r.pago or "-")[:10],
            ])
        data.append(["", "", "", "", "", "TOTAL", f"${total:,.2f}", "", ""])
        tbl = Table(data, repeatRows=1,
                    colWidths=[1.1 * cm, 1.8 * cm, 3.6 * cm, 3.0 * cm, 1.0 * cm, 1.3 * cm, 2.1 * cm, 2.6 * cm, 1.9 * cm])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6D28D9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("ALIGN", (4, 1), (6, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F5F3FF")]),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EDE9FE")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.HexColor("#6D28D9")),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#DDD6FE")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elems.append(tbl)

        def pie(canv, d):
            canv.saveState()
            canv.setFont("Helvetica-Oblique", 8)
            canv.setFillColor(colors.HexColor("#6B7280"))
            canv.drawString(1.5 * cm, 1.0 * cm, f"{EMPRESA['nombre']} · Reporte confidencial")
            canv.drawRightString(letter[0] - 1.5 * cm, 1.0 * cm, f"Página {d.page}")
            canv.restoreState()

        doc.build(elems, onFirstPage=pie, onLaterPages=pie)
        buf.seek(0)
        return StreamingResponse(
            buf, media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="reporte_ordenes_{datetime.now():%Y%m%d}.pdf"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error generando PDF: {type(e).__name__}: {e}")


@router.get("/mora")
def reporte_mora(
    dias: int = Query(15, ge=1),
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    rows = db.execute(text('''
        SELECT f.id_fac, c.nombre_user AS cliente, c.telf_user AS telefono, f.mont_fac, f.fecc_fac,
               EXTRACT(DAY FROM NOW() - f.fecc_fac)::int AS dias_transcurridos
        FROM "Finanzas"."Factura" f
        JOIN "Personas"."Clientes" c ON f.id_cli = c.id_cli
        JOIN "Finanzas"."EstadoFactura" e ON f.id_estado = e.id_estado
        WHERE f.activo = TRUE AND e.nom_estado = 'Pendiente'
          AND EXTRACT(DAY FROM NOW() - f.fecc_fac) > :dias
        ORDER BY dias_transcurridos DESC
    '''), {"dias": dias}).fetchall()
    return {
        "dias_limite": dias,
        "total_mora": sum(_f(r.mont_fac) for r in rows),
        "facturas": [
            {"id_fac": r.id_fac, "cliente": r.cliente, "telefono": r.telefono,
             "monto": _f(r.mont_fac), "emitida": r.fecc_fac.isoformat() if r.fecc_fac else None,
             "dias": r.dias_transcurridos}
            for r in rows
        ],
    }


@router.get("/rentabilidad")
def reporte_rentabilidad(
    db: Session = Depends(get_db),
    usuario_actual=Depends(obtener_usuario_actual),
):
    rows = db.execute(text('''
        SELECT t.tam_tarif, t.pre_tarif,
               COUNT(o.id_order) AS ordenes,
               COALESCE(SUM((o.larcm_order * o.ancm_order * o.can_order) / 10000.0), 0) AS m2,
               COALESCE(SUM(o.sub_order), 0) AS ingresos
        FROM "Finanzas"."Tarifas" t
        LEFT JOIN "Pedidos"."Ordenes" o ON o.id_tarif = t.id_tarif AND o.activo = TRUE
        WHERE t.activo = TRUE
        GROUP BY t.tam_tarif, t.pre_tarif
        ORDER BY ingresos DESC
    ''')).fetchall()
    return [
        {"tarifa": r.tam_tarif, "precio_m2": _f(r.pre_tarif), "ordenes": int(r.ordenes or 0),
         "m2": _f(r.m2), "ingresos": _f(r.ingresos)}
        for r in rows
    ]
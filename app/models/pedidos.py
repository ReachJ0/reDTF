from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.core.database import Base

class EstadoOrden(Base):
    __tablename__ = "Estado de la Orden"
    __table_args__ = {"schema": "Pedidos"}

    id_esta = Column(Integer, primary_key=True, index=True)
    nom_esta = Column(String(100), nullable=False)

class Orden(Base):
    __tablename__ = "Ordenes"
    __table_args__ = {"schema": "Pedidos"}

    id_order = Column(Integer, primary_key=True, index=True)
    id_fac = Column(Integer, ForeignKey("Finanzas.Factura.id_fac"), nullable=False)
    id_tarif = Column(Integer, ForeignKey("Finanzas.Tarifas.id_tarif"), nullable=False)
    larcm_order = Column(Numeric, nullable=False)
    ancm_order = Column(Numeric, nullable=False)
    can_order = Column(Integer, nullable=False)
    sub_order = Column(Numeric, nullable=False)
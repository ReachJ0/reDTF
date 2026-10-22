from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from app.core.database import Base

class Tarifa(Base):
    __tablename__ = "Tarifas"
    __table_args__ = {"schema": "Finanzas"}

    id_tarif = Column(Integer, primary_key=True, index=True)
    tam_tarif = Column(String(250), nullable=False)
    pre_tarif = Column(Numeric, nullable=False)

class Factura(Base):
    __tablename__ = "Factura"
    __table_args__ = {"schema": "Finanzas"}

    id_fac = Column(Integer, primary_key=True, index=True)
    id_cli = Column(Integer, ForeignKey("Personas.Clientes.id_cli"), nullable=False)
    id_esta = Column(Integer, ForeignKey("Pedidos.Estado de la Orden.id_esta"), nullable=False)
    mont_fac = Column(Numeric, nullable=False)
    fecc_fac = Column(DateTime, nullable=False)
    fece_fac = Column(DateTime, nullable=False)
    id_oper_Operadores = Column(Integer, ForeignKey("Personas.Operadores.id_oper"))
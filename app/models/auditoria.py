from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
import datetime

class Auditoria(Base):
    __tablename__ = "Auditoria"
    __table_args__ = {"schema": "public"}

    id_aud = Column(Integer, primary_key=True, index=True)
    action_aud = Column(String(250), nullable=False)
    table_aud = Column(String(150), nullable=False)
    regid_aud = Column(Integer, nullable=True)
    prev_aud = Column(String(400), nullable=True)
    new_aud = Column(String(400), nullable=True)
    fec_aud = Column(DateTime(timezone=True), server_default=func.now())
    id_user = Column(Integer, ForeignKey("Personas.Usuarios.id_user"), nullable=True)
    fec_aud = Column(DateTime(timezone=True), default=datetime.datetime.now)
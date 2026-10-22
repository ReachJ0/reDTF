from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Rol(Base):
    __tablename__ = "Roles"
    __table_args__ = {"schema": "Seguridad"}

    id_rol = Column(Integer, primary_key=True, index=True)
    nom_rol = Column(String(150), nullable=False)

    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "Usuarios"
    __table_args__ = {"schema": "Personas"}

    id_user = Column(Integer, primary_key=True, index=True)
    correo_user = Column(String(250), unique=True, nullable=False, index=True)
    hash_user = Column(String, nullable=False)
    id_rol = Column(Integer, ForeignKey("Seguridad.Roles.id_rol"), nullable=False)

    rol = relationship("Rol", back_populates="usuarios")

class Cliente(Base):
    __tablename__ = "Clientes"
    __table_args__ = {"schema": "Personas"}

    id_cli = Column(Integer, primary_key=True, index=True)
    nombre_user = Column(String(250), nullable=False)
    telf_user = Column(String(20), nullable=False)
    id_user_Usuarios = Column(Integer, ForeignKey("Personas.Usuarios.id_user"), unique=True)

class Operador(Base):
    __tablename__ = "Operadores"
    __table_args__ = {"schema": "Personas"}

    id_oper = Column(Integer, primary_key=True, index=True)
    nom_oper = Column(String(250), nullable=False)
    ape_oper = Column(String(250), nullable=False)
    ced_oper = Column(String(50), nullable=False)
    id_user_Usuarios = Column(Integer, ForeignKey("Personas.Usuarios.id_user"), unique=True)
from sqlalchemy.orm import Session
from app.models.usuarios import Usuario
from app.schemas.usuarios import UsuarioCreate
from app.core.seguridad import get_password_hash

def crear_usuario(db: Session, usuario: UsuarioCreate):
    #encriptracion de la contraseña
    hashed_password = get_password_hash(usuario.password)
    
    db_usuario = Usuario(
        correo_user=usuario.correo_user,
        hash_user=hashed_password,
        id_rol=usuario.id_rol
    )

    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    
    return db_usuario

#Busca todos los usuarios
def obtener_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Usuario).offset(skip).limit(limit).all()


def obtener_usuario_por_correo(db: Session, correo: str):
    #buscar un usuario por correo
    return db.query(Usuario).filter(Usuario.correo_user == correo).first()
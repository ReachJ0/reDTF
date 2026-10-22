from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List
import jwt

from app.core.database import get_db
from app.schemas.usuarios import UsuarioCreate, UsuarioResponse
from app.crud.usuarios import crear_usuario, obtener_usuarios, obtener_usuario_por_correo
from app.core.seguridad import verify_password, crear_token_acceso, SECRET_KEY, ALGORITHM

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/login")

def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    excepcion_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Desencriptamos el token usando nuestra clave secreta
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise excepcion_credenciales
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="El token ha expirado, inicia sesión de nuevo")
    except jwt.InvalidTokenError:
        raise excepcion_credenciales
    
    #verifica que el token exista en PostgreSQL
    usuario = obtener_usuario_por_correo(db, correo=correo)
    if usuario is None:
        raise excepcion_credenciales
    return usuario

@router.post("/", response_model=UsuarioResponse)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    return crear_usuario(db=db, usuario=usuario)

@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), usuario_actual = Depends(obtener_usuario_actual)):
    usuarios = obtener_usuarios(db, skip=skip, limit=limit)
    return usuarios

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = obtener_usuario_por_correo(db, correo=form_data.username)
    if not usuario or not verify_password(form_data.password, usuario.hash_user):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token_jwt = crear_token_acceso(data={"sub": usuario.correo_user})
    return {"access_token": token_jwt, "token_type": "bearer"}
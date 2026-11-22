import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session
import jwt

from app.core.database import get_db
from app.core.seguridad import verify_password, crear_token_acceso, SECRET_KEY, ALGORITHM, rol_de

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/login")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
ROLES_VALIDOS = ("admin", "operador")
TABLA = '"Personas"."Usuarios"'


def _hash(password: str) -> str:
    from app.core import seguridad as s
    fn = getattr(s, "get_password_hash", None) or getattr(s, "hash_password", None) or getattr(s, "generar_hash", None)
    if fn:
        return fn(password)
    from passlib.context import CryptContext
    return CryptContext(schemes=["bcrypt"], deprecated="auto").hash(password)


def _usuario_por_correo(db: Session, correo: str):
    return db.execute(text(f"SELECT * FROM {TABLA} WHERE correo_user = :c"), {"c": correo}).fetchone()


def _por_id(db: Session, id_user: int):
    return db.execute(text(f"SELECT * FROM {TABLA} WHERE id_user = :i"), {"i": id_user}).fetchone()


def _fila(r) -> dict:
    return {
        "id_user": r.id_user,
        "correo_user": r.correo_user,
        "id_rol": r.id_rol,
        "rol": rol_de(r),
        "activo": bool(getattr(r, "activo", True)),
        "fec_eliminacion": r.fec_eliminacion.isoformat() if getattr(r, "fec_eliminacion", None) else None,
        "eliminado_por": getattr(r, "eliminado_por", None),
    }


def _admins_activos(db: Session) -> int:
    return db.execute(text(f"""
        SELECT COUNT(*) FROM {TABLA}
        WHERE activo = TRUE AND (rol = 'admin' OR (rol IS NULL AND id_rol = 1))
    """)).scalar() or 0


def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    excepcion = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise excepcion
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="El token ha expirado, inicia sesión de nuevo")
    except jwt.InvalidTokenError:
        raise excepcion
    usuario = _usuario_por_correo(db, correo)
    if usuario is None:
        raise excepcion
    if not bool(getattr(usuario, "activo", True)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada: contacta al administrador")
    return usuario


def _solo_admin(usuario=Depends(obtener_usuario_actual)):
    if rol_de(usuario) != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acción restringida: requiere rol 'admin'")
    return usuario


class EmpleadoIn(BaseModel):
    correo_user: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=72)
    rol: str = Field(default="operador", pattern="^(admin|operador)$")

    @field_validator("correo_user")
    @classmethod
    def v_correo(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Correo inválido: usa el formato persona@dominio.com")
        return v


class EmpleadoUp(BaseModel):
    rol: Optional[str] = Field(default=None, pattern="^(admin|operador)$")
    activo: Optional[bool] = None


class PasswordIn(BaseModel):
    password: str = Field(min_length=6, max_length=72)


def _insertar_usuario(db: Session, correo: str, password: str, rol: str):
    """Insert tolerante a esquemas heredados: PK sin default y catálogo de roles incompleto."""
    id_rol = 1 if rol == "admin" else 2
    h = _hash(password)
    sin_id = f"INSERT INTO {TABLA} (correo_user, hash_user, id_rol, rol, activo) VALUES (:c, :h, :ir, :r, TRUE)"
    con_id = f"INSERT INTO {TABLA} (id_user, correo_user, hash_user, id_rol, rol, activo) VALUES (:i, :c, :h, :ir, :r, TRUE)"
    errores = []

    try:
        db.execute(text(sin_id), {"c": correo, "h": h, "ir": id_rol, "r": rol})
        db.commit()
        return
    except Exception as e:
        db.rollback()
        errores.append(f"intento 1: {type(e).__name__}: {e}")

    try:
        nxt = db.execute(text(f"SELECT COALESCE(MAX(id_user), 0) + 1 FROM {TABLA}")).scalar()
        db.execute(text(con_id), {"i": nxt, "c": correo, "h": h, "ir": id_rol, "r": rol})
        db.commit()
        return
    except Exception as e:
        db.rollback()
        errores.append(f"intento 2: {type(e).__name__}: {e}")

    try:
        prestado = db.execute(text(f"SELECT id_rol FROM {TABLA} WHERE id_rol IS NOT NULL LIMIT 1")).scalar()
        if prestado is None:
            raise RuntimeError("no hay id_rol de referencia en la tabla")
        db.execute(text(sin_id), {"c": correo, "h": h, "ir": prestado, "r": rol})
        db.commit()
        return
    except Exception as e:
        db.rollback()
        errores.append(f"intento 3: {type(e).__name__}: {e}")

    raise HTTPException(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "No se pudo crear la cuenta en la base de datos. " + " | ".join(errores),
    )


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = _usuario_por_correo(db, form_data.username.strip().lower())
    if not usuario or not verify_password(form_data.password, usuario.hash_user):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not bool(getattr(usuario, "activo", True)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada: contacta al administrador")
    token_jwt = crear_token_acceso(data={"sub": usuario.correo_user})
    return {"access_token": token_jwt, "token_type": "bearer", "correo": usuario.correo_user, "rol": rol_de(usuario)}


@router.get("/perfil")
def perfil(usuario_actual=Depends(obtener_usuario_actual)):
    return {"correo_user": usuario_actual.correo_user, "rol": rol_de(usuario_actual)}


@router.get("/", response_model=List[dict])
def listar_equipo(
    q: Optional[str] = None,
    rol: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(_solo_admin),
):
    where, params = ["1=1"], {}
    if q:
        where.append("correo_user ILIKE :q"); params["q"] = f"%{q}%"
    if rol in ROLES_VALIDOS:
        where.append("(rol = :rol OR (rol IS NULL AND id_rol = :idrol))")
        params["rol"] = rol; params["idrol"] = 1 if rol == "admin" else 2
    rows = db.execute(text(f"""
        SELECT * FROM {TABLA}
        WHERE {" AND ".join(where)}
        ORDER BY activo DESC, correo_user
    """), params).fetchall()
    return [_fila(r) for r in rows]


@router.get("/{id_user}", response_model=dict)
def obtener_miembro(id_user: int, db: Session = Depends(get_db), admin=Depends(_solo_admin)):
    r = _por_id(db, id_user)
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    return _fila(r)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_empleado(datos: EmpleadoIn, db: Session = Depends(get_db), admin=Depends(_solo_admin)):
    """Alta de empleado/operador (o admin). Registro público cerrado: solo un admin crea cuentas."""
    dup = db.execute(text(f"SELECT id_user FROM {TABLA} WHERE correo_user = :c AND activo = TRUE"), {"c": datos.correo_user}).fetchone()
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Ya existe una cuenta activa con {datos.correo_user}")
    _insertar_usuario(db, datos.correo_user, datos.password, datos.rol)
    db.execute(text(f"UPDATE {TABLA} SET rol = :r, activo = TRUE WHERE correo_user = :c"), {"r": datos.rol, "c": datos.correo_user})
    db.commit()
    return _fila(_usuario_por_correo(db, datos.correo_user))


@router.put("/{id_user}", response_model=dict)
def actualizar_miembro(id_user: int, datos: EmpleadoUp, db: Session = Depends(get_db), admin=Depends(_solo_admin)):
    r = _por_id(db, id_user)
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    es_admin_actual = rol_de(r) == "admin"
    pierde_admin = (datos.rol is not None and datos.rol != "admin") or (datos.activo is False)
    if es_admin_actual and pierde_admin:
        if r.id_user == admin.id_user:
            raise HTTPException(status.HTTP_409_CONFLICT, "No puedes degradar ni desactivar tu propia cuenta admin")
        if bool(getattr(r, "activo", True)) and _admins_activos(db) <= 1:
            raise HTTPException(status.HTTP_409_CONFLICT, "Debe quedar al menos un administrador activo en el sistema")
    campos, params = [], {"i": id_user}
    if datos.rol is not None:
        campos.append("rol = :r"); params["r"] = datos.rol
        campos.append("id_rol = :ir"); params["ir"] = 1 if datos.rol == "admin" else 2
    if datos.activo is not None:
        campos.append("activo = :a"); params["a"] = datos.activo
        if datos.activo:
            campos.append("fec_eliminacion = NULL"); campos.append("eliminado_por = NULL")
        else:
            campos.append("fec_eliminacion = NOW()"); campos.append("eliminado_por = :u"); params["u"] = admin.correo_user
    if not campos:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Envía al menos un campo: rol o activo")
    db.execute(text(f"UPDATE {TABLA} SET {', '.join(campos)} WHERE id_user = :i"), params)
    db.commit()
    return _fila(_por_id(db, id_user))


@router.put("/{id_user}/password", response_model=dict)
def restablecer_password(id_user: int, datos: PasswordIn, db: Session = Depends(get_db), admin=Depends(_solo_admin)):
    r = _por_id(db, id_user)
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    db.execute(text(f"UPDATE {TABLA} SET hash_user = :h WHERE id_user = :i"), {"h": _hash(datos.password), "i": id_user})
    db.commit()
    return {"detalle": f"Contraseña restablecida para {r.correo_user}"}


@router.delete("/{id_user}", response_model=dict)
def desactivar_miembro(id_user: int, db: Session = Depends(get_db), admin=Depends(_solo_admin)):
    """Borrado lógico de la cuenta: conserva historial y auditoría."""
    r = _por_id(db, id_user)
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    if r.id_user == admin.id_user:
        raise HTTPException(status.HTTP_409_CONFLICT, "No puedes eliminar tu propia cuenta")
    if rol_de(r) == "admin" and bool(getattr(r, "activo", True)) and _admins_activos(db) <= 1:
        raise HTTPException(status.HTTP_409_CONFLICT, "Debe quedar al menos un administrador activo")
    db.execute(text(f"""
        UPDATE {TABLA}
        SET activo = FALSE, fec_eliminacion = NOW(), eliminado_por = :u
        WHERE id_user = :i
    """), {"u": admin.correo_user, "i": id_user})
    db.commit()
    return {"detalle": f"Cuenta {r.correo_user} desactivada (borrado lógico)"}
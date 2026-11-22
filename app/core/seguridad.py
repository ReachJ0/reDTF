import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

#token config
SECRET_KEY = "clave_super_secreta_redtf_2026_produccion_segura_viva_el_IUT" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 #token dura 24 horas

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

#Crea el token con fecha de expiracion
def crear_token_acceso(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Generar el token usando los datos, la clave secreta y el algoritmo
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def rol_de(usuario) -> str:
    """Resuelve el rol del usuario: columna `rol` (migración) o fallback por id_rol."""
    r = getattr(usuario, "rol", None)
    if isinstance(r, str) and r.strip():
        return r.strip().lower()
    id_rol = getattr(usuario, "id_rol", None)
    if id_rol == 1:
        return "admin"
    return "operador"
from fastapi import Depends, HTTPException, status

from app.api.usuarios import obtener_usuario_actual
from app.core.seguridad import rol_de


def requerir_rol(rol_esperado: str):
    def dependencia(usuario=Depends(obtener_usuario_actual)):
        rol_actual = rol_de(usuario)
        if rol_actual != rol_esperado:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Acción restringida: requiere rol '{rol_esperado}' (tu rol: '{rol_actual}')",
            )
        return usuario
    return dependencia


requerir_admin = requerir_rol("admin")
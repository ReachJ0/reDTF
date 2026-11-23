# Compilar y ejecutar ReDTF

## Desarrollo (dos procesos, hot-reload)
```powershell
# terminal 1
uvicorn main:app --reload
# terminal 2
cd frontend; npm run dev
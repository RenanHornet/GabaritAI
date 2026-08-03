from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def home():
    return {
        "status": "API funcionando"
    }
    
@router.get("/health")
def health_check():
    return {
        "api": "online",
        "database": "não conectado"
    }
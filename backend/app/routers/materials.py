from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.material import Material
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse
from app.auth import require_auth
from app.security import sanitize_string, validate_numeric
from app.models.user import User

router = APIRouter(prefix="/api/materials", tags=["Materials"], dependencies=[Depends(require_auth)])


@router.get("/", response_model=List[MaterialResponse])
def list_materials(
    search: str = Query("", max_length=100),
    db: Session = Depends(get_db),
):
    query = db.query(Material)
    if search:
        safe_search = sanitize_string(search)
        if safe_search:
            query = query.filter(Material.name.ilike(f"%{safe_search}%"))
    return query.order_by(Material.name).all()


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.post("/", response_model=MaterialResponse, status_code=201)
def create_material(data: MaterialCreate, db: Session = Depends(get_db)):
    material = Material(**data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
def update_material(material_id: int, data: MaterialUpdate, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(material, key, value)
    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    db.delete(material)
    db.commit()
    return {"message": "Material deleted successfully"}
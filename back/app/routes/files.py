from fastapi import APIRouter
from app.services.file_service import FileService

router = APIRouter()

@router.get("/files")
def get_files():
    return FileService.get_all_files()

from app.services.file_service import FileService
from app.routes.upload import clean_df

@router.get("/file-info")
def file_info(file_id: str):
    df = FileService.load_df(file_id)
    df = clean_df(df)

    return {
        "columns": df.columns.tolist(),
        "rows": len(df)
    }
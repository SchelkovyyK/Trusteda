from fastapi import APIRouter
from app.services.file_service import FileService
from app.routes.upload import clean_df

router = APIRouter()

@router.get("/files")
def get_files():
    return FileService.list_files()

@router.get("/file-info")
def file_info(file_id: str):
    df = FileService.load_df(file_id)
    df = clean_df(df)

    return {
        "columns": df.columns.tolist(),
        "rows": len(df),
        "preview": df.head(5).to_dict(orient="records")  # Додано віддачу 5 рядків даних
    }

@router.delete("/files/{file_id}")
def delete_file(file_id: str):
    return FileService.delete_file(file_id)

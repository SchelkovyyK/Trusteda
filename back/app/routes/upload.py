from fastapi import APIRouter, UploadFile, File
from app.services.file_service import FileService
import pandas as pd
import numpy as np

router = APIRouter()


def clean_df(df):
    return df.replace({np.nan: None})


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    result = FileService.save_file(file)
    df = FileService.load_df(result["file_id"])
    df = clean_df(df)

    return {
        "file_id": result["file_id"],
        "filename": result["filename"],
        "columns": df.columns.tolist(),
        "rows": len(df),
        "preview": df.head(5).to_dict(orient="records")
    }


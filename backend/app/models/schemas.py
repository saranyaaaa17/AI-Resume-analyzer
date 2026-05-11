from pydantic import BaseModel

class UploadResponse(BaseModel):
    filename: str

class MessageResponse(BaseModel):
    message: str

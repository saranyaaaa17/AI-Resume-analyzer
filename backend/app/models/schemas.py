from pydantic import BaseModel

class UploadResponse(BaseModel):
    filename: str

class MessageResponse(BaseModel):
    message: str


class AnalyzeResponse(BaseModel):
    filename: str
    extracted_text: str
    feedback: str

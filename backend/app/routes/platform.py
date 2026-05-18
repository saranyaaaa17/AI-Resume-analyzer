from fastapi import APIRouter

from ..models.schemas import DemoDashboardResponse
from ..services.intelligence import build_demo_dashboard

router = APIRouter(prefix="/insights", tags=["platform"])


@router.get("/demo", response_model=DemoDashboardResponse)
async def demo_dashboard() -> DemoDashboardResponse:
    return build_demo_dashboard()
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class TimeRange(str, Enum):
    WEEK = "week"
    MONTH = "month"
    CUSTOM = "custom"

class ExportFormat(str, Enum):
    PDF = "pdf"
    JSON = "json"

class ContentInsight(BaseModel):
    category: str
    count: int
    trend: str  # "up", "down", "stable"
    keywords: List[str]
    percentage: float

class TimeInsight(BaseModel):
    completion_rate: float
    overdue_rate: float
    avg_completion_time_hours: float
    peak_working_hours: List[int]  # [9, 10, 11, 14, 15]
    trend: str  # "improving", "declining", "stable"

class ProductivityInsight(BaseModel):
    tasks_per_day: float
    completion_trend: str  # "increasing", "decreasing", "stable"
    peak_days: List[str]  # ["Monday", "Tuesday"]
    efficiency_score: float  # 0-100

class ComparisonData(BaseModel):
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    change_percentage: float
    improvement_areas: List[str]
    declining_areas: List[str]

class Recommendation(BaseModel):
    title: str
    description: str
    priority: str  # "high", "medium", "low"
    category: str  # "time_management", "productivity", "content_organization"

class AnalysisRequest(BaseModel):
    time_range: TimeRange = TimeRange.WEEK
    compare_with_previous: bool = True
    custom_start_date: Optional[datetime] = None
    custom_end_date: Optional[datetime] = None

class AnalysisResponse(BaseModel):
    user_id: str
    time_range: TimeRange
    generated_at: datetime
    content: ContentInsight
    time: TimeInsight
    productivity: ProductivityInsight
    comparison: Optional[ComparisonData] = None
    recommendations: List[Recommendation]
    confidence_score: float  # 0-100
    total_todos_analyzed: int

class ExportRequest(BaseModel):
    format: ExportFormat
    include_charts: bool = True
    time_range: TimeRange = TimeRange.WEEK

class ExportResponse(BaseModel):
    download_url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    filename: str
    generated_at: datetime
    file_size_bytes: Optional[int] = None

class AnalysisHistoryItem(BaseModel):
    id: str
    time_range: TimeRange
    generated_at: datetime
    confidence_score: float
    total_todos: int
    key_insights: List[str]

class AnalysisHistoryResponse(BaseModel):
    items: List[AnalysisHistoryItem]
    total: int

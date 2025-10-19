import google.generativeai as genai
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging
import json
import redis
from ..config import settings
from ..models.todo import Todo
from ..schemas.analysis import (
    AnalysisRequest, AnalysisResponse, ContentInsight, TimeInsight, 
    ProductivityInsight, ComparisonData, Recommendation, TimeRange
)

logger = logging.getLogger(__name__)

class GeminiAnalysisService:
    """
    Service để phân tích todos sử dụng Gemini AI
    """
    
    def __init__(self):
        # Configure Gemini
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Redis connection for caching
        self.redis_client = redis.from_url(settings.redis_url)
        
    def analyze_todos(self, user_id: str, time_range: TimeRange, compare_with_previous: bool = True) -> AnalysisResponse:
        """
        Phân tích todos của user với Gemini AI
        """
        try:
            # Get todos data
            todos_data = self._get_todos_data(user_id, time_range)
            
            if not todos_data:
                return self._create_empty_analysis(user_id, time_range)
            
            # Prepare data for Gemini
            analysis_prompt = self._create_analysis_prompt(todos_data, time_range, compare_with_previous)
            
            # Call Gemini API
            response = self.model.generate_content(analysis_prompt)
            
            # Parse Gemini response
            analysis_result = self._parse_gemini_response(response.text)
            
            # Create analysis response
            return AnalysisResponse(
                user_id=user_id,
                time_range=time_range,
                generated_at=datetime.now(),
                content=analysis_result.get('content', self._default_content_insight()),
                time=analysis_result.get('time', self._default_time_insight()),
                productivity=analysis_result.get('productivity', self._default_productivity_insight()),
                comparison=analysis_result.get('comparison') if compare_with_previous else None,
                recommendations=analysis_result.get('recommendations', []),
                confidence_score=analysis_result.get('confidence_score', 85.0),
                total_todos_analyzed=len(todos_data)
            )
            
        except Exception as e:
            logger.error(f"Error in analyze_todos: {e}")
            return self._create_empty_analysis(user_id, time_range)
    
    def _get_todos_data(self, user_id: str, time_range: TimeRange) -> List[Dict[str, Any]]:
        """
        Lấy dữ liệu todos từ database
        """
        # This would be called from router with db session
        # For now, return empty list - will be implemented in router
        return []
    
    def _create_analysis_prompt(self, todos_data: List[Dict[str, Any]], time_range: TimeRange, compare_with_previous: bool) -> str:
        """
        Tạo prompt cho Gemini AI
        """
        prompt = f"""
        Bạn là một AI chuyên gia phân tích productivity và quản lý thời gian. 
        Hãy phân tích dữ liệu todos sau và đưa ra insights chi tiết:

        Dữ liệu todos:
        {json.dumps(todos_data, ensure_ascii=False, indent=2)}

        Khoảng thời gian: {time_range}
        So sánh với kỳ trước: {compare_with_previous}

        Hãy phân tích và trả về kết quả theo format JSON sau:

        {{
            "content": {{
                "category": "chủ đề chính",
                "count": số lượng,
                "trend": "up/down/stable",
                "keywords": ["từ khóa 1", "từ khóa 2"],
                "percentage": phần trăm
            }},
            "time": {{
                "completion_rate": tỷ lệ hoàn thành (0-100),
                "overdue_rate": tỷ lệ quá hạn (0-100),
                "avg_completion_time_hours": thời gian trung bình (giờ),
                "peak_working_hours": [9, 10, 11, 14, 15],
                "trend": "improving/declining/stable"
            }},
            "productivity": {{
                "tasks_per_day": số tasks/ngày,
                "completion_trend": "increasing/decreasing/stable",
                "peak_days": ["Monday", "Tuesday"],
                "efficiency_score": điểm hiệu suất (0-100)
            }},
            "comparison": {{
                "current_period": {{}},
                "previous_period": {{}},
                "change_percentage": phần trăm thay đổi,
                "improvement_areas": ["lĩnh vực cải thiện"],
                "declining_areas": ["lĩnh vực suy giảm"]
            }},
            "recommendations": [
                {{
                    "title": "Tiêu đề gợi ý",
                    "description": "Mô tả chi tiết",
                    "priority": "high/medium/low",
                    "category": "time_management/productivity/content_organization"
                }}
            ],
            "confidence_score": điểm tin cậy (0-100)
        }}

        Hãy phân tích kỹ lưỡng và đưa ra insights hữu ích cho việc cải thiện productivity.
        """
        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse response từ Gemini AI
        """
        try:
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                logger.warning("Could not find JSON in Gemini response")
                return {}
                
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return {}
    
    def _create_empty_analysis(self, user_id: str, time_range: TimeRange) -> AnalysisResponse:
        """
        Tạo analysis rỗng khi không có dữ liệu
        """
        return AnalysisResponse(
            user_id=user_id,
            time_range=time_range,
            generated_at=datetime.now(),
            content=self._default_content_insight(),
            time=self._default_time_insight(),
            productivity=self._default_productivity_insight(),
            comparison=None,
            recommendations=[],
            confidence_score=0.0,
            total_todos_analyzed=0
        )
    
    def _default_content_insight(self) -> ContentInsight:
        return ContentInsight(
            category="Không có dữ liệu",
            count=0,
            trend="stable",
            keywords=[],
            percentage=0.0
        )
    
    def _default_time_insight(self) -> TimeInsight:
        return TimeInsight(
            completion_rate=0.0,
            overdue_rate=0.0,
            avg_completion_time_hours=0.0,
            peak_working_hours=[],
            trend="stable"
        )
    
    def _default_productivity_insight(self) -> ProductivityInsight:
        return ProductivityInsight(
            tasks_per_day=0.0,
            completion_trend="stable",
            peak_days=[],
            efficiency_score=0.0
        )
    
    def cache_analysis(self, user_id: str, time_range: TimeRange, analysis: AnalysisResponse):
        """
        Cache analysis result vào Redis
        """
        try:
            cache_key = f"analysis:{user_id}:{time_range}"
            cache_data = analysis.dict()
            self.redis_client.setex(cache_key, 86400, json.dumps(cache_data, default=str))  # TTL 24h
        except Exception as e:
            logger.error(f"Error caching analysis: {e}")
    
    def get_cached_analysis(self, user_id: str, time_range: TimeRange) -> Optional[AnalysisResponse]:
        """
        Lấy analysis từ cache
        """
        try:
            cache_key = f"analysis:{user_id}:{time_range}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                data = json.loads(cached_data)
                return AnalysisResponse(**data)
            return None
        except Exception as e:
            logger.error(f"Error getting cached analysis: {e}")
            return None

# Dependency injection
_analysis_service = None

def get_analysis_service() -> GeminiAnalysisService:
    global _analysis_service
    if _analysis_service is None:
        _analysis_service = GeminiAnalysisService()
    return _analysis_service

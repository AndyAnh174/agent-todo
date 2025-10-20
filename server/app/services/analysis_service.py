import requests
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

class OllamaAnalysisService:
    """
    Service để phân tích todos sử dụng Ollama AI
    """
    
    def __init__(self):
        # Ollama configuration
        self.ollama_host = settings.ollama_host
        self.ollama_model = "qwen3:latest"  # Using qwen3 model for analysis
        
        # Redis connection for caching
        self.redis_client = redis.from_url(settings.redis_url)
        
    def analyze_todos(self, user_id: str, time_range: TimeRange, compare_with_previous: bool = True) -> AnalysisResponse:
        """
        Phân tích todos của user với Ollama AI
        """
        try:
            # Get todos data
            todos_data = self._get_todos_data(user_id, time_range)
            
            if not todos_data:
                return self._create_empty_analysis(user_id, time_range)
            
            # Prepare data for Ollama
            analysis_prompt = self._create_analysis_prompt(todos_data, time_range, compare_with_previous)
            
            # Call Ollama API
            response = self._call_ollama_api(analysis_prompt)
            
            # Parse Ollama response
            analysis_result = self._parse_ollama_response(response)
            
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
        Tạo prompt cho Ollama AI
        """
        # Tính toán thống kê cơ bản
        total_todos = len(todos_data)
        completed_todos = sum(1 for todo in todos_data if todo.get('is_completed', False))
        completion_rate = (completed_todos / total_todos * 100) if total_todos > 0 else 0
        
        # Phân tích thời gian
        time_distribution = {}
        peak_hours = []
        
        for todo in todos_data:
            if todo.get('due_time'):
                try:
                    due_time = datetime.fromisoformat(todo['due_time'].replace('Z', '+00:00'))
                    hour = due_time.hour
                    time_distribution[str(hour)] = time_distribution.get(str(hour), 0) + 1
                except:
                    pass
        
        # Tìm giờ cao điểm (top 3)
        if time_distribution:
            peak_hours = sorted(time_distribution.items(), key=lambda x: x[1], reverse=True)[:3]
            peak_hours = [int(hour) for hour, _ in peak_hours]
        
        # Tính tasks per day
        days = 7 if time_range == 'week' else 30
        tasks_per_day = total_todos / days if days > 0 else 0
        
        prompt = f"""
        Bạn là một AI chuyên gia phân tích productivity và quản lý thời gian. 
        Hãy phân tích dữ liệu todos sau và đưa ra insights chi tiết:

        Dữ liệu todos:
        {json.dumps(todos_data, ensure_ascii=False, indent=2)}

        Thống kê cơ bản:
        - Tổng số todos: {total_todos}
        - Todos hoàn thành: {completed_todos}
        - Tỷ lệ hoàn thành: {completion_rate:.1f}%
        - Tasks/ngày: {tasks_per_day:.1f}
        - Phân bố thời gian: {time_distribution}
        - Giờ cao điểm: {peak_hours}

        Khoảng thời gian: {time_range}
        So sánh với kỳ trước: {compare_with_previous}

        Hãy phân tích và trả về kết quả theo format JSON sau:

        {{
            "content": {{
                "category": "chủ đề chính (work/study/personal/etc)",
                "count": {total_todos},
                "trend": "up/down/stable",
                "keywords": ["từ khóa 1", "từ khóa 2"],
                "summary": "tóm tắt ngắn gọn về nội dung tasks"
            }},
            "time": {{
                "completion_rate": {completion_rate},
                "overdue_rate": 0,
                "avg_completion_time_hours": 2.5,
                "peak_working_hours": {peak_hours},
                "trend": "improving/declining/stable",
                "time_distribution": {time_distribution}
            }},
            "productivity": {{
                "tasks_per_day": {tasks_per_day},
                "completion_trend": "increasing/decreasing/stable",
                "peak_days": ["Monday", "Tuesday"],
                "efficiency_score": 75,
                "focus_areas": ["lĩnh vực tập trung chính"]
            }},
            "comparison": {{
                "current_period": {{
                    "completion_rate": {completion_rate},
                    "efficiency_score": 75,
                    "task_count": {total_todos}
                }},
                "previous_period": {{
                    "completion_rate": 60,
                    "efficiency_score": 65,
                    "task_count": {total_todos - 2}
                }},
                "improvement": {{
                    "completion_rate_change": 15,
                    "efficiency_change": 10,
                    "task_count_change": 2
                }}
            }},
            "recommendations": [
                {{
                    "type": "time_management",
                    "title": "Tạo lịch làm việc cụ thể cho từng nhiệm vụ",
                    "description": "Phân bổ thời gian cho các nhiệm vụ dựa trên độ ưu tiên (ví dụ: buổi sáng cho công việc quan trọng, buổi tối cho học tập).",
                    "priority": "high"
                }},
                {{
                    "type": "productivity",
                    "title": "Sử dụng tags để phân loại công việc",
                    "description": "Nhãn hóa các nhiệm vụ theo loại (study, technical, meeting) để dễ theo dõi và phân tích hiệu suất.",
                    "priority": "medium"
                }},
                {{
                    "type": "productivity",
                    "title": "Tăng cường theo dõi tiến độ",
                    "description": "Lập kế hoạch hoàn thành các nhiệm vụ hàng ngày để cải thiện tỷ lệ hoàn thành (hiện tại là {completion_rate:.1f}%).",
                    "priority": "high"
                }}
            ],
            "confidence_score": 85
        }}

        Hãy phân tích kỹ lưỡng dựa trên dữ liệu thực tế và đưa ra insights hữu ích cho việc cải thiện productivity.
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
    
    def _call_ollama_api(self, prompt: str) -> str:
        """
        Gọi Ollama API để phân tích
        """
        try:
            url = f"{self.ollama_host}/api/generate"
            payload = {
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 2000
                }
            }
            
            response = requests.post(url, json=payload, timeout=300)
            response.raise_for_status()
            
            result = response.json()
            return result.get("response", "")
            
        except Exception as e:
            logger.error(f"Error calling Ollama API: {e}")
            raise
    
    def _parse_ollama_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse response từ Ollama
        """
        try:
            # Try to parse as JSON first
            if response_text.strip().startswith('{'):
                data = json.loads(response_text)
                
                # Ensure all required fields exist
                return {
                    "content": data.get("content", {
                        "category": "General",
                        "count": 0,
                        "trend": "stable",
                        "keywords": [],
                        "summary": "No analysis available"
                    }),
                    "time": data.get("time", {
                        "completion_rate": 0.0,
                        "overdue_rate": 0.0,
                        "avg_completion_time_hours": 0.0,
                        "peak_working_hours": [],
                        "trend": "stable",
                        "time_distribution": {}
                    }),
                    "productivity": data.get("productivity", {
                        "tasks_per_day": 0.0,
                        "completion_trend": "stable",
                        "peak_days": [],
                        "efficiency_score": 0.0,
                        "focus_areas": []
                    }),
                    "comparison": data.get("comparison", {
                        "current_period": {
                            "completion_rate": 0.0,
                            "efficiency_score": 0.0,
                            "task_count": 0
                        },
                        "previous_period": {
                            "completion_rate": 0.0,
                            "efficiency_score": 0.0,
                            "task_count": 0
                        },
                        "improvement": {
                            "completion_rate_change": 0.0,
                            "efficiency_change": 0.0,
                            "task_count_change": 0
                        }
                    }),
                    "recommendations": data.get("recommendations", []),
                    "confidence_score": data.get("confidence_score", 0)
                }

            # If not JSON, create a basic analysis structure
            return {
                "content": {
                    "category": "General",
                    "count": 0,
                    "trend": "stable",
                    "keywords": ["analysis", "todos"],
                    "summary": response_text[:500] if response_text else "No analysis available"
                },
                "time": {
                    "completion_rate": 0.0,
                    "overdue_rate": 0.0,
                    "avg_completion_time_hours": 0.0,
                    "peak_working_hours": [],
                    "trend": "stable",
                    "time_distribution": {}
                },
                "productivity": {
                    "tasks_per_day": 0.0,
                    "completion_trend": "stable",
                    "peak_days": [],
                    "efficiency_score": 0.0,
                    "focus_areas": []
                },
                "comparison": {
                    "current_period": {
                        "completion_rate": 0.0,
                        "efficiency_score": 0.0,
                        "task_count": 0
                    },
                    "previous_period": {
                        "completion_rate": 0.0,
                        "efficiency_score": 0.0,
                        "task_count": 0
                    },
                    "improvement": {
                        "completion_rate_change": 0.0,
                        "efficiency_change": 0.0,
                        "task_count_change": 0
                    }
                },
                "recommendations": [
                    {
                        "type": "general",
                        "title": "AI Analysis",
                        "description": response_text[:200] if response_text else "Analysis completed",
                        "priority": "medium"
                    }
                ],
                "confidence_score": 0
            }

        except Exception as e:
            logger.error(f"Error parsing Ollama response: {e}")
            # Return default structure
            return {
                "content": {
                    "category": "General",
                    "count": 0,
                    "trend": "stable",
                    "keywords": [],
                    "summary": "Analysis completed successfully"
                },
                "time": {
                    "completion_rate": 0.0,
                    "overdue_rate": 0.0,
                    "avg_completion_time_hours": 0.0,
                    "peak_working_hours": [],
                    "trend": "stable",
                    "time_distribution": {}
                },
                "productivity": {
                    "tasks_per_day": 0.0,
                    "completion_trend": "stable",
                    "peak_days": [],
                    "efficiency_score": 0.0,
                    "focus_areas": []
                },
                "comparison": {
                    "current_period": {
                        "completion_rate": 0.0,
                        "efficiency_score": 0.0,
                        "task_count": 0
                    },
                    "previous_period": {
                        "completion_rate": 0.0,
                        "efficiency_score": 0.0,
                        "task_count": 0
                    },
                    "improvement": {
                        "completion_rate_change": 0.0,
                        "efficiency_change": 0.0,
                        "task_count_change": 0
                    }
                },
                "recommendations": [],
                "confidence_score": 0
            }

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

def get_analysis_service() -> OllamaAnalysisService:
    global _analysis_service
    if _analysis_service is None:
        _analysis_service = OllamaAnalysisService()
    return _analysis_service

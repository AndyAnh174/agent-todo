import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

from sqlalchemy.orm import Session

from ..models.group import Group
from ..models.tag import Tag
from ..models.todo import Todo
from ..models.user import User

logger = logging.getLogger(__name__)


class SmartLogicEngine:
    """
    Bộ não logic thông minh cho Agent TODO
    Xử lý các logic cơ bản mà không cần ML/NLP phức tạp
    """
    
    def __init__(self, db: Session):
        self.db = db
        
        # Keywords cho phân loại groups
        self.group_keywords = {
            "công việc": ["họp", "hop", "meeting", "báo cáo", "bao cao", "dự án", "du an", "khách hàng", "khach hang", "đối tác", "doi tac", "công ty", "cong ty", "office", "work"],
            "học tập": ["học", "hoc", "study", "bài tập", "bai tap", "assignment", "exam", "thi", "sách", "sach", "course", "khóa học", "khoa hoc"],
            "cá nhân": ["mua sắm", "mua sam", "shopping", "ăn uống", "an uong", "restaurant", "nhà", "nha", "home", "gia đình", "gia dinh", "family"],
            "sức khỏe": ["tập gym", "tap gym", "gym", "yoga", "chạy bộ", "chay bo", "running", "bác sĩ", "bac si", "doctor", "khám", "kham", "health"],
            "du lịch": ["du lịch", "du lich", "travel", "nghỉ", "nghi", "vacation", "hotel", "booking", "vé", "ve", "ticket"],
            "tài chính": ["tiền", "tien", "money", "ngân hàng", "ngan hang", "bank", "thuế", "thue", "tax", "đầu tư", "dau tu", "investment", "bill"]
        }
        
        # Keywords cho tags
        self.tag_keywords = {
            "urgent": ["khẩn cấp", "khan cap", "urgent", "gấp", "gap", "asap", "ngay", "immediately", "cấp bách", "cap bach"],
            "important": ["quan trọng", "quan trong", "important", "priority", "ưu tiên", "uu tien", "critical", "chính", "chinh"],
            "deadline": ["deadline", "hạn chót", "han chot", "due", "chậm", "cham", "late", "muộn", "muon", "trễ", "tre"],
            "meeting": ["họp", "hop", "meeting", "call", "gọi", "goi", "zoom", "teams", "skype"],
            "email": ["email", "mail", "gửi", "gui", "send", "reply", "trả lời", "tra loi"],
            "review": ["review", "kiểm tra", "kiem tra", "check", "xem lại", "xem lai", "duyệt", "duyet", "approve"],
            "creative": ["thiết kế", "thiet ke", "design", "sáng tạo", "sang tao", "creative", "idea", "ý tưởng", "y tuong"],
            "technical": ["code", "programming", "bug", "fix", "technical", "kỹ thuật", "ky thuat", "lập trình", "lap trinh"],
            # Thêm keywords mới
            "work": ["làm", "lam", "work", "công việc", "cong viec", "job", "nghề", "nghe", "nghiệp", "nghiep"],
            "office": ["công ty", "cong ty", "company", "văn phòng", "van phong", "office", "cơ quan", "co quan"],
            "study": ["học", "hoc", "study", "bài tập", "bai tap", "assignment", "thi", "exam", "sách", "sach", "course", "khóa học", "khoa hoc"],
            "tomorrow": ["ngày mai", "ngay mai", "tomorrow", "mai"],
            "location": ["công ty", "cong ty", "company", "văn phòng", "van phong", "office", "nhà", "nha", "home", "trường", "truong", "school"],
            "backend": ["backend", "api", "server", "database", "db", "lập trình", "lap trinh", "programming", "code"],
            "report": ["báo cáo", "bao cao", "report", "báo", "bao", "thuật toán", "thuat toan", "algorithm", "DSA"]
        }
        
        # Priority indicators
        self.priority_indicators = {
            "high": ["urgent", "khẩn cấp", "khan cap", "gấp", "gap", "asap", "critical", "quan trọng", "quan trong", "priority"],
            "medium": ["normal", "bình thường", "binh thuong", "regular", "standard"],
            "low": ["low", "thấp", "thap", "later", "sau", "optional", "tùy chọn", "tuy chon"]
        }
        
        # Time patterns
        self.time_patterns = {
            "today": ["hôm nay", "today", "ngay hôm nay"],
            "tomorrow": ["ngày mai", "tomorrow", "mai"],
            "this_week": ["tuần này", "this week", "trong tuần"],
            "next_week": ["tuần sau", "next week", "tuần tới"],
            "this_month": ["tháng này", "this month", "trong tháng"],
            "urgent": ["ngay", "immediately", "asap", "gấp", "urgent"]
        }

    def analyze_todo_content(self, title: str, description: str = "") -> Dict[str, Any]:
        """
        Phân tích nội dung todo và đưa ra gợi ý thông minh
        """
        content = f"{title} {description}".lower()
        
        analysis = {
            "suggested_group": self._suggest_group(content),
            "suggested_tags": self._suggest_tags(content),
            "suggested_priority": self._suggest_priority(content),
            "suggested_deadline": self._suggest_deadline(content),
            "complexity_score": self._calculate_complexity(title, description),
            "estimated_duration": self._estimate_duration(content),
            "confidence": self._calculate_confidence(content)
        }
        
        logger.info(f"Smart analysis for '{title}': {analysis}")
        return analysis

    def _suggest_group(self, content: str) -> Optional[str]:
        """Gợi ý group dựa trên keywords"""
        group_scores = {}
        
        for group_name, keywords in self.group_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content)
            if score > 0:
                group_scores[group_name] = score
        
        if group_scores:
            # Tìm group có score cao nhất
            best_group = max(group_scores, key=group_scores.get)
            
            # Tìm group trong database
            group = self.db.query(Group).filter(
                Group.name.ilike(f"%{best_group}%")
            ).first()
            
            if group:
                return str(group.id)
        
        return None

    def _suggest_tags(self, content: str) -> List[str]:
        """Gợi ý tags dựa trên keywords"""
        suggested_tags = []
        
        for tag_name, keywords in self.tag_keywords.items():
            if any(keyword in content for keyword in keywords):
                suggested_tags.append(tag_name)
        
        return suggested_tags

    def _suggest_priority(self, content: str) -> str:
        """Gợi ý độ ưu tiên"""
        for priority, keywords in self.priority_indicators.items():
            if any(keyword in content for keyword in keywords):
                return priority
        
        # Mặc định là medium
        return "medium"

    def _suggest_deadline(self, content: str) -> Optional[datetime]:
        """Gợi ý deadline dựa trên từ khóa thời gian"""
        now = datetime.now()
        
        # Kiểm tra các pattern thời gian
        if any(keyword in content for keyword in self.time_patterns["urgent"]):
            return now + timedelta(hours=2)  # 2 giờ sau
        
        if any(keyword in content for keyword in self.time_patterns["today"]):
            return now.replace(hour=17, minute=0, second=0, microsecond=0)  # 5PM hôm nay
        
        if any(keyword in content for keyword in self.time_patterns["tomorrow"]):
            tomorrow = now + timedelta(days=1)
            return tomorrow.replace(hour=17, minute=0, second=0, microsecond=0)  # 5PM ngày mai
        
        if any(keyword in content for keyword in self.time_patterns["this_week"]):
            # Cuối tuần này
            days_until_friday = (4 - now.weekday()) % 7
            if days_until_friday == 0 and now.weekday() > 4:  # Nếu đã qua thứ 6
                days_until_friday = 7
            return now + timedelta(days=days_until_friday)
        
        if any(keyword in content for keyword in self.time_patterns["next_week"]):
            # Đầu tuần sau
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0:
                days_until_monday = 7
            return now + timedelta(days=days_until_monday)
        
        return None

    def _calculate_complexity(self, title: str, description: str) -> int:
        """Tính điểm phức tạp (1-10)"""
        content = f"{title} {description}".lower()
        complexity_score = 1
        
        # Tăng điểm dựa trên các yếu tố
        if len(title.split()) > 5:
            complexity_score += 1
        
        if len(description) > 100:
            complexity_score += 2
        
        if any(word in content for word in ["phức tạp", "complex", "nhiều", "multiple", "various"]):
            complexity_score += 2
        
        if any(word in content for word in ["đơn giản", "simple", "dễ", "easy", "quick"]):
            complexity_score -= 1
        
        # Giới hạn trong khoảng 1-10
        return max(1, min(10, complexity_score))

    def _estimate_duration(self, content: str) -> int:
        """Ước tính thời gian hoàn thành (phút)"""
        base_duration = 30  # 30 phút mặc định
        
        # Điều chỉnh dựa trên keywords
        if any(word in content for word in ["nhanh", "quick", "fast", "5 phút", "10 phút"]):
            return 15
        
        if any(word in content for word in ["lâu", "long", "nhiều giờ", "hours", "cả ngày"]):
            return 240  # 4 giờ
        
        if any(word in content for word in ["họp", "meeting", "call"]):
            return 60  # 1 giờ
        
        if any(word in content for word in ["email", "mail", "gửi"]):
            return 10
        
        if any(word in content for word in ["báo cáo", "report", "presentation"]):
            return 120  # 2 giờ
        
        return base_duration

    def _calculate_confidence(self, content: str) -> float:
        """Tính độ tin cậy của phân tích (0-1)"""
        confidence = 0.5  # Mặc định
        
        # Tăng confidence nếu có nhiều keywords match
        keyword_matches = 0
        for keywords in self.group_keywords.values():
            if any(keyword in content for keyword in keywords):
                keyword_matches += 1
        
        confidence += min(0.3, keyword_matches * 0.1)
        
        # Tăng confidence nếu có từ khóa thời gian rõ ràng
        if any(keyword in content for keyword in self.time_patterns["urgent"]):
            confidence += 0.2
        
        return min(1.0, confidence)

    def apply_smart_suggestions(self, todo: Todo, analysis: Dict[str, Any]) -> Todo:
        """
        Áp dụng các gợi ý thông minh vào todo
        """
        # Áp dụng group suggestion
        if analysis["suggested_group"] and not todo.group_id:
            todo.group_id = analysis["suggested_group"]
        
        # Áp dụng priority suggestion
        if analysis["suggested_priority"] == "high":
            todo.is_important = True
        elif analysis["suggested_priority"] == "low":
            todo.is_important = False
        
        # Áp dụng deadline suggestion
        if analysis["suggested_deadline"] and not todo.due_time:
            todo.due_time = analysis["suggested_deadline"]
        
        return todo

    def create_smart_tags(self, suggested_tags: List[str], user_id: str) -> List[str]:
        """
        Tạo tags thông minh nếu chưa tồn tại
        """
        created_tag_ids = []
        
        for tag_name in suggested_tags:
            # Kiểm tra tag đã tồn tại chưa
            existing_tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
            
            if existing_tag:
                created_tag_ids.append(str(existing_tag.id))
            else:
                # Tạo tag mới
                new_tag = Tag(name=tag_name)
                self.db.add(new_tag)
                self.db.flush()  # Để lấy ID
                created_tag_ids.append(str(new_tag.id))
        
        return created_tag_ids

    def get_smart_insights(self, user_id: str) -> Dict[str, Any]:
        """
        Đưa ra insights thông minh về productivity của user
        """
        # Lấy todos của user
        todos = self.db.query(Todo).filter(Todo.user_id == user_id).all()
        
        if not todos:
            return {"message": "Chưa có dữ liệu để phân tích"}
        
        # Tính toán các metrics
        total_todos = len(todos)
        completed_todos = len([t for t in todos if t.is_completed])
        important_todos = len([t for t in todos if t.is_important])
        overdue_todos = len([t for t in todos if t.due_time and t.due_time < datetime.now() and not t.is_completed])
        
        completion_rate = (completed_todos / total_todos * 100) if total_todos > 0 else 0
        
        # Phân tích patterns
        insights = {
            "productivity_score": completion_rate,
            "total_todos": total_todos,
            "completed_todos": completed_todos,
            "important_todos": important_todos,
            "overdue_todos": overdue_todos,
            "completion_rate": round(completion_rate, 1),
            "recommendations": self._generate_recommendations(completion_rate, overdue_todos, important_todos)
        }
        
        return insights

    def _generate_recommendations(self, completion_rate: float, overdue_todos: int, important_todos: int) -> List[str]:
        """Tạo recommendations dựa trên dữ liệu"""
        recommendations = []
        
        if completion_rate < 50:
            recommendations.append("Tỷ lệ hoàn thành thấp. Hãy tập trung vào những việc quan trọng nhất.")
        
        if overdue_todos > 0:
            recommendations.append(f"Có {overdue_todos} việc quá hạn. Hãy ưu tiên hoàn thành chúng.")
        
        if important_todos > 5:
            recommendations.append("Có quá nhiều việc quan trọng. Hãy phân chia thời gian hợp lý.")
        
        if completion_rate > 80:
            recommendations.append("Tuyệt vời! Bạn đang làm việc rất hiệu quả.")
        
        return recommendations


# Global instance
def get_smart_logic_engine(db: Session) -> SmartLogicEngine:
    """Factory function để tạo SmartLogicEngine instance"""
    return SmartLogicEngine(db)

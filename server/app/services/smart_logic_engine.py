import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import pytz

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
            "work": ["làm", "lam", "work", "công việc", "cong viec", "job", "nghề", "nghe", "nghiệp", "nghiep", "dạy", "day", "teaching", "giảng dạy", "giang day", "lớp", "lop", "class", "đi dạy", "di day"],
            "office": ["công ty", "cong ty", "company", "văn phòng", "van phong", "office", "cơ quan", "co quan"],
            "study": ["học", "hoc", "study", "bài tập", "bai tap", "assignment", "thi", "exam", "sách", "sach", "course", "khóa học", "khoa hoc"],
            "tomorrow": ["ngày mai", "ngay mai", "tomorrow", "mai"],
            "location": ["công ty", "cong ty", "company", "văn phòng", "van phong", "office", "nhà", "nha", "home", "trường", "truong", "school"],
            "backend": ["backend", "api", "server", "database", "db", "lập trình", "lap trinh", "programming", "code"],
            "report": ["báo cáo", "bao cao", "report", "báo", "bao", "thuật toán", "thuat toan", "algorithm", "DSA"],
            "education": ["mindx", "mindx", "education", "giáo dục", "giao duc", "training", "đào tạo", "dao tao", "instructor", "giảng viên", "giang vien", "teacher", "giáo viên", "giao vien"],
            "programming": ["programming", "lập trình", "lap trinh", "coding", "code", "developer", "dev", "frontend", "backend", "fullstack", "javascript", "python", "java", "react", "nodejs"]
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
        
        # Weekday patterns
        self.weekday_patterns = {
            "thứ 2": ["thứ 2", "thứ hai", "t2", "monday", "mon"],
            "thứ 3": ["thứ 3", "thứ ba", "t3", "tuesday", "tue"],
            "thứ 4": ["thứ 4", "thứ tư", "t4", "wednesday", "wed"],
            "thứ 5": ["thứ 5", "thứ năm", "t5", "thursday", "thu"],
            "thứ 6": ["thứ 6", "thứ sáu", "t6", "friday", "fri"],
            "thứ 7": ["thứ 7", "thứ bảy", "t7", "saturday", "sat"],
            "chủ nhật": ["chủ nhật", "cn", "sunday", "sun"]
        }

    def analyze_todo_content(self, title: str, description: str = "") -> Dict[str, Any]:
        """
        Phân tích nội dung todo và đưa ra gợi ý thông minh với NLP
        """
        content = f"{title} {description}".lower()
        
        # Tạo title thông minh từ câu nói tự nhiên
        smart_title = self._generate_smart_title(title, description)
        
        analysis = {
            "original_title": title,
            "smart_title": smart_title,
            "suggested_group": self._suggest_group(content),
            "suggested_tags": self._suggest_tags(content),
            "suggested_priority": self._suggest_priority(content),
            "suggested_deadline": self._suggest_deadline(content),
            "complexity_score": self._calculate_complexity(smart_title, description),
            "estimated_duration": self._estimate_duration(content),
            "confidence": self._calculate_confidence(content)
        }
        
        logger.info(f"Smart analysis for '{title}': {analysis}")
        analysis["smart_suggestions"] = self._generate_smart_suggestions(smart_title, description, analysis)
        analysis["context_analysis"] = self._analyze_natural_context(smart_title, description)
        
        logger.info(f"Smart analysis for '{title}': {analysis}")
        return analysis

    def _generate_smart_title(self, original_title: str, description: str = "") -> str:
        """
        Tạo title thông minh từ câu nói tự nhiên bằng NLP
        """
        content = f"{original_title} {description}".lower()
        
        # Loại bỏ các từ không cần thiết
        remove_words = [
            "tui", "tôi", "mình", "mik", "mk", "i", "me", "my",
            "có", "phải", "cần", "nên", "phải", "có lịch", "có việc",
            "làm", "làm gì", "làm sao", "như thế nào",
            "để", "cho", "với", "cùng", "và", "hoặc", "hay",
            "này", "đó", "kia", "nọ", "ấy", "đây", "nay", "mai",
            # Từ không cần thiết
            "giúp", "help", "giúp đỡ", "giup do", "assist", "support",
            "set", "thiết lập", "thiet lap", "setup", "configure",
            "lịch", "lich", "schedule", "calendar", "thời gian", "thoi gian",
            "nha", "nhé", "nhe", "ok", "oke", "okay", "alright",
            "thuộc", "thuoc", "belong", "của", "cua", "of", "at",
            "cơ sở", "co so", "campus", "location", "địa điểm", "dia diem",
            "lớp", "lop", "class", "course", "khóa học", "khoa hoc",
            "đi", "di", "go", "going", "to", "đến", "den", "arrive",
            "học", "hoc", "study", "learn", "teaching", "teach",
            "ở", "o", "in", "on", "by", "from", "with"
        ]
        
        # Tách từ và loại bỏ từ không cần thiết
        words = original_title.split()
        filtered_words = []
        
        for word in words:
            word_lower = word.lower()
            if word_lower not in remove_words and len(word) > 1:
                filtered_words.append(word)
        
        # Nếu không còn từ nào, dùng title gốc
        if not filtered_words:
            return original_title
        
        # Tạo title mới
        smart_title = " ".join(filtered_words)
        
        # Chuẩn hóa title
        smart_title = self._normalize_title(smart_title)
        
        # Thêm từ quan trọng nếu thiếu
        smart_title = self._enhance_title(smart_title, content)
        
        return smart_title

    def _enhance_title(self, title: str, content: str) -> str:
        """
        Cải thiện title bằng cách thêm từ quan trọng
        """
        title_lower = title.lower()
        
        # Thêm từ quan trọng dựa trên ngữ cảnh
        if any(word in content for word in ["phỏng vấn", "interview"]) and "phỏng vấn" not in title_lower:
            title = f"Phỏng vấn {title}"
        elif any(word in content for word in ["họp", "meeting"]) and "họp" not in title_lower:
            title = f"Họp {title}"
        elif any(word in content for word in ["thi", "exam", "test"]) and "thi" not in title_lower:
            title = f"Thi {title}"
        elif any(word in content for word in ["học", "study"]) and "học" not in title_lower:
            title = f"Học {title}"
        elif any(word in content for word in ["làm việc", "work"]) and "làm việc" not in title_lower:
            title = f"Làm việc {title}"
        
        return title

    def _normalize_title(self, title: str) -> str:
        """
        Chuẩn hóa title: viết hoa chữ cái đầu, loại bỏ dấu câu thừa
        """
        # Loại bỏ dấu câu thừa ở đầu và cuối
        title = title.strip(".,!?;:")
        
        # Viết hoa chữ cái đầu của mỗi từ quan trọng
        words = title.split()
        normalized_words = []
        
        # Từ không viết hoa
        lowercase_words = {
            "và", "của", "cho", "với", "từ", "đến", "trong", "ngoài", 
            "trên", "dưới", "giữa", "sau", "trước", "khi", "nếu", "để",
            "the", "of", "for", "with", "from", "to", "in", "on", "at"
        }
        
        for i, word in enumerate(words):
            word_lower = word.lower()
            
            # Chữ cái đầu của câu hoặc từ quan trọng
            if i == 0 or word_lower not in lowercase_words:
                normalized_words.append(word.capitalize())
            else:
                normalized_words.append(word.lower())
        
        return " ".join(normalized_words)

    def _analyze_natural_context(self, title: str, description: str = "") -> Dict[str, Any]:
        """
        Phân tích ngữ cảnh tự nhiên như AI trong ảnh
        """
        content = f"{title} {description}".lower()
        context = {
            "task_type": "general",
            "urgency_level": "normal", 
            "emotional_tone": "neutral",
            "time_sensitivity": "medium",
            "preparation_needed": False,
            "location_hint": None,
            "people_involved": []
        }
        
        # Phân tích loại task
        if any(word in content for word in ["phỏng vấn", "interview", "phong van"]):
            context["task_type"] = "interview"
            context["urgency_level"] = "high"
            context["preparation_needed"] = True
            context["emotional_tone"] = "anxious"
        elif any(word in content for word in ["họp", "meeting", "hop"]):
            context["task_type"] = "meeting"
            context["preparation_needed"] = True
        elif any(word in content for word in ["thi", "exam", "test", "kiểm tra"]):
            context["task_type"] = "exam"
            context["urgency_level"] = "high"
            context["preparation_needed"] = True
            context["emotional_tone"] = "stressed"
        elif any(word in content for word in ["deadline", "hạn chót", "han chot"]):
            context["task_type"] = "deadline"
            context["urgency_level"] = "high"
            context["time_sensitivity"] = "high"
        
        # Phân tích thời gian
        if any(word in content for word in ["hôm nay", "today", "ngay"]):
            context["time_sensitivity"] = "high"
        elif any(word in content for word in ["mai", "tomorrow", "ngay mai"]):
            context["time_sensitivity"] = "medium"
        
        # Phân tích địa điểm
        if any(word in content for word in ["công ty", "cong ty", "office", "văn phòng"]):
            context["location_hint"] = "office"
        elif any(word in content for word in ["nhà", "nha", "home"]):
            context["location_hint"] = "home"
        elif any(word in content for word in ["trường", "truong", "school", "university"]):
            context["location_hint"] = "school"
        
        return context

    def _generate_smart_suggestions(self, title: str, description: str, analysis: Dict) -> List[str]:
        """
        Tạo gợi ý thông minh như AI trong ảnh
        """
        suggestions = []
        content = f"{title} {description}".lower()
        
        # Gợi ý cho phỏng vấn
        if any(word in content for word in ["phỏng vấn", "interview", "phong van"]):
            suggestions.append("Để chuẩn bị tốt cho phỏng vấn, hãy xem lại CV và luyện tập câu hỏi trước 1 giờ. Đừng quên kiểm tra lịch trình để tránh bị trễ!")
            
            # Tính thời gian còn lại
            deadline = analysis.get("suggested_deadline")
            if deadline:
                vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
                now = datetime.now(vn_tz)
                time_left = deadline - now
                if time_left.total_seconds() > 0:
                    hours_left = int(time_left.total_seconds() // 3600)
                    if hours_left <= 2:
                        suggestions.append(f"*Chỉ còn {hours_left} giờ trước phỏng vấn, bạn có thể dành 15 phút để tập trung vào điểm mạnh của mình.*")
        
        # Gợi ý cho thi cử
        elif any(word in content for word in ["thi", "exam", "test", "kiểm tra"]):
            suggestions.append("Hãy ôn tập lại các kiến thức quan trọng và chuẩn bị đầy đủ dụng cụ học tập!")
            suggestions.append("Đảm bảo ngủ đủ giấc và ăn uống đầy đủ trước khi thi.")
        
        # Gợi ý cho deadline
        elif any(word in content for word in ["deadline", "hạn chót", "han chot", "gấp", "gap"]):
            suggestions.append("Đây là task có deadline gấp! Hãy ưu tiên hoàn thành và chia nhỏ công việc nếu cần.")
            suggestions.append("Tránh làm nhiều việc cùng lúc, tập trung vào task này trước.")
        
        # Gợi ý cho meeting
        elif any(word in content for word in ["họp", "meeting", "hop"]):
            suggestions.append("Chuẩn bị agenda và các tài liệu cần thiết trước cuộc họp.")
            suggestions.append("Kiểm tra thiết bị và kết nối internet để tránh gián đoạn.")
        
        # Gợi ý chung
        if analysis.get("suggested_priority") == "high":
            suggestions.append("🔥 Task này có độ ưu tiên cao, hãy hoàn thành sớm nhất có thể!")
        
        if analysis.get("complexity_score", 0) > 0.7:
            suggestions.append("💡 Task này khá phức tạp, hãy chia nhỏ thành các bước nhỏ hơn.")
        
        return suggestions

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
        """Gợi ý deadline dựa trên phân tích thời gian tự nhiên"""
        # Thử phân tích thời gian cụ thể trước
        natural_time = self._parse_natural_time(content)
        if natural_time:
            return natural_time

        # Fallback cho các từ khóa chung
        vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now = datetime.now(vn_tz)
        
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

    def _parse_natural_time(self, content: str) -> Optional[datetime]:
        """
        Phân tích thời gian tự nhiên từ text như "Thứ 2 tuần sau lúc 15h"
        """
        # Sử dụng timezone Việt Nam
        vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now = datetime.now(vn_tz)
        
        # Phân tích ngày trong tuần trước
        weekday_date = self._parse_weekday_date(content)
        if weekday_date:
            return weekday_date
        
        # Patterns cho giờ cụ thể
        patterns = [
            r'(\d{1,2})h(\d{2})?\s*(chiều|tối|pm)',  # 5h30 chiều, 5h chiều
            r'(\d{1,2})h(\d{2})?\s*(sáng|am)',  # 9h sáng, 9h30 sáng
            r'(\d{1,2}):(\d{2})\s*(chiều|tối|pm)',  # 17:00 chiều
            r'(\d{1,2}):(\d{2})\s*(sáng|am)',  # 9:30 sáng
            r'(\d{1,2})h(\d{2})?',  # 5h, 5h30
            r'(\d{1,2}):(\d{2})',  # 17:00, 9:30
        ]
        
        # Xử lý trường hợp chỉ có "chiều" mà không có giờ cụ thể
        if any(word in content.lower() for word in ["chiều", "chieu", "tối", "toi", "pm"]) and not re.search(r'\d+[h:]', content):
            # Mặc định chiều là 2PM
            hour = 14
            minute = 0
            
            # Xác định ngày
            if any(word in content for word in ["mai", "tomorrow", "ngay mai"]):
                target_date = now + timedelta(days=1)
            elif any(word in content for word in ["hôm nay", "today", "ngay"]):
                target_date = now
            else:
                # Nếu chỉ có "chiều" mà không có ngày cụ thể -> mặc định hôm nay
                target_date = now
            
            return target_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        for pattern in patterns:
            match = re.search(pattern, content.lower())
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2)) if len(match.groups()) > 1 and match.group(2) else 0
                
                # Xử lý AM/PM
                if 'chiều' in pattern or 'tối' in pattern or 'pm' in pattern:
                    if hour < 12:
                        hour += 12
                elif 'sáng' in pattern or 'am' in pattern:
                    if hour == 12:
                        hour = 0
                
                # Xác định ngày
                if any(word in content for word in ["mai", "tomorrow", "ngay mai"]):
                    target_date = now + timedelta(days=1)
                elif any(word in content for word in ["hôm nay", "today", "ngay"]):
                    target_date = now
                else:
                    # Nếu chỉ có giờ mà không có ngày cụ thể -> mặc định hôm nay
                    target_date = now
                
                return target_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        return None

    def _parse_weekday_date(self, content: str) -> Optional[datetime]:
        """
        Phân tích ngày trong tuần như "Thứ 2 tuần sau lúc 15h"
        """
        # Sử dụng timezone Việt Nam
        vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now = datetime.now(vn_tz)
        content_lower = content.lower()
        
        # Tìm ngày trong tuần
        target_weekday = None
        for weekday_name, patterns in self.weekday_patterns.items():
            if any(pattern in content_lower for pattern in patterns):
                target_weekday = weekday_name
                break
        
        if not target_weekday:
            return None
        
        # Tìm giờ
        hour_match = re.search(r'(\d{1,2})h', content_lower)
        if not hour_match:
            return None
        
        hour = int(hour_match.group(1))
        
        # Xác định tuần
        is_next_week = any(word in content_lower for word in ["tuần sau", "next week", "tuần tới"])
        
        # Tính ngày target
        weekday_map = {
            "thứ 2": 0, "thứ 3": 1, "thứ 4": 2, "thứ 5": 3, 
            "thứ 6": 4, "thứ 7": 5, "chủ nhật": 6
        }
        
        target_weekday_num = weekday_map[target_weekday]
        current_weekday = now.weekday()
        
        if is_next_week:
            # Tuần sau
            days_ahead = (7 - current_weekday) + target_weekday_num
            target_date = now + timedelta(days=days_ahead)
        else:
            # Tuần này
            days_ahead = (target_weekday_num - current_weekday) % 7
            if days_ahead == 0 and now.hour >= hour:
                # Nếu đã qua giờ hôm nay, chuyển sang tuần sau
                days_ahead = 7
            target_date = now + timedelta(days=days_ahead)
        
        return target_date.replace(hour=hour, minute=0, second=0, microsecond=0)

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
        vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now = datetime.now(vn_tz)
        overdue_todos = len([t for t in todos if t.due_time and t.due_time < now and not t.is_completed])
        
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

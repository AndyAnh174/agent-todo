from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.llms import Ollama
from langchain.tools import tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional
import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from uuid import UUID

from ..config import settings
from ..models.todo import Todo
from ..models.group import Group
from ..services.smart_logic_engine import get_smart_logic_engine
from ..services.vector_service import get_vector_service
from ..services.conversation_memory import get_memory_service

logger = logging.getLogger(__name__)


class ConversationalTodoAgent:
    """
    Conversational AI Agent sử dụng LangChain + llama3.1:8b
    """
    
    def __init__(self, db: Session, user_id: UUID):
        self.db = db
        self.user_id = user_id
        self.llm = Ollama(
            model=settings.ollama_model,
            base_url=settings.ollama_host
        )
        self.vector_service = get_vector_service()
        self.memory_service = get_memory_service()
        self.smart_engine = get_smart_logic_engine(db)
        
        # Tạo tools
        self.tools = self._create_tools()
        
        # Tạo prompt template đơn giản hơn
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """Bạn là AI assistant thông minh cho quản lý todo. 
            Bạn có thể giúp user:
            - Xem lịch trình và tìm kiếm todos
            - Tạo todo mới với phân tích thông minh và gán tags tự động
            - Cập nhật và quản lý todos
            - Gán tags tự động cho todos hiện có
            - Kiểm tra thời gian rảnh
            - Đưa ra gợi ý và insights
            
            Hãy trả lời bằng tiếng Việt và sử dụng các tools phù hợp để giúp user."""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        # Tạo agent executor đơn giản - chỉ dùng LLM
        self.agent_executor = None  # Sẽ tạo trong chat method
    
    def _create_tools(self) -> List:
        """
        Tạo các tools cho agent
        """
        
        @tool
        def get_schedule_tool(user_id: str, time_range: str = "week") -> str:
            """
            Lấy lịch trình của user theo khoảng thời gian.
            time_range có thể là: today, week, month
            """
            try:
                now = datetime.now()
                query = self.db.query(Todo).filter(Todo.user_id == user_id)
                
                if time_range == "today":
                    today = now.date()
                    query = query.filter(Todo.due_time >= now.replace(hour=0, minute=0, second=0))
                    query = query.filter(Todo.due_time <= now.replace(hour=23, minute=59, second=59))
                elif time_range == "week":
                    week_start = now - timedelta(days=now.weekday())
                    week_end = week_start + timedelta(days=7)
                    query = query.filter(Todo.due_time >= week_start)
                    query = query.filter(Todo.due_time <= week_end)
                elif time_range == "month":
                    month_start = now.replace(day=1, hour=0, minute=0, second=0)
                    if now.month == 12:
                        month_end = now.replace(year=now.year+1, month=1, day=1)
                    else:
                        month_end = now.replace(month=now.month+1, day=1)
                    query = query.filter(Todo.due_time >= month_start)
                    query = query.filter(Todo.due_time <= month_end)
                
                todos = query.order_by(Todo.due_time.asc()).all()
                
                if not todos:
                    return f"Không có việc nào trong {time_range}"
                
                result = f"Lịch trình {time_range}:\n"
                for todo in todos:
                    due_time = todo.due_time.strftime("%d/%m/%Y %H:%M") if todo.due_time else "Chưa có thời gian"
                    priority = "🔥" if todo.is_important else "📝"
                    result += f"{priority} {todo.title} - {due_time}\n"
                
                return result
                
            except Exception as e:
                logger.error(f"Error in get_schedule_tool: {e}")
                return f"Lỗi khi lấy lịch trình: {e}"
        
        @tool
        def search_todos_tool(user_id: str, query: str, limit: int = 5) -> str:
            """
            Tìm kiếm todos bằng semantic search
            """
            try:
                # Sử dụng vector search
                similar_todos = self.vector_service.search_similar_todos(query, user_id, limit)
                
                if not similar_todos:
                    return f"Không tìm thấy todo nào liên quan đến '{query}'"
                
                result = f"Tìm thấy {len(similar_todos)} todos liên quan:\n"
                for todo_data in similar_todos:
                    similarity = todo_data["similarity"]
                    content = todo_data["content"]
                    result += f"• {content} (Độ tương tự: {similarity:.2f})\n"
                
                return result
                
            except Exception as e:
                logger.error(f"Error in search_todos_tool: {e}")
                return f"Lỗi khi tìm kiếm: {e}"
        
        @tool
        def create_todo_tool(user_id: str, title: str, description: str = "", due_time: str = "", is_important: bool = False) -> str:
            """
            Tạo todo mới với smart analysis
            """
            try:
                # Sử dụng Smart Logic Engine
                analysis = self.smart_engine.analyze_todo_content(title, description)
                
                # Parse due_time nếu có
                parsed_due_time = None
                if due_time:
                    try:
                        parsed_due_time = datetime.fromisoformat(due_time)
                    except:
                        parsed_due_time = analysis["suggested_deadline"]
                else:
                    parsed_due_time = analysis["suggested_deadline"]
                
                # Tạo todo
                todo = Todo(
                    title=title,
                    description=description,
                    due_time=parsed_due_time,
                    group_id=analysis["suggested_group"],
                    is_important=is_important or (analysis["suggested_priority"] == "high"),
                    user_id=user_id
                )
                
                self.db.add(todo)
                self.db.commit()
                self.db.refresh(todo)
                
                # Tạo tags thông minh và link với todo
                if analysis["suggested_tags"]:
                    tag_ids = self.smart_engine.create_smart_tags(analysis["suggested_tags"], user_id)
                    # Link tags với todo
                    from ..models.tag import Tag
                    tags = self.db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
                    todo.tags = tags
                    self.db.commit()
                    self.db.refresh(todo)
                
                result = f"Đã tạo todo '{title}' thành công!\n"
                result += f"Phân tích thông minh:\n"
                result += f"- Group: {analysis['suggested_group'] or 'Chưa xác định'}\n"
                result += f"- Priority: {analysis['suggested_priority']}\n"
                result += f"- Tags: {', '.join(analysis['suggested_tags'])}\n"
                if parsed_due_time:
                    result += f"- Deadline: {parsed_due_time.strftime('%d/%m/%Y %H:%M')}\n"
                
                return result
                
            except Exception as e:
                logger.error(f"Error in create_todo_tool: {e}")
                return f"Lỗi khi tạo todo: {e}"
        
        @tool
        def update_todo_tool(todo_id: str, user_id: str, title: str = "", description: str = "", is_completed: bool = None) -> str:
            """
            Cập nhật todo
            """
            try:
                todo = self.db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
                if not todo:
                    return f"Không tìm thấy todo với ID {todo_id}"
                
                if title:
                    todo.title = title
                if description:
                    todo.description = description
                if is_completed is not None:
                    todo.is_completed = is_completed
                
                self.db.commit()
                
                return f"Đã cập nhật todo '{todo.title}' thành công!"
                
            except Exception as e:
                logger.error(f"Error in update_todo_tool: {e}")
                return f"Lỗi khi cập nhật todo: {e}"
        
        @tool
        def auto_tag_todo_tool(user_id: str, todo_id: str) -> str:
            """
            Tự động gán tags cho todo dựa trên nội dung
            """
            try:
                # Tìm todo
                todo = self.db.query(Todo).filter(
                    Todo.id == todo_id,
                    Todo.user_id == user_id
                ).first()
                
                if not todo:
                    return f"Không tìm thấy todo với ID: {todo_id}"
                
                # Phân tích nội dung todo
                analysis = self.smart_engine.analyze_todo_content(todo.title, todo.description or "")
                
                if not analysis["suggested_tags"]:
                    return f"Không tìm thấy tags phù hợp cho todo '{todo.title}'"
                
                # Tạo tags thông minh
                tag_ids = self.smart_engine.create_smart_tags(analysis["suggested_tags"], user_id)
                
                # Link tags với todo
                from ..models.tag import Tag
                tags = self.db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
                todo.tags = tags
                self.db.commit()
                self.db.refresh(todo)
                
                # Trigger embedding update
                from ..tasks.embedding_tasks import update_todo_embedding_task
                update_todo_embedding_task.delay(str(todo.id))
                
                return f"Đã gán tags tự động cho todo '{todo.title}': {', '.join(analysis['suggested_tags'])}"
                
            except Exception as e:
                logger.error(f"Error in auto_tag_todo_tool: {e}")
                return f"Lỗi khi gán tags tự động: {e}"
        
        @tool
        def check_availability_tool(user_id: str, date: str) -> str:
            """
            Kiểm tra thời gian rảnh trong ngày
            """
            try:
                # Parse date
                try:
                    check_date = datetime.fromisoformat(date).date()
                except:
                    return "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD"
                
                # Lấy todos trong ngày
                start_of_day = datetime.combine(check_date, datetime.min.time())
                end_of_day = datetime.combine(check_date, datetime.max.time())
                
                todos = self.db.query(Todo).filter(
                    Todo.user_id == user_id,
                    Todo.due_time >= start_of_day,
                    Todo.due_time <= end_of_day
                ).order_by(Todo.due_time.asc()).all()
                
                if not todos:
                    return f"Ngày {check_date.strftime('%d/%m/%Y')} bạn hoàn toàn rảnh!"
                
                # Phân tích thời gian rảnh
                busy_slots = []
                for todo in todos:
                    if todo.due_time:
                        busy_slots.append({
                            "time": todo.due_time.strftime("%H:%M"),
                            "title": todo.title,
                            "duration": 60  # Giả sử mỗi todo mất 1 giờ
                        })
                
                result = f"Lịch trình ngày {check_date.strftime('%d/%m/%Y')}:\n"
                for slot in busy_slots:
                    result += f"• {slot['time']} - {slot['title']}\n"
                
                # Gợi ý thời gian rảnh
                free_slots = self._find_free_slots(busy_slots)
                if free_slots:
                    result += f"\nThời gian rảnh:\n"
                    for slot in free_slots:
                        result += f"• {slot}\n"
                
                return result
                
            except Exception as e:
                logger.error(f"Error in check_availability_tool: {e}")
                return f"Lỗi khi kiểm tra thời gian rảnh: {e}"
        
        return [
            get_schedule_tool,
            search_todos_tool,
            create_todo_tool,
            update_todo_tool,
            auto_tag_todo_tool,
            check_availability_tool
        ]
    
    def _find_free_slots(self, busy_slots: List[Dict]) -> List[str]:
        """
        Tìm thời gian rảnh trong ngày
        """
        free_slots = []
        work_hours = [(9, 12), (14, 17)]  # Giờ làm việc
        
        for start_hour, end_hour in work_hours:
            current_time = start_hour * 60  # Convert to minutes
            end_time = end_hour * 60
            
            for slot in busy_slots:
                slot_time = int(slot["time"].split(":")[0]) * 60 + int(slot["time"].split(":")[1])
                slot_duration = slot["duration"]
                
                if current_time < slot_time:
                    # Có thời gian rảnh trước slot này
                    free_start = f"{current_time // 60:02d}:{current_time % 60:02d}"
                    free_end = f"{slot_time // 60:02d}:{slot_time % 60:02d}"
                    free_slots.append(f"{free_start} - {free_end}")
                
                current_time = slot_time + slot_duration
            
            # Kiểm tra thời gian rảnh cuối ngày
            if current_time < end_time:
                free_start = f"{current_time // 60:02d}:{current_time % 60:02d}"
                free_end = f"{end_time // 60:02d}:{end_time % 60:02d}"
                free_slots.append(f"{free_start} - {free_end}")
        
        return free_slots
    
    def _create_todo_direct(self, user_id: str, title: str, description: str = "") -> str:
        """
        Tạo todo trực tiếp mà không qua tool decorator
        """
        try:
            # Sử dụng Smart Logic Engine
            analysis = self.smart_engine.analyze_todo_content(title, description)
            
            # Parse due_time từ analysis
            parsed_due_time = analysis["suggested_deadline"]
            
            # Sử dụng smart_title thay vì title gốc
            smart_title = analysis.get("smart_title", title)
            
            # Tạo todo
            todo = Todo(
                title=smart_title,
                description=description,
                due_time=parsed_due_time,
                group_id=analysis["suggested_group"],
                is_important=(analysis["suggested_priority"] == "high"),
                user_id=user_id
            )
            
            self.db.add(todo)
            self.db.commit()
            self.db.refresh(todo)
            
            # Tạo tags thông minh và link với todo
            if analysis["suggested_tags"]:
                tag_ids = self.smart_engine.create_smart_tags(analysis["suggested_tags"], user_id)
                # Link tags với todo
                from ..models.tag import Tag
                tags = self.db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
                todo.tags = tags
                self.db.commit()
                self.db.refresh(todo)
            
            # Tạo embedding và lưu vào vector database
            try:
                from ..tasks.embedding_tasks import create_todo_embedding_task
                # Tạo embedding cho todo mới
                create_todo_embedding_task.delay(str(todo.id))
                logger.info(f"Created embedding task for todo {todo.id}")
            except Exception as e:
                logger.error(f"Error creating embedding task for todo {todo.id}: {e}")
                # Không fail todo creation nếu embedding task fail
            
            # Format response như AI trong ảnh
            result = f"✅ Todo đã được tạo thành công!\n\n"
            
            # Thông tin todo với smart_title
            result += f"**Tiêu đề:** {smart_title}\n"
            if parsed_due_time:
                result += f"**Thời gian:** {parsed_due_time.strftime('%H:%M ngày %d/%m/%Y')}\n"
            if analysis['suggested_tags']:
                result += f"**Tag:** {', '.join(analysis['suggested_tags'])}\n"
            
            # Smart suggestions
            if analysis.get('smart_suggestions'):
                result += f"\n**Gợi ý:** 💡\n"
                for suggestion in analysis['smart_suggestions']:
                    result += f"• {suggestion}\n"
            
            return result
            
        except Exception as e:
            logger.error(f"Error in _create_todo_direct: {e}")
            return f"Lỗi khi tạo todo: {e}"
    
    def _search_todos_direct(self, user_id: str, query: str, limit: int = 5) -> str:
        """
        Tìm kiếm todos trực tiếp
        """
        try:
            # Sử dụng vector search
            similar_todos = self.vector_service.search_similar_todos(query, user_id, limit)
            
            if not similar_todos:
                return f"Không tìm thấy todo nào liên quan đến '{query}'"
            
            result = f"Tìm thấy {len(similar_todos)} todos liên quan:\n"
            for todo_data in similar_todos:
                similarity = todo_data["similarity"]
                content = todo_data["content"]
                result += f"• {content} (Độ tương tự: {similarity:.2f})\n"
            
            return result
            
        except Exception as e:
            logger.error(f"Error in _search_todos_direct: {e}")
            return f"Lỗi khi tìm kiếm: {e}"
    
    def _get_schedule_direct(self, user_id: str, time_range: str = "week") -> str:
        """
        Lấy lịch trình trực tiếp
        """
        try:
            now = datetime.now()
            query = self.db.query(Todo).filter(Todo.user_id == user_id)
            
            if time_range == "today":
                today = now.date()
                query = query.filter(Todo.due_time >= now.replace(hour=0, minute=0, second=0))
                query = query.filter(Todo.due_time <= now.replace(hour=23, minute=59, second=59))
            elif time_range == "week":
                week_start = now - timedelta(days=now.weekday())
                week_end = week_start + timedelta(days=7)
                query = query.filter(Todo.due_time >= week_start)
                query = query.filter(Todo.due_time <= week_end)
            elif time_range == "month":
                month_start = now.replace(day=1, hour=0, minute=0, second=0)
                if now.month == 12:
                    month_end = now.replace(year=now.year+1, month=1, day=1)
                else:
                    month_end = now.replace(month=now.month+1, day=1)
                query = query.filter(Todo.due_time >= month_start)
                query = query.filter(Todo.due_time <= month_end)
            
            todos = query.order_by(Todo.due_time.asc()).all()
            
            if not todos:
                return f"Không có việc nào trong {time_range}"
            
            result = f"Lịch trình {time_range}:\n"
            for todo in todos:
                due_time = todo.due_time.strftime("%d/%m/%Y %H:%M") if todo.due_time else "Chưa có thời gian"
                priority = "🔥" if todo.is_important else "📝"
                result += f"{priority} {todo.title} - {due_time}\n"
            
            return result
            
        except Exception as e:
            logger.error(f"Error in _get_schedule_direct: {e}")
            return f"Lỗi khi lấy lịch trình: {e}"
    
    def _parse_availability_period(self, time_period: str, now: datetime, vn_tz) -> tuple:
        """
        Parse time period cho availability command - hỗ trợ 3 kiểu:
        1. today/week
        2. ngày cụ thể (30/10, ngày 30 tháng 10)
        3. hôm nay/ngày mai
        """
        from datetime import datetime, timedelta
        import re
        
        time_period = time_period.lower().strip()
        
        # Kiểu 1: today/week
        if time_period in ['today', 'hôm nay', 'ngày hôm nay']:
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            return start_time, end_time, "hôm nay"
            
        elif time_period in ['week', 'tuần này', 'this week']:
            start_time = now - timedelta(days=now.weekday())
            start_time = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = start_time + timedelta(days=6, hours=23, minutes=59, seconds=59)
            return start_time, end_time, "tuần này"
            
        elif time_period in ['tomorrow', 'ngày mai']:
            tomorrow = now + timedelta(days=1)
            start_time = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)
            return start_time, end_time, "ngày mai"
        
        # Kiểu 2: ngày cụ thể (30/10, ngày 30 tháng 10)
        # Pattern 1: dd/mm hoặc dd/mm/yyyy
        date_pattern1 = r'(\d{1,2})/(\d{1,2})(?:/(\d{4}))?'
        match1 = re.search(date_pattern1, time_period)
        if match1:
            day = int(match1.group(1))
            month = int(match1.group(2))
            year = int(match1.group(3)) if match1.group(3) else now.year
            
            try:
                target_date = datetime(year, month, day, tzinfo=vn_tz)
                start_time = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_time = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                period_name = f"ngày {day}/{month}/{year}"
                return start_time, end_time, period_name
            except ValueError:
                pass
        
        # Pattern 2: "ngày X tháng Y"
        date_pattern2 = r'ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})'
        match2 = re.search(date_pattern2, time_period)
        if match2:
            day = int(match2.group(1))
            month = int(match2.group(2))
            year = now.year
            
            try:
                target_date = datetime(year, month, day, tzinfo=vn_tz)
                start_time = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_time = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                period_name = f"ngày {day} tháng {month}"
                return start_time, end_time, period_name
            except ValueError:
                pass
        
        # Kiểu 3: các từ khóa khác
        if 'hôm nay' in time_period or 'today' in time_period:
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            return start_time, end_time, "hôm nay"
            
        elif 'ngày mai' in time_period or 'tomorrow' in time_period:
            tomorrow = now + timedelta(days=1)
            start_time = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)
            return start_time, end_time, "ngày mai"
        
        # Default: hôm nay
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        return start_time, end_time, "hôm nay"
    
    def _check_availability_direct(self, user_id: str, time_period: str = "today") -> str:
        """
        Kiểm tra thời gian rảnh dựa trên todos hiện tại
        """
        try:
            from ..models.todo import Todo
            from datetime import datetime, timedelta
            import pytz
            
            vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
            now = datetime.now(vn_tz)
            
            # Parse time period - 3 kiểu input
            start_time, end_time, period_name = self._parse_availability_period(time_period, now, vn_tz)
            
            # Lấy todos trong khoảng thời gian
            todos = self.db.query(Todo).filter(
                Todo.user_id == user_id,
                Todo.due_time.isnot(None),
                Todo.due_time >= start_time.isoformat(),
                Todo.due_time <= end_time.isoformat(),
                Todo.is_completed == False
            ).order_by(Todo.due_time).all()
            
            if not todos:
                return f"🎉 **Thời gian rảnh {period_name}:**\n\nBạn hoàn toàn rảnh rỗi! Không có task nào được lên lịch."
            
            # Phân tích thời gian rảnh
            busy_periods = []
            for todo in todos:
                if todo.due_time:
                    try:
                        # Handle both string and datetime objects
                        if isinstance(todo.due_time, str):
                            due_time = datetime.fromisoformat(todo.due_time.replace('Z', '+00:00'))
                        else:
                            due_time = todo.due_time
                        
                        # Convert to Vietnam timezone if needed
                        if due_time.tzinfo is None:
                            due_time = vn_tz.localize(due_time)
                        elif due_time.tzinfo != vn_tz:
                            due_time = due_time.astimezone(vn_tz)
                            
                        busy_periods.append({
                            'title': todo.title,
                            'time': due_time.strftime('%H:%M'),
                            'date': due_time.strftime('%d/%m'),
                            'is_important': todo.is_important
                        })
                    except Exception as e:
                        logger.error(f"Error parsing due_time for todo {todo.id}: {e}")
                        continue
            
            # Tìm khoảng trống
            free_periods = []
            if busy_periods:
                # Sort by time to ensure proper order
                busy_periods.sort(key=lambda x: x['time'])
                
                for i, period in enumerate(busy_periods):
                    if i == 0:
                        # Khoảng trống trước task đầu tiên
                        if period['time'] > '09:00':
                            free_periods.append(f"🌅 **Sáng sớm:** 09:00 - {period['time']}")
                    else:
                        # Khoảng trống giữa các tasks
                        prev_time = busy_periods[i-1]['time']
                        current_time = period['time']
                        # Convert to comparable format for time comparison
                        prev_hour, prev_min = map(int, prev_time.split(':'))
                        curr_hour, curr_min = map(int, current_time.split(':'))
                        
                        if (prev_hour * 60 + prev_min) < (curr_hour * 60 + curr_min):
                            # Check if there's at least 1 hour gap
                            time_diff = (curr_hour * 60 + curr_min) - (prev_hour * 60 + prev_min)
                            if time_diff >= 60:  # At least 1 hour
                                free_periods.append(f"⏰ **Giữa {prev_time} - {current_time}:** Có thể sắp xếp task ngắn")
            
            # Tạo response
            response = f"📅 **Lịch trình {period_name}:**\n\n"
            
            if busy_periods:
                response += "**📋 Tasks đã lên lịch:**\n"
                for period in busy_periods:
                    importance = "⭐" if period['is_important'] else ""
                    response += f"• {importance} **{period['time']}** - {period['title']}\n"
                
                if free_periods:
                    response += f"\n**🕐 Thời gian rảnh:**\n"
                    for period in free_periods:
                        response += f"• {period}\n"
                else:
                    response += f"\n⚠️ **Lịch trình khá kín!** Hãy cân nhắc sắp xếp lại."
            else:
                response += "🎉 **Hoàn toàn rảnh rỗi!** Bạn có thể lên kế hoạch mới."
            
            return response
            
        except Exception as e:
            logger.error(f"Error in _check_availability_direct: {e}")
            return f"Lỗi khi kiểm tra thời gian rảnh: {e}"
    
    def _update_todo_direct(self, user_id: str, update_info: str) -> str:
        """
        Cập nhật todo dựa trên thông tin được cung cấp
        """
        try:
            from ..models.todo import Todo
            from ..services.smart_logic_engine import get_smart_logic_engine
            
            # Parse update info - format: "todo_id new_title" hoặc "todo_title new_title"
            parts = update_info.split(' ', 1)
            if len(parts) < 2:
                return "Vui lòng cung cấp đủ thông tin. Ví dụ: /update [todo_id hoặc title] [nội dung mới]"
            
            todo_identifier = parts[0]
            new_content = parts[1]
            
            # Tìm todo theo ID hoặc title
            todo = None
            try:
                # Thử tìm theo ID trước
                todo = self.db.query(Todo).filter(
                    Todo.id == todo_identifier,
                    Todo.user_id == user_id
                ).first()
            except:
                pass
            
            if not todo:
                # Tìm theo title (partial match)
                todos = self.db.query(Todo).filter(
                    Todo.user_id == user_id,
                    Todo.title.ilike(f"%{todo_identifier}%")
                ).all()
                
                if len(todos) == 1:
                    todo = todos[0]
                elif len(todos) > 1:
                    # Nếu có nhiều kết quả, trả về danh sách để user chọn
                    todo_list = "\n".join([f"• {t.id[:8]}... - {t.title}" for t in todos[:5]])
                    return f"Tìm thấy {len(todos)} todos khớp với '{todo_identifier}':\n\n{todo_list}\n\nVui lòng sử dụng ID cụ thể."
                else:
                    return f"Không tìm thấy todo nào khớp với '{todo_identifier}'"
            
            # Sử dụng Smart Logic Engine để phân tích nội dung mới
            smart_engine = get_smart_logic_engine(self.db)
            analysis = smart_engine.analyze_todo_content(new_content, todo.description or "")
            
            # Cập nhật todo
            old_title = todo.title
            todo.title = analysis.get("smart_title", new_content)
            
            # Cập nhật các thông tin khác nếu có
            if analysis.get("suggested_deadline"):
                todo.due_time = analysis["suggested_deadline"]
            
            if analysis.get("suggested_priority") == "high":
                todo.is_important = True
            
            # Cập nhật tags thông minh
            if analysis.get("suggested_tags"):
                smart_tag_ids = smart_engine.create_smart_tags(analysis["suggested_tags"], user_id)
                if smart_tag_ids:
                    # Lấy tags mới
                    from ..models.tag import Tag
                    new_tags = self.db.query(Tag).filter(Tag.id.in_(smart_tag_ids)).all()
                    todo.tags = new_tags
            
            self.db.commit()
            self.db.refresh(todo)
            
            # Cập nhật embedding trong vector database
            try:
                from ..tasks.embedding_tasks import update_todo_embedding_task
                # Cập nhật embedding cho todo đã sửa
                update_todo_embedding_task.delay(str(todo.id))
                logger.info(f"Updated embedding task for todo {todo.id}")
            except Exception as e:
                logger.error(f"Error updating embedding task for todo {todo.id}: {e}")
                # Không fail todo update nếu embedding task fail
            
            # Tạo response
            response = f"✅ **Đã cập nhật todo thành công!**\n\n"
            response += f"**Trước:** {old_title}\n"
            response += f"**Sau:** {todo.title}\n"
            
            if todo.due_time:
                try:
                    from datetime import datetime
                    import pytz
                    vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
                    
                    if isinstance(todo.due_time, str):
                        due_date = datetime.fromisoformat(todo.due_time.replace('Z', '+00:00'))
                    else:
                        due_date = todo.due_time
                    
                    # Convert to Vietnam timezone
                    if due_date.tzinfo is None:
                        due_date = vn_tz.localize(due_date)
                    elif due_date.tzinfo != vn_tz:
                        due_date = due_date.astimezone(vn_tz)
                    
                    response += f"**Deadline:** {due_date.strftime('%d/%m/%Y %H:%M')}\n"
                except Exception as e:
                    logger.error(f"Error formatting due_time: {e}")
                    response += f"**Deadline:** {todo.due_time}\n"
            
            if todo.is_important:
                response += f"**⭐ Đánh dấu quan trọng**\n"
            
            if todo.tags:
                tag_names = [tag.name for tag in todo.tags]
                response += f"**🏷️ Tags:** {', '.join(tag_names)}\n"
            
            # Thêm gợi ý thông minh
            if analysis.get("smart_suggestions"):
                response += f"\n**💡 Gợi ý:** {analysis['smart_suggestions']}"
            
            return response
            
        except Exception as e:
            logger.error(f"Error in _update_todo_direct: {e}")
            return f"Lỗi khi cập nhật todo: {e}"
    
    def _handle_slash_command(self, command: str) -> str:
        """
        Xử lý slash commands và gọi functions tương ứng
        """
        try:
            command_parts = command.split(' ', 1)
            cmd = command_parts[0].lower()
            args = command_parts[1] if len(command_parts) > 1 else ""
            
            user_id = str(self.user_id)
            
            if cmd == '/todo':
                # Parse todo từ args
                if not args:
                    return "Vui lòng cung cấp nội dung todo. Ví dụ: /todo Họp team lúc 2pm"
                
                # Gọi create_todo_tool trực tiếp
                result = self._create_todo_direct(user_id, args, "")
                return result
                
            elif cmd == '/search':
                if not args:
                    return "Vui lòng cung cấp từ khóa tìm kiếm. Ví dụ: /search họp team"
                
                # Gọi search_todos_direct
                result = self._search_todos_direct(user_id, args, 5)
                return result
                
            elif cmd == '/schedule':
                time_range = args.lower() if args else "week"
                if time_range not in ['today', 'week', 'month']:
                    time_range = "week"
                
                # Gọi get_schedule_direct
                result = self._get_schedule_direct(user_id, time_range)
                return result
                
            elif cmd == '/tags':
                return "Tính năng gán tags tự động đang được phát triển. Vui lòng sử dụng UI để gán tags."
                
            elif cmd == '/availability':
                # Kiểm tra thời gian rảnh dựa trên todos hiện tại
                result = self._check_availability_direct(user_id, args)
                return result
                
            elif cmd == '/update':
                # Cập nhật todo dựa trên args
                if not args:
                    return "Vui lòng cung cấp thông tin cập nhật. Ví dụ: /update [todo_id] [nội dung mới]"
                
                result = self._update_todo_direct(user_id, args)
                return result
                
            elif cmd == '/help':
                return """**Slash Commands Help:**

• `/todo <nội dung>` - Tạo todo mới
• `/search <từ khóa>` - Tìm kiếm todos
• `/schedule [today/week/month]` - Xem lịch trình
• `/tags <todo_id>` - Gán tags tự động
• `/availability [today/week/ngày cụ thể]` - Kiểm tra thời gian rảnh
• `/update <todo_id hoặc title> <nội dung mới>` - Cập nhật todo
• `/help` - Xem hướng dẫn này

**Ví dụ:**
• `/todo Họp team lúc 2pm`
• `/search họp team`
• `/schedule today`
• `/availability today`
• `/availability 30/10`
• `/availability ngày 30 tháng 10`
• `/availability ngày mai`
• `/update abc123 Họp team mới lúc 3pm`"""
                
            else:
                return f"Không nhận diện được command '{cmd}'. Gõ `/help` để xem danh sách commands."
                
        except Exception as e:
            logger.error(f"Error handling slash command: {e}")
            return f"Lỗi khi xử lý command: {str(e)}"
    
    def chat(self, message: str, session_id: str) -> Dict[str, Any]:
        """
        Chat với agent
        """
        try:
            # Lấy conversation history
            chat_history = self.memory_service.get_messages(session_id)
            
            # Convert to LangChain messages
            messages = []
            for msg in chat_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
            
            # Thêm message hiện tại
            messages.append(HumanMessage(content=message))
            
            # Lưu user message
            self.memory_service.add_user_message(session_id, message)
            
            # Check for slash commands and execute functions
            if message.startswith('[SLASH_COMMAND]'):
                # Extract the actual command
                actual_message = message.replace('[SLASH_COMMAND]', '').strip()
                agent_response = self._handle_slash_command(actual_message)
            else:
                # Gọi LLM trực tiếp cho normal chat
                try:
                    # Format messages với prompt template
                    formatted_messages = self.prompt.format_messages(
                        input=message,
                        chat_history=messages[:-1]  # Exclude current message
                    )
                    
                    # Gọi LLM
                    response = self.llm.invoke(formatted_messages)
                    # Ollama trả về string, không phải object có .content
                    if hasattr(response, 'content'):
                        agent_response = response.content
                    else:
                        agent_response = str(response)
                    
                except Exception as e:
                    logger.error(f"Error calling LLM: {e}")
                    agent_response = f"Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn: {str(e)}"
            
            # Lưu assistant response
            self.memory_service.add_assistant_message(session_id, agent_response)
            
            # Gia hạn session
            self.memory_service.extend_session_ttl(session_id)
            
            return {
                "response": agent_response,
                "session_id": session_id,
                "user_id": str(self.user_id),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in agent chat: {e}")
            return {
                "response": f"Xin lỗi, có lỗi xảy ra: {e}",
                "session_id": session_id,
                "user_id": str(self.user_id),
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
    
    def get_conversation_summary(self, session_id: str) -> Dict[str, Any]:
        """
        Lấy summary của conversation
        """
        return self.memory_service.get_conversation_summary(session_id)
    
    def clear_conversation(self, session_id: str) -> bool:
        """
        Xóa conversation history
        """
        return self.memory_service.clear_session(session_id)
    
    def health_check(self) -> Dict[str, bool]:
        """
        Kiểm tra health của các components
        """
        return {
            "llm": True,  # Ollama connection check có thể thêm sau
            "vector_service": self.vector_service.health_check(),
            "memory_service": self.memory_service.health_check()
        }


# Global instance
_agent = None

def get_conversational_agent(db: Session, user_id: UUID) -> ConversationalTodoAgent:
    """
    Factory function để tạo ConversationalTodoAgent instance
    """
    return ConversationalTodoAgent(db, user_id)

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
    Conversational AI Agent sử dụng LangChain + Qwen3:4b
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
            - Tạo todo mới với phân tích thông minh
            - Cập nhật và quản lý todos
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
                
                # Tạo tags thông minh
                if analysis["suggested_tags"]:
                    tag_ids = self.smart_engine.create_smart_tags(analysis["suggested_tags"], user_id)
                
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
            
            # Gọi LLM trực tiếp
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

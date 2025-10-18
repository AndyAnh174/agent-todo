import redis
import json
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta
from ..config import settings

logger = logging.getLogger(__name__)


class ConversationMemoryService:
    """
    Service để quản lý conversation memory với Redis
    """
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.redis_url)
        self.session_ttl = 86400  # 24 hours
        self.max_messages = 50  # Giới hạn số messages trong session
    
    def get_messages(self, session_id: str) -> List[Dict[str, str]]:
        """
        Lấy conversation history từ Redis
        """
        try:
            key = f"agent:chat:{session_id}"
            messages_json = self.redis_client.get(key)
            
            if messages_json:
                messages = json.loads(messages_json)
                logger.info(f"Retrieved {len(messages)} messages for session {session_id}")
                return messages
            else:
                logger.info(f"No messages found for session {session_id}")
                return []
                
        except Exception as e:
            logger.error(f"Failed to get messages for session {session_id}: {e}")
            return []
    
    def add_message(self, session_id: str, role: str, content: str) -> bool:
        """
        Thêm message vào conversation history
        """
        try:
            key = f"agent:chat:{session_id}"
            
            # Lấy messages hiện tại
            messages = self.get_messages(session_id)
            
            # Thêm message mới
            new_message = {
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat()
            }
            messages.append(new_message)
            
            # Giới hạn số messages
            if len(messages) > self.max_messages:
                messages = messages[-self.max_messages:]
            
            # Lưu vào Redis
            messages_json = json.dumps(messages, ensure_ascii=False)
            self.redis_client.setex(key, self.session_ttl, messages_json)
            
            logger.info(f"Added message to session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add message to session {session_id}: {e}")
            return False
    
    def add_user_message(self, session_id: str, content: str) -> bool:
        """
        Thêm user message
        """
        return self.add_message(session_id, "user", content)
    
    def add_assistant_message(self, session_id: str, content: str) -> bool:
        """
        Thêm assistant message
        """
        return self.add_message(session_id, "assistant", content)
    
    def clear_session(self, session_id: str) -> bool:
        """
        Xóa conversation history của session
        """
        try:
            key = f"agent:chat:{session_id}"
            result = self.redis_client.delete(key)
            
            if result:
                logger.info(f"Cleared session {session_id}")
                return True
            else:
                logger.warning(f"Session {session_id} not found")
                return False
                
        except Exception as e:
            logger.error(f"Failed to clear session {session_id}: {e}")
            return False
    
    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """
        Lấy thông tin về session
        """
        try:
            key = f"agent:chat:{session_id}"
            ttl = self.redis_client.ttl(key)
            messages = self.get_messages(session_id)
            
            return {
                "session_id": session_id,
                "message_count": len(messages),
                "ttl_seconds": ttl,
                "last_message": messages[-1] if messages else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get session info for {session_id}: {e}")
            return {
                "session_id": session_id,
                "message_count": 0,
                "ttl_seconds": -1,
                "last_message": None
            }
    
    def extend_session_ttl(self, session_id: str) -> bool:
        """
        Gia hạn TTL của session
        """
        try:
            key = f"agent:chat:{session_id}"
            result = self.redis_client.expire(key, self.session_ttl)
            
            if result:
                logger.info(f"Extended TTL for session {session_id}")
                return True
            else:
                logger.warning(f"Session {session_id} not found for TTL extension")
                return False
                
        except Exception as e:
            logger.error(f"Failed to extend TTL for session {session_id}: {e}")
            return False
    
    def get_active_sessions(self) -> List[str]:
        """
        Lấy danh sách các session đang active
        """
        try:
            pattern = "agent:chat:*"
            keys = self.redis_client.keys(pattern)
            session_ids = [key.decode().replace("agent:chat:", "") for key in keys]
            
            logger.info(f"Found {len(session_ids)} active sessions")
            return session_ids
            
        except Exception as e:
            logger.error(f"Failed to get active sessions: {e}")
            return []
    
    def cleanup_expired_sessions(self) -> int:
        """
        Dọn dẹp các session đã hết hạn
        """
        try:
            # Redis tự động xóa keys hết TTL, không cần cleanup manual
            active_sessions = self.get_active_sessions()
            logger.info(f"Active sessions after cleanup: {len(active_sessions)}")
            return len(active_sessions)
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired sessions: {e}")
            return 0
    
    def get_conversation_summary(self, session_id: str) -> Dict[str, Any]:
        """
        Tạo summary của conversation
        """
        try:
            messages = self.get_messages(session_id)
            
            if not messages:
                return {
                    "session_id": session_id,
                    "message_count": 0,
                    "user_messages": 0,
                    "assistant_messages": 0,
                    "summary": "No conversation found"
                }
            
            user_messages = len([m for m in messages if m["role"] == "user"])
            assistant_messages = len([m for m in messages if m["role"] == "assistant"])
            
            # Tạo summary từ 3 messages gần nhất
            recent_messages = messages[-3:] if len(messages) >= 3 else messages
            summary_parts = []
            
            for msg in recent_messages:
                role = "User" if msg["role"] == "user" else "Assistant"
                content = msg["content"][:100] + "..." if len(msg["content"]) > 100 else msg["content"]
                summary_parts.append(f"{role}: {content}")
            
            return {
                "session_id": session_id,
                "message_count": len(messages),
                "user_messages": user_messages,
                "assistant_messages": assistant_messages,
                "summary": " | ".join(summary_parts)
            }
            
        except Exception as e:
            logger.error(f"Failed to get conversation summary for {session_id}: {e}")
            return {
                "session_id": session_id,
                "message_count": 0,
                "user_messages": 0,
                "assistant_messages": 0,
                "summary": "Error generating summary"
            }
    
    def health_check(self) -> bool:
        """
        Kiểm tra Redis connection
        """
        try:
            self.redis_client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False


# Global instance
_memory_service = None

def get_memory_service() -> ConversationMemoryService:
    """
    Factory function để tạo ConversationMemoryService instance
    """
    global _memory_service
    if _memory_service is None:
        _memory_service = ConversationMemoryService()
    return _memory_service

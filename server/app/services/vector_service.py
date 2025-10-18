from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List, Dict, Any, Optional
import uuid
import logging
from ..config import settings
from .embedding_service import get_embedding_service

logger = logging.getLogger(__name__)


class QdrantVectorService:
    """
    Service để quản lý vector database với Qdrant
    """
    
    def __init__(self):
        self.client = QdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port
        )
        self.collection_name = settings.qdrant_collection
        self.embedding_service = get_embedding_service()
        self.vector_size = self.embedding_service.get_embedding_dimension()
        
        # Tạo collection nếu chưa có
        self._create_collection()
    
    def _create_collection(self):
        """
        Tạo collection trong Qdrant nếu chưa tồn tại
        """
        try:
            # Kiểm tra collection đã tồn tại chưa
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                # Tạo collection mới
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,  # BGE-M3 dimension = 1024
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
            else:
                logger.info(f"Qdrant collection already exists: {self.collection_name}")
                
        except Exception as e:
            logger.error(f"Failed to create Qdrant collection: {e}")
            # Không raise exception để tránh crash app, chỉ log error
            logger.warning(f"Qdrant collection '{self.collection_name}' may not be available")
    
    def add_todo_embedding(self, todo_id: str, content: str, metadata: Dict[str, Any]) -> str:
        """
        Thêm embedding cho todo vào Qdrant
        """
        try:
            # Tạo embedding
            embedding = self.embedding_service.encode_text(content)
            
            # Tạo point ID
            point_id = str(uuid.uuid4())
            
            # Tạo point
            point = PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "todo_id": todo_id,
                    "content": content,
                    **metadata
                }
            )
            
            # Thêm vào Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            logger.info(f"Added embedding for todo {todo_id}")
            return point_id
            
        except Exception as e:
            logger.error(f"Failed to add todo embedding: {e}")
            raise Exception(f"Failed to add todo embedding: {e}")
    
    def search_similar_todos(self, query: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Tìm kiếm todos tương tự bằng vector search
        """
        try:
            # Tạo embedding cho query
            query_embedding = self.embedding_service.encode_text(query)
            
            # Vector search với filter theo user_id
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="user_id",
                            match=MatchValue(value=user_id)
                        )
                    ]
                ),
                limit=limit
            )
            
            # Format kết quả
            results = []
            for hit in search_result:
                results.append({
                    "todo_id": hit.payload.get("todo_id"),
                    "content": hit.payload.get("content"),
                    "similarity": hit.score,
                    "metadata": {k: v for k, v in hit.payload.items() 
                               if k not in ["todo_id", "content"]}
                })
            
            logger.info(f"Found {len(results)} similar todos for query: {query[:50]}...")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar todos: {e}")
            raise Exception(f"Vector search failed: {e}")
    
    def update_todo_embedding(self, todo_id: str, content: str, metadata: Dict[str, Any]) -> str:
        """
        Cập nhật embedding khi todo thay đổi
        """
        try:
            # Xóa embedding cũ
            self.delete_todo_embedding(todo_id)
            
            # Thêm embedding mới
            return self.add_todo_embedding(todo_id, content, metadata)
            
        except Exception as e:
            logger.error(f"Failed to update todo embedding: {e}")
            raise Exception(f"Failed to update todo embedding: {e}")
    
    def delete_todo_embedding(self, todo_id: str) -> bool:
        """
        Xóa embedding của todo
        """
        try:
            # Tìm và xóa points có todo_id
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="todo_id",
                            match=MatchValue(value=todo_id)
                        )
                    ]
                )
            )
            
            logger.info(f"Deleted embedding for todo {todo_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete todo embedding: {e}")
            return False
    
    def get_todo_embedding(self, todo_id: str) -> Optional[Dict[str, Any]]:
        """
        Lấy embedding của todo
        """
        try:
            # Tìm point theo todo_id
            search_result = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="todo_id",
                            match=MatchValue(value=todo_id)
                        )
                    ]
                ),
                limit=1
            )
            
            if search_result[0]:  # Có kết quả
                point = search_result[0][0]
                return {
                    "id": point.id,
                    "vector": point.vector,
                    "payload": point.payload
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get todo embedding: {e}")
            return None
    
    def batch_add_embeddings(self, embeddings_data: List[Dict[str, Any]]) -> List[str]:
        """
        Thêm nhiều embeddings cùng lúc
        """
        try:
            points = []
            point_ids = []
            
            for data in embeddings_data:
                todo_id = data["todo_id"]
                content = data["content"]
                metadata = data["metadata"]
                
                # Tạo embedding
                embedding = self.embedding_service.encode_text(content)
                
                # Tạo point
                point_id = str(uuid.uuid4())
                point = PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "todo_id": todo_id,
                        "content": content,
                        **metadata
                    }
                )
                
                points.append(point)
                point_ids.append(point_id)
            
            # Batch upsert
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"Batch added {len(points)} embeddings")
            return point_ids
            
        except Exception as e:
            logger.error(f"Failed to batch add embeddings: {e}")
            raise Exception(f"Batch embedding addition failed: {e}")
    
    def get_collection_info(self) -> Dict[str, Any]:
        """
        Lấy thông tin về collection
        """
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return {
                "name": collection_info.config.params.vectors.size,
                "vector_size": collection_info.config.params.vectors.size,
                "distance": collection_info.config.params.vectors.distance,
                "points_count": collection_info.points_count
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {}
    
    def health_check(self) -> bool:
        """
        Kiểm tra Qdrant có hoạt động không
        """
        try:
            collections = self.client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False


# Global instance
_vector_service = None

def get_vector_service() -> QdrantVectorService:
    """
    Factory function để tạo QdrantVectorService instance
    """
    global _vector_service
    if _vector_service is None:
        _vector_service = QdrantVectorService()
    return _vector_service

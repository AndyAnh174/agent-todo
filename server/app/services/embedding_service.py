import requests
import numpy as np
from typing import List, Dict, Any, Optional
import json
import logging
from ..config import settings

logger = logging.getLogger(__name__)


class BGE3EmbeddingService:
    """
    Service để tạo embeddings sử dụng BGE-M3 API
    """
    
    def __init__(self):
        self.api_url = settings.bge3_api_url
        self.max_length = 512
        self.timeout = 30
    
    def encode_text(self, text: str) -> List[float]:
        """
        Tạo embedding cho một text
        """
        try:
            payload = {
                "texts": [text],
                "max_length": self.max_length
            }
            
            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["embeddings"][0]
            else:
                logger.error(f"BGE3 API error: {response.status_code} - {response.text}")
                raise Exception(f"Embedding API error: {response.status_code}")
                
        except requests.exceptions.Timeout:
            logger.error("BGE3 API timeout")
            raise Exception("Embedding API timeout")
        except requests.exceptions.RequestException as e:
            logger.error(f"BGE3 API request error: {e}")
            raise Exception(f"Embedding API request error: {e}")
        except Exception as e:
            logger.error(f"BGE3 embedding error: {e}")
            raise Exception(f"Embedding generation failed: {e}")
    
    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Tạo embeddings cho nhiều text cùng lúc
        """
        try:
            payload = {
                "texts": texts,
                "max_length": self.max_length
            }
            
            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["embeddings"]
            else:
                logger.error(f"BGE3 API error: {response.status_code} - {response.text}")
                raise Exception(f"Embedding API error: {response.status_code}")
                
        except requests.exceptions.Timeout:
            logger.error("BGE3 API timeout")
            raise Exception("Embedding API timeout")
        except requests.exceptions.RequestException as e:
            logger.error(f"BGE3 API request error: {e}")
            raise Exception(f"Embedding API request error: {e}")
        except Exception as e:
            logger.error(f"BGE3 batch embedding error: {e}")
            raise Exception(f"Batch embedding generation failed: {e}")
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Tính cosine similarity giữa hai vectors
        """
        try:
            vec1 = np.array(vec1)
            vec2 = np.array(vec2)
            
            # Normalize vectors
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return np.dot(vec1, vec2) / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Cosine similarity calculation error: {e}")
            return 0.0
    
    def get_embedding_dimension(self) -> int:
        """
        Lấy dimension của embedding (BGE-M3 = 1024)
        """
        return 1024
    
    def health_check(self) -> bool:
        """
        Kiểm tra BGE3 API có hoạt động không
        """
        try:
            test_embedding = self.encode_text("test")
            return len(test_embedding) == self.get_embedding_dimension()
        except Exception as e:
            logger.error(f"BGE3 health check failed: {e}")
            return False


# Global instance
_embedding_service = None

def get_embedding_service() -> BGE3EmbeddingService:
    """
    Factory function để tạo BGE3EmbeddingService instance
    """
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = BGE3EmbeddingService()
    return _embedding_service

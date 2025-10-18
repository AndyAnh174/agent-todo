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
            # Clean và truncate text nếu quá dài
            if not text or not text.strip():
                logger.warning("Empty text provided for embedding")
                return [0.0] * self.get_embedding_dimension()
            
            # Truncate text nếu quá dài (BGE-M3 có giới hạn)
            clean_text = text.strip()[:1000]  # Giới hạn 1000 ký tự
            
            payload = {
                "texts": [clean_text],
                "max_length": self.max_length
            }
            
            logger.debug(f"Calling BGE3 API with text: '{clean_text[:50]}...'")
            
            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                embeddings = result.get("embeddings", [])
                if embeddings and len(embeddings) > 0:
                    embedding = embeddings[0]
                    if len(embedding) == self.get_embedding_dimension():
                        logger.debug(f"Successfully generated embedding of length {len(embedding)}")
                        return embedding
                    else:
                        logger.error(f"Invalid embedding dimension: {len(embedding)}, expected {self.get_embedding_dimension()}")
                        return [0.0] * self.get_embedding_dimension()
                else:
                    logger.error("No embeddings returned from API")
                    return [0.0] * self.get_embedding_dimension()
            else:
                logger.error(f"BGE3 API error: {response.status_code} - {response.text}")
                # Return zero vector as fallback
                return [0.0] * self.get_embedding_dimension()
                
        except requests.exceptions.Timeout:
            logger.error("BGE3 API timeout")
            return [0.0] * self.get_embedding_dimension()
        except requests.exceptions.RequestException as e:
            logger.error(f"BGE3 API request error: {e}")
            return [0.0] * self.get_embedding_dimension()
        except Exception as e:
            logger.error(f"BGE3 embedding error: {e}")
            return [0.0] * self.get_embedding_dimension()
    
    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Tạo embeddings cho nhiều text cùng lúc
        """
        try:
            if not texts:
                return []
            
            # Clean và truncate texts
            clean_texts = []
            for text in texts:
                if text and text.strip():
                    clean_texts.append(text.strip()[:1000])
                else:
                    clean_texts.append("")
            
            payload = {
                "texts": clean_texts,
                "max_length": self.max_length
            }
            
            logger.debug(f"Calling BGE3 API with {len(clean_texts)} texts")
            
            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                embeddings = result.get("embeddings", [])
                if embeddings:
                    # Validate embeddings
                    valid_embeddings = []
                    for embedding in embeddings:
                        if embedding and len(embedding) == self.get_embedding_dimension():
                            valid_embeddings.append(embedding)
                        else:
                            valid_embeddings.append([0.0] * self.get_embedding_dimension())
                    logger.debug(f"Successfully generated {len(valid_embeddings)} embeddings")
                    return valid_embeddings
                else:
                    logger.error("No embeddings returned from API")
                    return [[0.0] * self.get_embedding_dimension()] * len(clean_texts)
            else:
                logger.error(f"BGE3 API error: {response.status_code} - {response.text}")
                return [[0.0] * self.get_embedding_dimension()] * len(clean_texts)
                
        except requests.exceptions.Timeout:
            logger.error("BGE3 API timeout")
            return [[0.0] * self.get_embedding_dimension()] * len(texts) if texts else []
        except requests.exceptions.RequestException as e:
            logger.error(f"BGE3 API request error: {e}")
            return [[0.0] * self.get_embedding_dimension()] * len(texts) if texts else []
        except Exception as e:
            logger.error(f"BGE3 batch embedding error: {e}")
            return [[0.0] * self.get_embedding_dimension()] * len(texts) if texts else []
    
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
            return len(test_embedding) == self.get_embedding_dimension() and any(x != 0.0 for x in test_embedding)
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

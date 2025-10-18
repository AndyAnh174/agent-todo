from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID
import logging

from ..dependencies import db_session, get_current_user
from ..schemas.agent import AgentChatRequest, AgentChatResponse, AgentSearchResponse, AgentEmbedAllResponse, AgentHealthResponse, AgentSessionSummaryResponse, AgentSessionResponse
from ..services.langchain_agent import get_conversational_agent, ConversationalTodoAgent
from ..services.embedding_service import get_embedding_service
from ..services.vector_service import get_vector_service
from ..services.conversation_memory import get_memory_service
from ..tasks.embedding_tasks import batch_create_embeddings_task, create_todo_embedding_task, update_todo_embedding_task, delete_todo_embedding_task
from ..models.todo import Todo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/agent", tags=["Agent"])

@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_agent(
    request: AgentChatRequest,
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """
    Chat with the AI agent. The agent can understand natural language,
    use tools to interact with the todo system, and maintain conversation memory.
    """
    logger.info(f"Chat request received for user {user.id}, session {request.session_id}")
    agent_instance: ConversationalTodoAgent = get_conversational_agent(db, user.id)
    response = agent_instance.chat(request.message, request.session_id)
    return response

@router.get("/search", response_model=AgentSearchResponse)
async def semantic_search_todos(
    query: str,
    limit: int = 5,
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """
    Perform a semantic search on user's todos using embeddings.
    """
    logger.info(f"Semantic search request for user {user.id}, query: '{query}'")
    vector_service = get_vector_service()

    try:
        results = vector_service.search_similar_todos(query, str(user.id), limit)
        
        return {
            "query": query,
            "total": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        return {
            "query": query,
            "total": 0,
            "results": []
        }

@router.post("/embed-all", response_model=AgentEmbedAllResponse)
async def embed_all_user_todos(
    limit: int = 100,
    user=Depends(get_current_user)
):
    """
    Trigger a background task to generate embeddings for all existing todos of the current user.
    """
    logger.info(f"Triggering batch embedding for user {user.id}, limit: {limit}")
    task = batch_create_embeddings_task.delay(str(user.id), limit)
    return {
        "message": "Embedding generation started",
        "task_id": task.id,
        "user_id": str(user.id),
        "limit": limit
    }

@router.post("/todo/{todo_id}/embed", status_code=status.HTTP_202_ACCEPTED)
async def embed_single_todo(
    todo_id: UUID,
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """
    Trigger a background task to create embedding for a specific todo.
    """
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    
    create_todo_embedding_task.delay(str(todo_id))
    return {"message": f"Embedding creation task for todo {todo_id} initiated."}

@router.put("/todo/{todo_id}/embed", status_code=status.HTTP_202_ACCEPTED)
async def update_single_todo_embedding(
    todo_id: UUID,
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """
    Trigger a background task to update embedding for a specific todo.
    """
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    
    update_todo_embedding_task.delay(str(todo_id))
    return {"message": f"Embedding update task for todo {todo_id} initiated."}

@router.delete("/todo/{todo_id}/embed", status_code=status.HTTP_202_ACCEPTED)
async def delete_single_todo_embedding(
    todo_id: UUID,
    db: Session = Depends(db_session),
    user=Depends(get_current_user)
):
    """
    Trigger a background task to delete embedding for a specific todo.
    """
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        # If todo is already deleted from DB, still try to delete embedding
        logger.warning(f"Todo {todo_id} not found in DB, but proceeding with embedding deletion.")
    
    delete_todo_embedding_task.delay(str(todo_id))
    return {"message": f"Embedding deletion task for todo {todo_id} initiated."}


@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_agent_session(
    session_id: str,
    user=Depends(get_current_user) # Ensure user is authenticated
):
    """
    Clear the conversation history for a specific agent session.
    """
    logger.info(f"Clearing session {session_id} for user {user.id}")
    memory_service = get_memory_service()
    memory_service.clear_session(session_id)
    return

@router.get("/session/{session_id}/summary", response_model=AgentSessionSummaryResponse)
async def get_session_summary(
    session_id: str,
    user=Depends(get_current_user)
):
    """
    Get a summary or full history of a specific agent session.
    """
    logger.info(f"Getting session summary for session {session_id} for user {user.id}")
    memory_service = get_memory_service()
    messages = memory_service.get_messages(session_id)
    
    # For simplicity, return raw messages. A real summary would involve LLM.
    return {
        "session_id": session_id,
        "user_id": str(user.id),
        "messages": messages,
        "message": "Full conversation history retrieved."
    }

@router.get("/sessions", response_model=List[AgentSessionResponse])
async def get_active_agent_sessions(
    user=Depends(get_current_user)
):
    """
    Get a list of all active agent session IDs for the current user.
    (Note: This currently returns all active sessions in Redis, not filtered by user_id in memory service)
    """
    logger.info(f"Getting active sessions for user {user.id}")
    memory_service = get_memory_service()
    active_session_ids = memory_service.get_active_sessions()
    
    # In a real multi-user system, you'd filter these by user_id if stored in payload
    # For now, assuming session_id implicitly links to user or is managed externally
    return [{"session_id": s_id, "user_id": str(user.id)} for s_id in active_session_ids]


@router.get("/health", response_model=AgentHealthResponse)
async def agent_health_check():
    """
    Performs a health check on the agent's components (Qdrant, Redis, Embedding API).
    """
    logger.info("Performing agent health check.")
    vector_service = get_vector_service()
    memory_service = get_memory_service()
    embedding_service = get_embedding_service()

    health_status = {
        "vector_service": False,
        "memory_service": False,
        "embedding_api": False
    }
    
    try:
        # Check Qdrant - use get_collections() instead of get_collection() to avoid validation errors
        collections = vector_service.client.get_collections()
        # Check if our collection exists
        collection_exists = any(c.name == vector_service.collection_name for c in collections.collections)
        if collection_exists:
            health_status["vector_service"] = True
        else:
            logger.warning(f"Collection '{vector_service.collection_name}' not found")
            health_status["vector_service"] = False
    except Exception as e:
        logger.warning(f"Qdrant health check failed: {e}")
        health_status["vector_service"] = False

    try:
        # Check Redis
        memory_service.redis_client.ping()
        health_status["memory_service"] = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")

    try:
        # Check Embedding API
        test_embedding = embedding_service.encode_text("health check")
        if test_embedding and len(test_embedding) > 0:
            health_status["embedding_api"] = True
    except Exception as e:
        logger.error(f"Embedding API health check failed: {e}")

    overall_healthy = all(health_status.values())
    message = "Health check completed" if overall_healthy else "One or more components are unhealthy"

    return {
        "status": "healthy" if overall_healthy else "unhealthy",
        "components": health_status,
        "message": message
    }
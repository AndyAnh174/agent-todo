from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class AgentChatRequest(BaseModel):
    message: str
    session_id: str


class AgentChatResponse(BaseModel):
    response: str
    session_id: str
    user_id: str
    timestamp: str


class AgentSearchResponse(BaseModel):
    query: str
    total: int
    results: List[Dict[str, Any]]


class AgentEmbedAllResponse(BaseModel):
    message: str
    task_id: str
    user_id: str
    limit: int


class AgentHealthResponse(BaseModel):
    status: str
    components: Dict[str, bool]
    message: str


class AgentSessionSummaryResponse(BaseModel):
    session_id: str
    user_id: str
    messages: List[Dict[str, str]]
    message: str


class AgentSessionResponse(BaseModel):
    session_id: str
    user_id: str

"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiService } from '@/services/api';
import { checkServerHealth, checkAuth } from '@/utils/healthCheck';

// Simple markdown renderer
const renderMarkdown = (text: string) => {
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Bullet points
    .replace(/^• (.*$)/gm, '<span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>$1')
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
};

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function ChatInterface({ isOpen, onClose, className = '' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate session ID on component mount
  useEffect(() => {
    if (isOpen && !sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
       // Add welcome message
       setMessages([{
         id: 'welcome',
         type: 'agent',
         content: 'Xin chào! Tôi là AI Assistant của bạn. Tôi có thể giúp bạn:\n\n• Quản lý và tạo todo mới\n• Tìm kiếm tasks theo ngữ cảnh\n• Đưa ra gợi ý thông minh\n• Phân tích năng suất\n• Trả lời câu hỏi về công việc\n\n**Slash Commands:**\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">📝 /todo</span> - Tạo todo mới\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono">🔍 /search</span> - Tìm kiếm todos\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono">📅 /schedule</span> - Xem lịch trình\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-mono">🏷️ /tags</span> - Gán tags tự động\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-mono">⏰ /availability</span> - Kiểm tra thời gian rảnh\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">✏️ /update</span> - Cập nhật todo\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">❓ /help</span> - Xem hướng dẫn\n\nBạn cần hỗ trợ gì?',
         timestamp: new Date().toISOString()
       }]);
    }
  }, [isOpen, sessionId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageContent = inputMessage.trim();
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Check authentication
      if (!checkAuth()) {
        setError('Vui lòng đăng nhập để sử dụng chat');
        return;
      }

      // Check server health
      const healthCheck = await checkServerHealth();
      if (!healthCheck.isHealthy) {
        setError(`Server không khả dụng: ${healthCheck.error}`);
        return;
      }

      // Check for slash commands and add context
      let enhancedMessage = messageContent;
      if (messageContent.startsWith('/')) {
        enhancedMessage = `[SLASH_COMMAND] ${messageContent}`;
      }

       const response = await apiService.chatWithAgent({
         message: enhancedMessage,
         session_id: sessionId
       });

       const agentMessage: ChatMessage = {
         id: `agent_${Date.now()}`,
         type: 'agent',
         content: response.response,
         timestamp: response.timestamp
       };

       setMessages(prev => [...prev, agentMessage]);

       // Check if the response contains todo creation and dispatch event
       if (response.response && (
         response.response.includes('Đã tạo todo') || 
         response.response.includes('đã tạo todo') || 
         response.response.includes('todo đã được tạo') ||
         response.response.includes('created todo') ||
         response.response.includes('todo created') ||
         response.response.includes('Tôi đã tạo') ||
         response.response.includes('Đã tạo thành công') ||
         response.response.includes('✅') ||
         response.response.includes('Todo:') ||
         response.response.includes('Task:') ||
         response.response.includes('[TODO_DATA]')
       )) {
         // First try to extract structured todo data from backend
         const todoDataMatch = response.response.match(/\[TODO_DATA\](.*?)\[\/TODO_DATA\]/);
         if (todoDataMatch) {
           try {
             const todoData = JSON.parse(todoDataMatch[1]);
             console.log('Found structured todo data:', todoData);
             
             // Dispatch a custom event with real todo data
             window.dispatchEvent(new CustomEvent('todo:created', { 
               detail: todoData
             }));
             
             console.log('Todo created via chat, dispatched event with real data:', todoData);
             return; // Exit early if we found structured data
           } catch (e) {
             console.error('Failed to parse todo data:', e);
           }
         }
         
         // Fallback: Try to extract todo information from response with multiple patterns
         const patterns = [
           /Đã tạo todo[^:]*:?\s*"([^"]+)"/i,
           /đã tạo todo[^:]*:?\s*"([^"]+)"/i,
           /todo[^:]*:?\s*"([^"]+)"/i,
           /đã tạo[^:]*:?\s*"([^"]+)"/i,
           /task[^:]*:?\s*"([^"]+)"/i,
           /✅[^:]*:?\s*"([^"]+)"/i,
           /"([^"]+)"[^:]*đã được tạo/i,
           /"([^"]+)"[^:]*created/i,
           /Đã tạo todo[^:]*:?\s*\*\*([^*]+)\*\*/i,
           /đã tạo todo[^:]*:?\s*\*\*([^*]+)\*\*/i
         ];
         
         let todoTitle = 'Todo created via chat';
         for (const pattern of patterns) {
           const match = response.response.match(pattern);
           if (match && match[1]) {
             todoTitle = match[1];
             break;
           }
         }
         
         // Dispatch a custom event to notify other components
         window.dispatchEvent(new CustomEvent('todo:created', { 
           detail: { 
             id: `chat_${Date.now()}`,
             title: todoTitle,
             is_completed: false,
             is_important: false,
             created_at: new Date().toISOString()
           } 
         }));
         
         console.log('Todo created via chat, dispatched event:', todoTitle);
       }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!sessionId) return;

    try {
      await apiService.clearAgentSession(sessionId);
       setMessages([{
         id: 'welcome',
         type: 'agent',
         content: 'Xin chào! Tôi là AI Assistant của bạn. Tôi có thể giúp bạn:\n\n• Quản lý và tạo todo mới\n• Tìm kiếm tasks theo ngữ cảnh\n• Đưa ra gợi ý thông minh\n• Phân tích năng suất\n• Trả lời câu hỏi về công việc\n\n**Slash Commands:**\n• `/todo` - Tạo todo mới\n• `/search` - Tìm kiếm todos\n• `/schedule` - Xem lịch trình\n• `/tags` - Gán tags tự động\n• `/availability` - Kiểm tra thời gian rảnh\n• `/update` - Cập nhật todo\n• `/help` - Xem hướng dẫn\n\nBạn cần hỗ trợ gì?',
         timestamp: new Date().toISOString()
       }]);
      setError(null);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Xóa lịch sử chat"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div 
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(message.content) 
                  }}
                />
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm text-gray-600">AI đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Slash Commands Suggestions */}
        {inputMessage.startsWith('/') && !inputMessage.includes(' ') && (() => {
           const commands = [
             { cmd: '/todo', desc: 'Tạo todo mới', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', icon: '📝' },
             { cmd: '/search', desc: 'Tìm kiếm todos', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', icon: '🔍' },
             { cmd: '/schedule', desc: 'Xem lịch trình', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700', icon: '📅' },
             { cmd: '/tags', desc: 'Gán tags tự động', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700', icon: '🏷️' },
             { cmd: '/availability', desc: 'Kiểm tra thời gian rảnh', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', icon: '⏰' },
             { cmd: '/update', desc: 'Cập nhật todo', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-700', icon: '✏️' },
             { cmd: '/help', desc: 'Xem hướng dẫn', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', icon: '❓' }
           ];
          
          // Check if user has typed a complete command
          const isCompleteCommand = commands.some(cmd => cmd.cmd === inputMessage);
          
          // Only show suggestions if not a complete command
          if (isCompleteCommand) return null;
          
          const filteredCommands = commands.filter(cmd => 
            cmd.cmd.toLowerCase().includes(inputMessage.toLowerCase())
          );
          
          return filteredCommands.length > 0 && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-3 font-medium">💡 Slash Commands:</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {filteredCommands.map((command, index) => (
                  <div key={index} className={`${command.bgColor} ${command.borderColor} border p-3 rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{command.icon}</span>
                      <code className={`${command.textColor} font-mono font-semibold`}>{command.cmd}</code>
                      <span className={`${command.textColor} text-xs`}>- {command.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn hoặc dùng / để xem commands..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Nhấn Enter để gửi, Shift+Enter để xuống dòng. Dùng / để xem commands
          </div>
        </div>
      </div>
    </div>
  );
}

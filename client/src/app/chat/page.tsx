"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  TrashIcon,
  SparklesIcon,
  Bars3Icon
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

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication
  useEffect(() => {
    if (!checkAuth()) {
      router.push('/');
    }
  }, [router]);

  // Generate session ID on component mount
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
       // Add welcome message
       setMessages([{
         id: 'welcome',
         type: 'agent',
         content: 'Xin chào! Tôi là AI Assistant của bạn. Tôi có thể giúp bạn:\n\n• Quản lý và tạo todo mới\n• Tìm kiếm tasks theo ngữ cảnh\n• Đưa ra gợi ý thông minh\n• Phân tích năng suất\n• Trả lời câu hỏi về công việc\n\n**Slash Commands:**\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-200 rounded text-xs font-mono border border-blue-400/30">📝 /todo</span> - Tạo todo mới\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-200 rounded text-xs font-mono border border-green-400/30">🔍 /search</span> - Tìm kiếm todos\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-200 rounded text-xs font-mono border border-purple-400/30">📅 /schedule</span> - Xem lịch trình\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-200 rounded text-xs font-mono border border-orange-400/30">🏷️ /tags</span> - Gán tags tự động\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-200 rounded text-xs font-mono border border-red-400/30">⏰ /availability</span> - Kiểm tra thời gian rảnh\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-200 rounded text-xs font-mono border border-indigo-400/30">✏️ /update</span> - Cập nhật todo\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-200 rounded text-xs font-mono border border-gray-400/30">❓ /help</span> - Xem hướng dẫn\n\nBạn cần hỗ trợ gì?',
         timestamp: new Date().toISOString()
       }]);
    }
  }, [sessionId]);

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
         content: 'Xin chào! Tôi là AI Assistant của bạn. Tôi có thể giúp bạn:\n\n• Quản lý và tạo todo mới\n• Tìm kiếm tasks theo ngữ cảnh\n• Đưa ra gợi ý thông minh\n• Phân tích năng suất\n• Trả lời câu hỏi về công việc\n\n**Slash Commands:**\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-200 rounded text-xs font-mono border border-blue-400/30">📝 /todo</span> - Tạo todo mới\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-200 rounded text-xs font-mono border border-green-400/30">🔍 /search</span> - Tìm kiếm todos\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-200 rounded text-xs font-mono border border-purple-400/30">📅 /schedule</span> - Xem lịch trình\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-200 rounded text-xs font-mono border border-orange-400/30">🏷️ /tags</span> - Gán tags tự động\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-200 rounded text-xs font-mono border border-red-400/30">⏰ /availability</span> - Kiểm tra thời gian rảnh\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-200 rounded text-xs font-mono border border-indigo-400/30">✏️ /update</span> - Cập nhật todo\n• <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-200 rounded text-xs font-mono border border-gray-400/30">❓ /help</span> - Xem hướng dẫn\n\nBạn cần hỗ trợ gì?',
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

  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-white/45 bg-opacity-50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative bg-white w-64 h-full shadow-xl">
            <Sidebar
              onClose={() => setIsMobileSidebarOpen(false)}
              showCloseButton={true}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-screen overflow-hidden">
        <section className="relative w-full h-screen">
          <div className="w-full h-full bg-gradient-to-b from-purple-500 to-blue-600 text-white relative overflow-hidden">
            {/* Header */}
            <div className="px-2 sm:px-4">
              <div className="p-2 sm:p-4 max-w-4xl mx-auto">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md hover:bg-purple-600 hover:bg-opacity-20 transition-colors mb-2"
                >
                  <Bars3Icon className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <h1 className="text-lg sm:text-2xl font-semibold text-white">AI Assistant</h1>
                  </div>
                  <button
                    onClick={clearChat}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="Xóa lịch sử chat"
                  >
                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm hidden sm:inline">Xóa chat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Container */}
            <div className="px-2 sm:px-4">
              <div className="p-2 sm:p-4 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg h-[60vh] sm:h-[70vh] md:h-[55vh] lg:h-[65vh] flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${
                            message.type === 'user'
                              ? 'bg-white text-gray-900'
                              : 'bg-white/20 text-white'
                          }`}
                        >
                          <div 
                            className="text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: renderMarkdown(message.content) 
                            }}
                          />
                          <div className={`text-xs mt-2 ${
                            message.type === 'user' ? 'text-gray-500' : 'text-white/70'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/20 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span className="text-sm text-white">AI đang suy nghĩ...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
                        <div className="text-sm text-red-100">{error}</div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Slash Commands Suggestions */}
                  {inputMessage.startsWith('/') && !inputMessage.includes(' ') && (() => {
                     const commands = [
                       { cmd: '/todo', desc: 'Tạo todo mới', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-400/30', textColor: 'text-blue-200', icon: '📝' },
                       { cmd: '/search', desc: 'Tìm kiếm todos', bgColor: 'bg-green-500/20', borderColor: 'border-green-400/30', textColor: 'text-green-200', icon: '🔍' },
                       { cmd: '/schedule', desc: 'Xem lịch trình', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400/30', textColor: 'text-purple-200', icon: '📅' },
                       { cmd: '/tags', desc: 'Gán tags tự động', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-400/30', textColor: 'text-orange-200', icon: '🏷️' },
                       { cmd: '/availability', desc: 'Kiểm tra thời gian rảnh', bgColor: 'bg-red-500/20', borderColor: 'border-red-400/30', textColor: 'text-red-200', icon: '⏰' },
                       { cmd: '/update', desc: 'Cập nhật todo', bgColor: 'bg-indigo-500/20', borderColor: 'border-indigo-400/30', textColor: 'text-indigo-200', icon: '✏️' },
                       { cmd: '/help', desc: 'Xem hướng dẫn', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-400/30', textColor: 'text-gray-200', icon: '❓' }
                     ];
                    
                    // Check if user has typed a complete command
                    const isCompleteCommand = commands.some(cmd => cmd.cmd === inputMessage);
                    
                    // Only show suggestions if not a complete command
                    if (isCompleteCommand) return null;
                    
                    const filteredCommands = commands.filter(cmd => 
                      cmd.cmd.toLowerCase().includes(inputMessage.toLowerCase())
                    );
                    
                    return filteredCommands.length > 0 && (
                      <div className="border-t border-white/20 p-4 bg-white/10">
                        <div className="text-xs text-white/80 mb-3 font-medium">💡 Slash Commands:</div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          {filteredCommands.map((command, index) => (
                            <div key={index} className={`${command.bgColor} ${command.borderColor} border p-3 rounded-lg hover:shadow-lg transition-all cursor-pointer`}>
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
                  <div className="border-t border-white/20 p-2 sm:p-4">
                    <div className="flex gap-1 sm:gap-2">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 resize-none border border-white/30 rounded-lg px-2 sm:px-3 py-2 text-sm bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                        rows={2}
                        disabled={isLoading}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-3 sm:px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <PaperAirplaneIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-white/70 mt-1 sm:mt-2 hidden sm:block">
                      Nhấn Enter để gửi, Shift+Enter để xuống dòng. Dùng / để xem commands
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

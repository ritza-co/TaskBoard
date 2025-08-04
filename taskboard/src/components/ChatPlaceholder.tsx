import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolUsage?: any;
  isStreaming?: boolean;
}

interface ChatComponentProps {
  userId: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_MESSAGES = 5;
  const userMessageCount = messages.filter(msg => msg.role === 'user').length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Check message limit and show system message if reached
    if (userMessageCount >= MAX_MESSAGES) {
      const limitMessage: Message = {
        role: 'assistant',
        content: 'Message limit reached. Clear the conversation to continue.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add streaming message placeholder
    const streamingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, streamingMessage]);

    try {
      const response = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (!sessionId) {
        setSessionId(data.session_id);
      }

      // Simulate streaming effect by gradually revealing the text
      const fullResponse = data.response;
      let currentIndex = 0;
      
      const streamInterval = setInterval(() => {
        if (currentIndex >= fullResponse.length) {
          clearInterval(streamInterval);
          // Update final message with tool usage
          setMessages(prev => 
            prev.map((msg, index) => 
              index === prev.length - 1 
                ? { 
                    ...msg, 
                    content: fullResponse, 
                    isStreaming: false,
                    toolUsage: data.tool_usage 
                  }
                : msg
            )
          );
          setIsLoading(false);
          return;
        }
        
        // Add 1-3 characters at a time for more natural streaming
        const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, fullResponse.length - currentIndex);
        currentIndex += charsToAdd;
        
        setMessages(prev => 
          prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: fullResponse.substring(0, currentIndex) }
              : msg
          )
        );
      }, 30); // Adjust speed as needed
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove streaming message and add error message
      setMessages(prev => {
        const newMessages = prev.slice(0, -1);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, there was an error processing your message. Please try again.',
          timestamp: new Date().toISOString(),
        };
        return [...newMessages, errorMessage];
      });
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setSessionId(null);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderToolUsage = (toolUsage: any) => {
    if (!toolUsage?.tool_calls?.length) return null;

    return (
      <div className="mb-3 p-3 glass rounded-lg border border-mono-200">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-mono-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-mono-700 font-medium text-xs">Tools used:</span>
        </div>
        <div className="space-y-1">
          {toolUsage.tool_calls.map((tool: any, index: number) => (
            <div key={index} className="text-xs font-mono text-mono-600 bg-mono-100 px-2 py-1 rounded">
              {tool.function?.name}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-black hover:bg-gray-800 focus:bg-gray-800 text-white rounded-2xl shadow-2xl hover:shadow-xl focus:shadow-xl transition-all duration-300 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 flex items-center justify-center group animate-float"
          aria-label="Open Task Agent"
        >
          <svg className="w-8 h-8 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {userMessageCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce-in animate-pulse">
              {userMessageCount}
            </div>
          )}
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Sidebar - Desktop / Chat Overlay - Mobile */}
      {isOpen && (
        <div className={`fixed top-0 right-0 h-full z-50 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full sm:w-full md:w-96 lg:w-[28rem] bg-white/95 backdrop-blur-lg border-l border-gray-200 shadow-2xl flex flex-col`}>
          
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-black text-lg sm:text-lg">Task Agent</h2>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600">
                  <span>Messages: {userMessageCount}/{MAX_MESSAGES}</span>
                  {sessionId && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full font-medium">Connected</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearConversation}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Task Agent</h3>
                <div className="text-sm text-gray-600 max-w-xs mx-auto space-y-2">
                  <p>Connected via <strong>Gram MCP</strong> - I can help you manage tasks, analyze your workflow, and boost productivity.</p>
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <p className="mb-1"><strong>Try:</strong></p>
                    <p>"Create a task for reviewing code"</p>
                    <p>"Show me my task progress"</p>
                    <p>"Help organize my workflow"</p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black border border-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' && renderToolUsage(message.toolUsage)}
                    <div className="text-sm leading-relaxed">
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className={`prose prose-sm max-w-none ${
                          message.role === 'assistant' ? 'prose-gray' : ''
                        }`}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                              code: ({children, className}) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                ) : (
                                  <code className="block bg-gray-200 p-2 rounded text-xs font-mono whitespace-pre-wrap">{children}</code>
                                );
                              },
                              ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                              li: ({children}) => <li className="mb-1">{children}</li>,
                              h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">{children}</blockquote>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                          {message.isStreaming && (
                            <div className="flex items-center space-x-1 mt-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-3 sm:p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200">
            <div className="flex items-stretch h-11 sm:h-12 border-2 border-gray-200 rounded-xl bg-white/60 backdrop-blur-sm focus-within:border-black focus-within:bg-white/80 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about your tasks..."
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-sm placeholder:text-gray-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed overflow-hidden"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-11 sm:w-12 bg-black text-white rounded-r-xl flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 border-l border-gray-300"
                title="Send message"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatComponent;
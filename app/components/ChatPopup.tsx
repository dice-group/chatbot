import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiSend, FiX, FiMoon, FiSun, FiMessageSquare, FiMaximize, FiMinimize } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface ChatPopupProps {
  username: string;
}

// Add ResizeDirection type
type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const ChatPopup: React.FC<ChatPopupProps> = ({ username }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Add state for window size and resizing
  const [windowSize, setWindowSize] = useState({ width: 35, height: 65 });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    // Scroll to the bottom when a new message is added
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Open the chat window automatically after 1 seconds
    const timer = setTimeout(() => setIsOpen(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage),
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        const assistantContent = data.choices[0].message.content;
        const assistantMessage: Message = {
          role: 'assistant',
          content: assistantContent,
          id: Date.now().toString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        console.error('No response from assistant.');
      }
    } catch (error) {
      console.error('Error communicating with backend server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setInitialPos({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: windowSize.width, height: windowSize.height });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - initialPos.x;
    const deltaY = e.clientY - initialPos.y;
    
    // Calculate new size based on resize direction
    let newWidth = initialSize.width;
    let newHeight = initialSize.height;
    
    // Handle horizontal resizing
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(20, initialSize.width + (deltaX / window.innerWidth) * 100);
    } else if (resizeDirection.includes('w')) {
      newWidth = Math.max(20, initialSize.width - (deltaX / window.innerWidth) * 100);
    }
    
    // Handle vertical resizing
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(30, initialSize.height + (deltaY / window.innerHeight) * 100);
    } else if (resizeDirection.includes('n')) {
      newHeight = Math.max(30, initialSize.height - (deltaY / window.innerHeight) * 100);
    }
    
    // Apply size constraints - ensure window stays within screen bounds with margins
    const maxWidth = 95; // 95% of screen width
    const maxHeight = 90; // 90% of screen height
    
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);
    
    // Update window size
    setWindowSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeDirection(null);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, initialPos, initialSize, resizeDirection]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Return to previous size
      setWindowSize({ width: 35, height: 65 });
    } else {
      // Go fullscreen (with small margins)
      setWindowSize({ width: 95, height: 90 });
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.2
            }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-5 right-5 p-4 rounded-full shadow-xl 
              ${darkMode 
                ? 'bg-gradient-to-br from-blue-700 to-indigo-900 text-white' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'}
              hover:shadow-2xl transform hover:scale-110 transition-all duration-300
              backdrop-blur-sm bg-opacity-90 border-2 ${darkMode ? 'border-blue-500/30' : 'border-emerald-300/50'}
              hover:ring-4 ${darkMode ? 'hover:ring-blue-500/30' : 'hover:ring-emerald-400/30'}`}
            aria-label="Open chat"
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, -3, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse",
                ease: "easeInOut",
                repeatDelay: 5
              }}
            >
              <FiMessageSquare size={24} />
            </motion.div>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div 
            ref={chatWindowRef}
            key="chat-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed bottom-5 right-5 min-w-[350px] min-h-[500px] 
              ${darkMode 
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
                : 'bg-gradient-to-br from-emerald-50 to-white text-gray-800'} 
              border ${darkMode ? 'border-gray-700' : 'border-emerald-200'} 
              flex flex-col shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200
              backdrop-filter backdrop-blur-sm ${darkMode ? 'bg-opacity-95' : 'bg-opacity-98'}`}
            style={{
              width: `${windowSize.width}vw`,
              height: `${windowSize.height}vh`,
              cursor: isResizing ? 
                resizeDirection?.includes('n') && resizeDirection?.includes('e') ? 'ne-resize' :
                resizeDirection?.includes('n') && resizeDirection?.includes('w') ? 'nw-resize' :
                resizeDirection?.includes('s') && resizeDirection?.includes('e') ? 'se-resize' :
                resizeDirection?.includes('s') && resizeDirection?.includes('w') ? 'sw-resize' :
                resizeDirection?.includes('n') ? 'n-resize' :
                resizeDirection?.includes('s') ? 's-resize' :
                resizeDirection?.includes('e') ? 'e-resize' :
                resizeDirection?.includes('w') ? 'w-resize' : 'default' : 'default'
            }}
            layout
          >
            {/* Add resize handles - only show when not in fullscreen mode */}
            {!isFullscreen && (
              <>
                <div 
                  className="absolute top-0 left-0 right-0 h-2 cursor-n-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 'n')}
                />
                <div 
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 's')}
                />
                <div 
                  className="absolute top-0 bottom-0 left-0 w-2 cursor-w-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 'w')}
                />
                <div 
                  className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 'e')}
                />
                <div 
                  className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 'nw')}
                />
                <div 
                  className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 'ne')}
                />
                <div 
                  className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 'sw')}
                />
                <div 
                  className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-10" 
                  onMouseDown={(e) => handleResizeStart(e, 'se')}
                />
              </>
            )}

            <motion.div 
              className={`flex justify-between items-center p-4 
                ${darkMode 
                  ? 'bg-gradient-to-r from-gray-900 to-indigo-950 border-b border-gray-800' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 border-b border-emerald-500/20'} 
                text-white`}
              layoutId="header"
            >
              <h2 className="text-lg font-semibold flex items-center">
                <div className="w-6 h-6 mr-2 relative flex items-center justify-center">
                  <AnimatePresence mode="crossfade">
                    {isLoading ? (
                      <motion.div
                        key="loading-icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <motion.div 
                          className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-emerald-500'}`}
                          style={{ 
                            borderRadius: '50%',
                            border: `2px solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                            borderLeftColor: darkMode ? 'rgb(96, 165, 250)' : 'rgb(16, 185, 129)'
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ 
                            duration: 1, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="message-icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <FiMessageSquare size={20} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className={`bg-clip-text text-transparent ${darkMode 
                  ? 'bg-gradient-to-r from-white to-blue-100' 
                  : 'bg-gradient-to-r from-white to-emerald-100'} font-bold`}>
                  Chat with AI
                </span>
              </h2>
              <div className="flex items-center space-x-2">
                {/* Add fullscreen toggle button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  onClick={() => setDarkMode(!darkMode)}
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <FiX size={18} />
                </motion.button>
              </div>
            </motion.div>
            <div className={`flex-1 p-4 overflow-y-auto 
              ${darkMode 
                ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 scrollbar-dark' 
                : 'bg-gradient-to-b from-emerald-50 via-white to-emerald-50 scrollbar-light'}`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: darkMode ? '#4B5563 #1F2937' : '#10B981 #F9FAFB',
                maskImage: 'linear-gradient(to bottom, transparent, black 10px, black 90%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10px, black 90%, transparent 100%)'
              }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ 
                        opacity: 0, 
                        x: msg.role === 'user' ? 50 : -50,
                        scale: 0.8
                      }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        scale: 1
                      }}
                      transition={{ 
                        type: "spring", 
                        damping: 25, 
                        stiffness: 300,
                        mass: 0.8
                      }}
                      className={`mb-4 flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      layout
                    >
                      <motion.div
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`px-4 py-3 rounded-2xl max-w-[85%] break-words prose prose-sm
                          ${msg.role === 'user'
                            ? darkMode 
                              ? 'bg-gradient-to-br from-blue-800 to-indigo-900 text-white shadow-blue-900/30' 
                              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-500/30'
                            : darkMode 
                              ? 'bg-gray-800 text-gray-100 shadow-gray-900/20 border border-gray-700' 
                              : 'bg-white text-gray-800 shadow-emerald-200/70 border border-emerald-100'
                          } ${darkMode ? 'prose-invert' : ''} shadow-lg overflow-hidden
                          ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                        whileHover={{ 
                          scale: 1.01,
                          boxShadow: darkMode 
                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)' 
                            : '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)'
                        }}
                        layout
                      >
                        <div className="markdown-content max-w-full overflow-x-auto">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            className="break-words"
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <div className="code-block-wrapper max-w-full">
                                    <SyntaxHighlighter
                                      style={darkMode ? oneDark as any : oneLight as any}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-md overflow-x-auto"
                                      customStyle={{ 
                                        maxWidth: '100%',
                                        marginTop: '0.5rem',
                                        marginBottom: '0.5rem'
                                      }}
                                      codeTagProps={{
                                        style: {
                                          fontFamily: 'monospace',
                                          fontSize: '0.9rem',
                                          lineHeight: '1.4'
                                        }
                                      }}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className={`${className} ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'} px-1 py-0.5 rounded font-mono text-sm`} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p({ children }) {
                                return <p className="mb-2 last:mb-0">{children}</p>;
                              },
                              a({ href, children }) {
                                return (
                                  <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`underline ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-emerald-600 hover:text-emerald-700'}`}
                                  >
                                    {children}
                                  </a>
                                );
                              },
                              ul({ children }) {
                                return <ul className="list-disc pl-5 mb-2">{children}</ul>;
                              },
                              ol({ children }) {
                                return <ol className="list-decimal pl-5 mb-2">{children}</ol>;
                              },
                              li({ children }) {
                                return <li className="mb-1">{children}</li>;
                              },
                              blockquote({ children }) {
                                return (
                                  <blockquote className={`border-l-4 pl-3 italic my-2 
                                    ${darkMode ? 'border-gray-600 text-gray-300' : 'border-emerald-300 text-gray-600'}`}>
                                    {children}
                                  </blockquote>
                                );
                              },
                              table({ children }) {
                                return (
                                  <div className="overflow-x-auto max-w-full my-2">
                                    <table className="min-w-full border-collapse">{children}</table>
                                  </div>
                                );
                              },
                              th({ children }) {
                                return <th className={`p-2 text-left border ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-emerald-200 bg-emerald-50'}`}>{children}</th>;
                              },
                              td({ children }) {
                                return <td className={`p-2 border ${darkMode ? 'border-gray-700' : 'border-emerald-200'}`}>{children}</td>;
                              },
                              img({ src, alt }) {
                                return (
                                  <img 
                                    src={src} 
                                    alt={alt} 
                                    className="max-w-full h-auto rounded my-2"
                                    style={{ maxHeight: '200px' }}
                                  />
                                );
                              },
                              hr() {
                                return <hr className={`my-3 ${darkMode ? 'border-gray-700' : 'border-emerald-200'}`} />;
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
              </AnimatePresence>
              
              {isLoading && (
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="mb-4 flex justify-start"
                  >
                    <motion.div
                      className={`px-5 py-4 rounded-2xl max-w-[85%] 
                        ${darkMode 
                          ? 'bg-gray-800/90 text-gray-100 border border-gray-700' 
                          : 'bg-white/95 text-gray-800 border border-emerald-100'} 
                        shadow-lg`}
                    >
                      <div className="flex items-center">
                        <div className="flex space-x-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={`dot-${i}`}
                              className={`w-2.5 h-2.5 rounded-full 
                                ${darkMode ? 'bg-blue-500' : 'bg-emerald-500'}`}
                              initial={{ scale: 0.8, opacity: 0.4 }}
                              animate={{ 
                                scale: [0.8, 1.2, 0.8],
                                opacity: [0.4, 1, 0.4]
                              }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.2 }}
                          className="ml-3"
                        >
                          <span className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-emerald-600'}`}>
                            AI is thinking
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              )}
              <div ref={messageEndRef} />
            </div>
            <motion.div 
              className={`p-4 border-t 
                ${darkMode 
                  ? 'border-gray-700 bg-gray-800/80 backdrop-blur-sm' 
                  : 'border-emerald-100 bg-white/90 backdrop-blur-sm'}`}
              layout
            >
              <div className="flex items-center gap-2">
                <motion.input
                  ref={inputRef}
                  type="text"
                  value={input}
                  placeholder="Type your message..."
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  whileFocus={{ 
                    scale: 1.01,
                    boxShadow: darkMode 
                      ? '0 0 0 2px rgba(59, 130, 246, 0.5)' 
                      : '0 0 0 2px rgba(16, 185, 129, 0.5)'
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`flex-1 h-12 px-4 py-3 rounded-full focus:outline-none 
                    ${darkMode 
                      ? 'bg-gray-700 text-white border-gray-600 focus:ring-blue-500 placeholder-gray-400' 
                      : 'bg-emerald-50 text-gray-800 border-emerald-200 focus:ring-emerald-500 placeholder-gray-500'} 
                    border focus:ring-2 transition-all duration-200 shadow-inner`}
                />
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    rotate: 15
                  }}
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`h-12 w-12 rounded-full flex items-center justify-center
                    ${darkMode 
                      ? 'bg-gradient-to-br from-blue-700 to-indigo-900 hover:from-blue-600 hover:to-indigo-800' 
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'} 
                    text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                    shadow-md hover:shadow-lg ${input.trim() ? 'scale-100' : 'scale-95 opacity-90'}`}
                  aria-label="Send message"
                >
                  <motion.div
                    animate={input.trim() ? { 
                      rotate: [0, 45, 0],
                      y: [0, -3, 0]
                    } : {}}
                    transition={{ 
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <FiSend size={20} />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      <style jsx global>{`
        .markdown-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
        
        .markdown-content pre {
          white-space: pre-wrap;
          max-width: 100%;
          overflow-x: auto;
        }
        
        .markdown-content table {
          display: block;
          max-width: 100%;
          overflow-x: auto;
        }
        
        .code-block-wrapper {
          max-width: 100%;
          overflow-x: auto;
        }
      `}</style>
    </>
  );
};

export default ChatPopup;

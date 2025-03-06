import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiSend, FiX, FiMoon, FiSun, FiMessageSquare } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id: string; // Add unique ID for animation keys
}

interface ChatPopupProps {
  username: string;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ username }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [systemTheme, setSystemTheme] = useState<boolean>(true); // Track if using system theme
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [userData, setUserData] = useState<any>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to collect user data from the browser
  const collectUserData = async () => {
    const data: any = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      storage: navigator.storage,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      online: navigator.onLine,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    setUserData(data);
  };

  // Update theme based on system preference
  const updateThemeFromSystem = () => {
    if (systemTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  };

  useEffect(() => {
    // Initialize theme based on system preference
    updateThemeFromSystem();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => updateThemeFromSystem();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [systemTheme]);

  useEffect(() => {
    // Scroll to the bottom when a new message is added
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Open the chat window automatically after 1 seconds
    const timer = setTimeout(() => setIsOpen(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Collect user data
      collectUserData();
    }
    
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (Object.keys(userData).length > 0 && messages.length === 0) {
      // Initialize the conversation with system context
      const systemMessage: Message = {
        role: 'system',
        content: `You are chatting with a user named ${username}. Here is some additional user context: ${JSON.stringify(
          userData
        )}. Use this information to personalize your responses.`,
        id: `system-${Date.now()}`
      };
      setMessages([systemMessage]);
    }
  }, [userData, messages.length, username]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      id: `user-${Date.now()}`
    };
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
          id: `assistant-${Date.now()}`
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

  const toggleDarkMode = () => {
    setSystemTheme(false); // User is manually setting theme
    setDarkMode(!darkMode);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={toggleChat}
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
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed bottom-5 right-5 w-[35vw] h-[65vh] min-w-[350px] min-h-[500px] 
              ${darkMode 
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
                : 'bg-gradient-to-br from-emerald-50 to-white text-gray-800'} 
              border ${darkMode ? 'border-gray-700' : 'border-emerald-200'} 
              flex flex-col shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200
              backdrop-filter backdrop-blur-sm ${darkMode ? 'bg-opacity-95' : 'bg-opacity-98'}`}
            layout
          >
            <motion.div 
              className={`flex justify-between items-center p-4 
                ${darkMode 
                  ? 'bg-gradient-to-r from-gray-900 to-indigo-950 border-b border-gray-800' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 border-b border-emerald-500/20'} 
                text-white`}
              layoutId="header"
            >
              <h2 className="text-lg font-semibold flex items-center">
                <motion.div
                  animate={{ 
                    rotate: isLoading ? [0, 360] : 0,
                  }}
                  transition={{ 
                    repeat: isLoading ? Infinity : 0, 
                    duration: 2,
                    ease: "linear"
                  }}
                  className="mr-2"
                >
                  <FiMessageSquare size={20} />
                </motion.div>
                <span className={`bg-clip-text text-transparent ${darkMode 
                  ? 'bg-gradient-to-r from-white to-blue-100' 
                  : 'bg-gradient-to-r from-white to-emerald-100'} font-bold`}>
                  Chat with AI
                </span>
              </h2>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  onClick={toggleDarkMode}
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  onClick={toggleChat}
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
                {messages
                  .filter((msg) => msg.role !== 'system')
                  .map((msg) => (
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
                          } ${darkMode ? 'prose-invert' : ''} shadow-lg
                          ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                        whileHover={{ 
                          scale: 1.01,
                          boxShadow: darkMode 
                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)' 
                            : '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)'
                        }}
                        layout
                      >
                        <ReactMarkdown
                          children={msg.content}
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return match ? (
                                <SyntaxHighlighter
                                  style={darkMode ? oneDark as any : oneLight as any}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-md overflow-hidden"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={`${className} ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'} px-1 py-0.5 rounded`} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, x: -30, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="mb-3 flex justify-start"
                >
                  <div className={`px-4 py-3 rounded-2xl shadow-md
                    ${darkMode 
                      ? 'bg-gray-800 text-gray-100 border border-gray-700' 
                      : 'bg-white text-gray-800 border border-emerald-100'}`}>
                    <div className="flex space-x-2 items-center">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                        className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-emerald-500'}`}
                      />
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                        className={`w-2 h-2 rounded-full ${darkMode ? 'bg-indigo-400' : 'bg-teal-600'}`}
                      />
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
                        className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                </motion.div>
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
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatPopup;

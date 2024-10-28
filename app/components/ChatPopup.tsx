import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatPopupProps {
  username: string;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ username }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [userData, setUserData] = useState<any>({});

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
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (Object.keys(userData).length > 0 && messages.length === 0) {
      // Initialize the conversation with system context
      const systemMessage: Message = {
        role: 'system',
        content: `You are chatting with a user named ${username}. Here is some additional user context: ${JSON.stringify(
          userData
        )}. Use this information to personalize your responses.`,
      };
      setMessages([systemMessage]);
    }
  }, [userData, messages.length, username]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
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

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-5 right-5 w-[25vw] h-[25vh] min-w-[300px] min-h-[400px] bg-white border border-gray-300 flex flex-col shadow-lg text-slate-800">
          <div className="flex justify-between items-center p-3 bg-gray-100 border-b border-gray-200">
            <h2 className="text-lg font-semibold">LLM Chat</h2>
            <button
              className="text-gray-600 hover:text-gray-800 text-xl"
              onClick={() => setIsOpen(false)}
            >
              &times;
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
            {messages
              .filter((msg) => msg.role !== 'system') // Exclude system messages from display
              .map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-full break-words prose ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <ReactMarkdown
                      children={msg.content}
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    />
                  </div>
                </div>
              ))}
            {isLoading && (
              <div className="mb-2 flex justify-start">
                <div className="px-4 py-2 rounded-lg max-w-full bg-gray-200 text-gray-800">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>
          <div className="flex items-center p-3 border-t border-gray-200">
            <input
              type="text"
              value={input}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed`}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPopup;

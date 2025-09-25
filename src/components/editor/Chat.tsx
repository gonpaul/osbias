'use client';

import React, { useState } from 'react';
import { FaHistory, FaPaperPlane, FaUser, FaRobot } from 'react-icons/fa';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatProps {
  className?: string;
}

const Chat: React.FC<ChatProps> = ({ className = '' }) => {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('General');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you with your project today?',
      sender: 'assistant',
      timestamp: new Date('2024-01-15T10:00:00')
    },
    {
      id: '2',
      content: 'I need help implementing a new feature in my React app',
      sender: 'user',
      timestamp: new Date('2024-01-15T10:01:00')
    },
    {
      id: '3',
      content: 'I\'d be happy to help! What kind of feature are you looking to implement?',
      sender: 'assistant',
      timestamp: new Date('2024-01-15T10:01:30')
    }
  ]);

  const tabs = ['General', 'Code', 'Debug'];

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Simulate assistant response
      setTimeout(() => {
        const assistantResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Thanks for your message! I\'m processing your request...',
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`w-[300px] h-full bg-(--background) flex flex-col ${className}`}>
      {/* Header with Tabs */}
      <div className="p-4 border-b border-(--secondary)/60">
        <div className="flex items-center justify-between mb-3">
          <span className="flex-1 text-lg font-semibold text-(--foreground) text-center block">
            Chat
          </span>
          <button
            className="p-2 text-(--secondary) cursor-pointer hover:text-(--foreground) hover:bg-(--darkelbg) rounded-lg transition-colors ml-auto"
            title="Chat History"
          >
            <FaHistory className="w-8 h-8" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-3 py-1 text-xs rounded-md transition-colors cursor-pointer
                ${activeTab === tab 
                  ? 'bg-(--emphasis) text-white' 
                  : 'text-(--secondary) hover:bg-(--darkelbg) hover:text-(--foreground)'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 mt-6 overflow-y-auto p-4 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-(--emphasis) rounded-full flex items-center justify-center">
                <FaRobot className="w-8 h-8 text-white" />
              </div>
            )}
            
            <div
              className={`
                max-w-[80%] p-3 rounded-lg
                ${msg.sender === 'user' 
                  ? 'bg-(--emphasis) text-white' 
                  : 'bg-(--darkelbg) text-(--foreground)'
                }
              `}
            >
              <div className="text-sm">{msg.content}</div>
              <div className={`text-xs mt-1 ${
                msg.sender === 'user' ? 'text-white/70' : 'text-(--secondary)'
              }`}>
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
            
            {msg.sender === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-(--secondary) rounded-full flex items-center justify-center">
                <FaUser className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t mt-6 border-(--secondary)/60">
        <div className="flex">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-10 max-h-[100px] px-3 py-2 text-sm border-none rounded-s-lg bg-(--darkelbg) text-(--foreground) placeholder-(--secondary) focus:outline-none focus:ring-1 focus:ring-(--emphasis)/40 resize-y"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="flex-shrink-0 cursor-pointer px-4 bg-(--emphasis) text-white rounded-e-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <FaPaperPlane className="h-full w-full" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

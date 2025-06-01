import { useState, useEffect, useRef } from 'react';
import { message, createDataItemSigner, result } from "@permaweb/aoconnect";
import './ChatBot.css';

export default function ChatBot({ processId, theme = 'light' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Check for wallet connection
  useEffect(() => {
    if (!window.arweaveWallet) {
      setError("ArConnect wallet not detected. Please install ArConnect to use this feature.");
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending message to AO process
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const signer = createDataItemSigner(window.arweaveWallet);

      // Send message to AO process
      const msgResult = await message({
        process: processId,
        tags: [{ name: "Action", value: "Ask" }],
        signer,
        data: input
      });

      console.log('Message sent, txId:', msgResult);

      // Wait for a moment to allow the message to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the actual result
      const response = await result({
        process: processId,
        message: msgResult
      });

      console.log('Process response:', response);

      // Extract the message from the response
      const botResponse = response?.Messages?.[0]?.Data || "No response received from the bot";
      
      // Add bot response to chat
      const botMessage = {
        role: 'assistant',
        content: botResponse,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError("Failed to send message. Please check your wallet connection and try again.");
      
      // Add error message to chat
      const errorMessage = {
        role: 'system',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = {
    container: `chatbot-container ${theme === 'dark' ? 'dark' : 'light'}`,
    header: `chat-header ${theme === 'dark' ? 'dark' : 'light'}`,
    messages: `messages-container ${theme === 'dark' ? 'dark' : 'light'}`,
    input: `message-input ${theme === 'dark' ? 'dark' : 'light'}`,
    button: `send-button ${loading ? 'loading' : ''} ${theme === 'dark' ? 'dark' : 'light'}`
  };

  return (
    <div className={baseClasses.container}>
      <div className={baseClasses.header}>
        <h2>AO ChatBot</h2>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className={baseClasses.messages}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className={baseClasses.input}
          disabled={loading || !window.arweaveWallet}
        />
        <button 
          type="submit" 
          className={baseClasses.button}
          disabled={loading || !input.trim() || !window.arweaveWallet}
        >
          {loading ? (
            <div className="button-content">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </div>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
} 
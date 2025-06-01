import React, { useState, useEffect } from "react";
import { message, createDataItemSigner } from "@permaweb/aoconnect";

export interface AOMessageSignerProps {
  /** The process ID to send the message to */
  processId: string;
  /** Optional className for the container div */
  className?: string;
  /** Optional custom styles for the container div */
  style?: React.CSSProperties;
  /** Optional theme - 'light' or 'dark' */
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    arweaveWallet: any;
  }
}

export const AOMessageSigner: React.FC<AOMessageSignerProps> = ({
  processId,
  className = "",
  style = {},
  theme = 'light'
}) => {
  const [messageContent, setMessageContent] = useState("");
  const [responseText, setResponseText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.arweaveWallet) {
      setError("ArConnect wallet not detected. Please install ArConnect to use this feature.");
    }
  }, []);

  const sendMessageToAO = async () => {
    setLoading(true);
    setResponseText(null);
    setError(null);

    try {
      const signer = createDataItemSigner(window.arweaveWallet);

      const result = await message({
        process: processId,
        tags: [{ name: "Action", value: "Sign" }],
        signer,
        data: messageContent || "Random generated message"
      });

      setResponseText(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please check your wallet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = {
    container: `max-w-md mx-auto rounded-lg shadow-lg transition-all duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-800 text-white' 
        : 'bg-white text-gray-800'
    }`,
    header: `text-xl font-bold mb-4 pb-2 ${
      theme === 'dark' 
        ? 'border-b border-gray-700' 
        : 'border-b border-gray-200'
    }`,
    input: `w-full px-4 py-2 mb-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 ${
      theme === 'dark'
        ? 'bg-gray-700 border-gray-600 focus:ring-blue-500 text-white'
        : 'bg-gray-50 border border-gray-300 focus:ring-blue-500'
    }`,
    button: `w-full px-4 py-2 rounded-md font-medium transition-all duration-200 ${
      loading
        ? 'bg-gray-500 cursor-not-allowed'
        : theme === 'dark'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
    }`,
    response: `mt-4 p-4 rounded-md overflow-auto ${
      theme === 'dark'
        ? 'bg-gray-700'
        : 'bg-gray-50'
    }`,
    error: `mt-4 p-4 rounded-md bg-red-100 text-red-700 ${
      theme === 'dark'
        ? 'bg-red-900 text-red-100'
        : 'bg-red-100 text-red-700'
    }`
  };

  return (
    <div 
      className={`${baseClasses.container} ${className}`}
      style={{
        padding: '1.5rem',
        ...style
      }}
    >
      <h2 className={baseClasses.header}>AO Message Signer</h2>

      {error && (
        <div className={baseClasses.error}>
          {error}
        </div>
      )}

      <input
        className={baseClasses.input}
        type="text"
        value={messageContent}
        placeholder="Enter message to sign"
        onChange={(e) => setMessageContent(e.target.value)}
        disabled={loading}
      />

      <button
        className={baseClasses.button}
        onClick={sendMessageToAO}
        disabled={loading || !messageContent.trim()}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing...
          </div>
        ) : (
          "Send to AO"
        )}
      </button>

      {responseText && (
        <div className={baseClasses.response}>
          <div className="font-semibold mb-2">Response:</div>
          <pre className="whitespace-pre-wrap break-words text-sm">
            {responseText}
          </pre>
        </div>
      )}
    </div>
  );
}; 
import React, { useState } from 'react';

const ChatPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button
        onClick={togglePopup}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-8 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <h3 className="font-semibold">MCP Assistant</h3>
            <button onClick={togglePopup} className="text-gray-500 hover:text-gray-700">
              X
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600">This is a placeholder for the MCP chat integration. More features will be added here soon!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPopup;
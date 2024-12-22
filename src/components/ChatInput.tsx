import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendFile }) => {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seules les images sont autorisées');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 50MB)');
      return;
    }

    onSendFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 sm:p-4 bg-black/50">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Écrivez votre message..."
        className="flex-1 px-3 py-2 text-sm sm:text-base bg-black border-2 border-red-800 text-red-100 placeholder-red-700 focus:outline-none focus:border-red-600 rounded-lg"
      />
      
      <div className="flex gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
          />
          <svg 
            className="w-8 h-8 sm:w-10 sm:h-10 p-1.5 sm:p-2 text-red-600 hover:text-red-500 transition-colors bg-black border-2 border-red-800 rounded-lg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </label>

        <button
          type="submit"
          className="w-8 h-8 sm:w-10 sm:h-10 p-1.5 sm:p-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg
            className="w-full h-full"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
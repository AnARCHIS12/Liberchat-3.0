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

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Seules les images sont autorisées');
      return;
    }

    // Vérifier la taille du fichier (50MB max)
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
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Écrivez votre message..."
        className="flex-1 px-4 py-2 bg-black border-2 border-red-800 text-red-100 placeholder-red-700 focus:outline-none focus:border-red-600"
      />
      
      <label className="cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <svg
          className="w-6 h-6 text-gray-500 hover:text-blue-500"
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
        className="px-6 py-2 bg-red-800 hover:bg-red-900 text-red-100 border-2 border-red-600 uppercase font-bold transition-colors"
      >
        <svg
          className="w-6 h-6"
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
    </form>
  );
};

export default ChatInput;
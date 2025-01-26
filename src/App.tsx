import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import Header from './components/Header';
import './styles/Header.css';

interface Message {
  type: 'text' | 'file';
  username: string;
  content?: string;
  fileData?: string;
  fileType?: string;
  fileName?: string;
  timestamp: number;
}

interface User {
  username: string;
  socketId: string;
  isInCall: boolean;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>('');

  // Initialisation du socket
  useEffect(() => {
    console.log('Initialisation du socket...');
    const socket = io({
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    console.log('Socket connecté avec ID:', socket.id);
    socket.on('connect', () => {
      console.log('Connecté au serveur');
      setError('');
    });

    socket.on('connect_error', (err) => {
      console.error('Erreur de connexion socket:', err);
      setError('Erreur de connexion au serveur');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket déconnecté, raison:', reason);
    });

    setSocket(socket);

    return () => {
      console.log('Nettoyage du socket...');
      socket.close();
    };
  }, []);

  // Gestion des messages et des événements
  useEffect(() => {
    if (!socket) return;

    // Réception des messages initiaux et de la liste des utilisateurs
    socket.on('init', (data: { messages: Message[], users: User[] }) => {
      console.log('Données initiales reçues:', data);
      setMessages(data.messages);
      setUsers(data.users);
    });

    // Réception d'un nouveau message
    socket.on('chat message', (message: Message) => {
      console.log('Nouveau message reçu:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // Mise à jour de la liste des utilisateurs
    socket.on('users', (updatedUsers: User[]) => {
      console.log('Liste des utilisateurs mise à jour:', updatedUsers);
      setUsers(updatedUsers);
    });

    socket.on('userJoined', (username: string) => {
      console.log(`${username} a rejoint le chat`);
    });

    socket.on('userLeft', (username: string) => {
      console.log(`${username} a quitté le chat`);
    });

    socket.on('registrationError', (error: string) => {
      console.error('Erreur d\'enregistrement:', error);
      setError(error);
      setIsLoggedIn(false);
    });

    return () => {
      socket.off('init');
      socket.off('chat message');
      socket.off('users');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('registrationError');
    };
  }, [socket]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !socket) {
      console.log('Erreur: pas de username ou pas de socket');
      return;
    }

    console.log('Tentative de connexion avec username:', username);
    socket.emit('register', username);
    setIsLoggedIn(true);

    socket.on('registrationError', (error: string) => {
      console.error('Erreur de connexion:', error);
      setError(error);
      setIsLoggedIn(false);
    });
  };

  const handleLogout = () => {
    if (!socket) return;
    socket.emit('logout');
    setIsLoggedIn(false);
  };

  const sendMessage = (content: string) => {
    if (!socket || !content.trim()) return;
    
    const message: Message = {
      type: 'text',
      username,
      content,
      timestamp: Date.now()
    };
    
    socket.emit('chat message', message);
  };

  const sendFile = async (file: File) => {
    if (!socket) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target?.result as string;
      if (!fileData) return;
      
      socket.emit('file message', {
        fileData,
        fileType: file.type,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="app">
      <Header />
      <div className="chat-container">
        {!isLoggedIn ? (
          // Page de connexion
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-black via-red-900 to-black">
            <div className="w-full max-w-md space-y-8 p-4 sm:p-8 rounded-none bg-black/90 border-2 border-red-600">
              <div className="text-center space-y-2">
                <h1 className="text-4xl sm:text-5xl font-bold text-red-600 transform hover:scale-105 transition-transform duration-300" style={{ fontFamily: 'Impact, sans-serif' }}>
                  LIBERCHAT
                </h1>
                <div className="flex justify-center space-x-4 my-4">
                  <span className="text-2xl sm:text-3xl">☭</span>
                  <span className="text-2xl sm:text-3xl">Ⓐ</span>
                  <span className="text-2xl sm:text-3xl">⚑</span>
                </div>
                <p className="text-red-400 uppercase tracking-widest text-xs sm:text-sm">La communication libre pour tous</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4 mt-8">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="NOM DE CAMARADE"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-black border-2 border-red-600 text-red-100 placeholder-red-700 focus:outline-none focus:border-red-400 uppercase text-sm sm:text-base"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 sm:py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-all duration-200 transform hover:scale-105 focus:outline-none border-2 border-red-400 hover:border-red-300 text-sm sm:text-base"
                >
                  Rejoindre la révolution
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-900/50 border-l-4 border-red-600 text-red-200 text-xs sm:text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Interface principale
          <div className="flex flex-col sm:flex-row h-screen bg-black">
            {/* Liste des utilisateurs - visible sur ordinateur */}
            <div className="hidden sm:flex w-64 bg-black border-r-2 border-red-900 flex-col">
              <div className="p-4 border-b-2 border-red-900">
                <h2 className="text-2xl font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                  <span>Camarades</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">☭</span>
                    <span className="text-xl">Ⓐ</span>
                    <span className="text-xl">⚑</span>
                  </div>
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {users.map((user) => (
                  <div
                    key={user.socketId}
                    className="flex items-center justify-between p-2 hover:bg-red-900/20 border border-red-900/30 transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-lg">☭</span>
                      <span className="text-red-200 uppercase">{user.username}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone principale */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between p-3 bg-black border-b-2 border-red-900">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-red-600">LIBERCHAT</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 text-xl">☭</span>
                    <span className="text-red-600 text-xl">Ⓐ</span>
                    <span className="text-red-600 text-xl">⚑</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-red-400 uppercase">{username}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-100 border border-red-700 uppercase text-xs font-bold transition-colors"
                  >
                    Sortir
                  </button>
                </div>
              </div>

              {/* Zone de chat */}
              <div className="flex-1 flex flex-col overflow-hidden bg-black/30">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      message={message}
                      isOwnMessage={message.username === username}
                    />
                  ))}
                </div>

                {/* Zone de saisie fixe en bas */}
                <div className="border-t-2 border-red-900 bg-black">
                  <ChatInput onSendMessage={sendMessage} onSendFile={sendFile} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
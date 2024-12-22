import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';

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
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connecté au serveur');
      console.log('Socket connecté:', newSocket.id);
      console.log('Socket ID:', newSocket.id);
      setError('');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Erreur de connexion:', err);
      setError('Erreur de connexion au serveur');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Gestion des erreurs réseau
  useEffect(() => {
    if (!socket) return;

    const handleReconnect = () => {
      console.log('Reconnecté au serveur');
      setError('');
      if (isLoggedIn && username) {
        socket.emit('register', username);
      }
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      setError(`Tentative de reconnexion (${attemptNumber})...`);
    };

    const handleReconnectError = (err: Error) => {
      console.error('Erreur de reconnexion:', err);
      setError('Impossible de se reconnecter au serveur');
    };

    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_error', handleReconnectError);

    return () => {
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_error', handleReconnectError);
    };
  }, [socket, isLoggedIn, username]);

  // Gestion des messages et des utilisateurs
  useEffect(() => {
    if (!socket || !isLoggedIn) return;

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
  }, [socket, isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !socket) return;

    socket.emit('register', username);
    setIsLoggedIn(true);
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
        socket.emit('file message', {
            fileData,
            fileType: file.type,
            fileName: file.name
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-black text-red-100">
      {!isLoggedIn ? (
        // Page de connexion
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-black via-red-900 to-black">
          <div className="w-full max-w-md space-y-8 p-8 rounded-none bg-black/90 border-2 border-red-600">
            <div className="text-center space-y-2">
              <h1 className="text-5xl font-bold text-red-600 transform hover:scale-105 transition-transform duration-300" style={{ fontFamily: 'Impact, sans-serif' }}>
                LIBERCHAT
              </h1>
              <div className="flex justify-center space-x-4 my-4">
                <span className="text-3xl">☭</span>
                <span className="text-3xl">Ⓐ</span>
              </div>
              <p className="text-red-400 uppercase tracking-widest text-sm">La communication libre pour tous</p>
            </div>
            
            <div className="space-y-4 mt-8">
              <div className="space-y-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="NOM DE CAMARADE"
                  className="w-full px-4 py-3 bg-black border-2 border-red-600 text-red-100 placeholder-red-700 focus:outline-none focus:border-red-400 uppercase"
                />
              </div>
              
              <button
                onClick={handleLogin}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-all duration-200 transform hover:scale-105 focus:outline-none border-2 border-red-400 hover:border-red-300"
              >
                Rejoindre la révolution
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-900/50 border-l-4 border-red-600 text-red-200 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Interface principale
        <div className="flex h-screen overflow-hidden">
          {/* Liste des utilisateurs */}
          <div className="w-64 bg-black border-r-2 border-red-900 flex flex-col">
            <div className="p-4 border-b-2 border-red-900">
              <h2 className="text-2xl font-bold text-red-600 uppercase tracking-wider">
                Camarades
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
          <div className="flex-1 flex flex-col bg-black min-w-0">
            {/* Zone de chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isOwnMessage={message.username === username}
                />
              ))}
            </div>
            <div className="p-4 border-t-2 border-red-900 bg-black">
              <ChatInput onSendMessage={sendMessage} onSendFile={sendFile} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
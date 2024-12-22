import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB
  pingTimeout: 120000, // 2 minutes pour les gros fichiers
  pingInterval: 25000
});

// Configuration des logs
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Stockage en mémoire
const users = new Map();
const usersByName = new Map();
const messages = [];
const MAX_MESSAGES = 100;

// Nettoyage périodique des messages
const cleanOldMessages = () => {
  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
};

setInterval(cleanOldMessages, 300000); // Toutes les 5 minutes

// Ajout de validations supplémentaires
const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 20) {
    throw new Error('Username must be between 3 and 20 characters');
  }
  // Empêcher les caractères spéciaux
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
};

io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  // Envoyer l'état initial
  socket.emit('init', {
    users: Array.from(users.values()),
    messages: messages
  });
  console.log('État initial envoyé à', socket.id);

  // Enregistrement d'un utilisateur
  socket.on('register', (username) => {
    try {
      validateUsername(username);
      
      if (usersByName.has(username)) {
        socket.emit('registrationError', 'Username already exists');
        console.log('Erreur d\'enregistrement pour', username, ': déjà existant');
        return;
      }

      console.log(`Utilisateur enregistré: ${username}`);
      logger.info(`User registered: ${username}`);
      const userInfo = {
        username,
        socketId: socket.id,
        isInCall: false
      };
      
      users.set(socket.id, userInfo);
      usersByName.set(username, socket.id);
      
      // Notifier tout le monde
      io.emit('users', Array.from(users.values()));
      io.emit('userJoined', username);
      console.log('Liste des utilisateurs mise à jour:', Array.from(users.values()));
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      socket.emit('registrationError', error.message);
    }
  });

  // Gestion des messages
  socket.on('chat message', (message) => {
    console.log('Message reçu:', message);
    messages.push(message);
    io.emit('chat message', message);
    console.log('Message diffusé à tous les utilisateurs');
  });

  // Gestion des fichiers
  socket.on('file message', (fileData) => {
    console.log('Fichier reçu de type:', fileData.fileType);
    const message = {
      type: 'file',
      username: users.get(socket.id)?.username,
      fileData: fileData.fileData,
      fileType: fileData.fileType,
      fileName: fileData.fileName,
      timestamp: Date.now()
    };
    messages.push(message);
    io.emit('chat message', message);
    console.log('Fichier diffusé à tous les utilisateurs');
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log('Utilisateur déconnecté:', user.username);
      logger.info(`User disconnected: ${user.username}`);
      users.delete(socket.id);
      usersByName.delete(user.username);
      io.emit('users', Array.from(users.values()));
      io.emit('userLeft', user.username);
    }
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
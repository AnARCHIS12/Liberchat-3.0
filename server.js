import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import winston from 'winston';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration du logger
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

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();

// Sécuriser les headers HTTP
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Limiter le nombre de requêtes sur les routes API sensibles
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', apiLimiter);

const server = createServer(app);

// Configuration Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB pour les images
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Autoriser le fallback en polling
  allowEIO3: true
});

// Middleware Express pour servir les fichiers statiques
app.use(express.static(join(__dirname, 'dist')));

// Middleware Express pour parser les requêtes JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Route par défaut
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
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
    throw new Error('Le nom d’utilisateur doit contenir entre 3 et 20 caractères');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Le nom d’utilisateur ne peut contenir que des lettres, chiffres et underscores');
  }
};

io.engine.on("connection_error", (err) => {
  console.error('Erreur de connexion Socket.IO:', err);
  logger.error('Erreur de connexion Socket.IO:', err);
});

io.on('connection', (socket) => {
  console.log('Nouvelle connexion socket:', socket.id);
  logger.info('Nouvelle connexion:', socket.id);

  socket.on('reconnect_attempt', () => {
    console.log('Tentative de reconnexion:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Erreur socket:', error);
    logger.error('Socket error:', error);
  });

  socket.on('register', (username) => {
    try {
      validateUsername(username);

      if (usersByName.has(username)) {
        socket.emit('registrationError', 'Ce nom est déjà pris');
        return;
      }

      const user = { username, socketId: socket.id, isInCall: false };
      users.set(socket.id, user);
      usersByName.set(username, socket.id);

      socket.emit('init', {
        messages: messages.slice(-50),
        users: Array.from(users.values())
      });

      socket.broadcast.emit('userJoined', username);
      io.emit('users', Array.from(users.values()));

      logger.info(`Utilisateur enregistré: ${username}`);
    } catch (error) {
      logger.error(`Erreur d'enregistrement pour ${username}:`, error);
      socket.emit('registrationError', error.message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Déconnexion socket:', socket.id, 'Raison:', reason);
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      usersByName.delete(user.username);
      io.emit('userLeft', user.username);
      io.emit('users', Array.from(users.values()));
      console.log('Utilisateur déconnecté:', user.username);
    }
  });

  // Gestion des messages texte avec validation de la longueur
  socket.on('chat message', (message) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (typeof message.text !== 'string' || message.text.length > 1000) {
      socket.emit('error', 'Message trop long ou invalide.');
      return;
    }

    message.username = user.username;
    message.timestamp = Date.now();

    messages.push(message);
    io.emit('chat message', message);
    logger.info(`Message reçu de ${user.username}`);
  });

  // Gestion des fichiers avec validation du type et nettoyage du nom
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  socket.on('file message', (fileData) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      if (fileData.fileData.length > 50 * 1024 * 1024) { // 50MB max
        socket.emit('error', 'Fichier trop volumineux (max 50MB)');
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(fileData.fileType)) {
        socket.emit('error', 'Type de fichier non autorisé.');
        return;
      }

      fileData.fileName = fileData.fileName.replace(/[^a-zA-Z0-9_.-]/g, '');

      const message = {
        type: 'file',
        username: user.username,
        fileData: fileData.fileData,
        fileType: fileData.fileType,
        fileName: fileData.fileName,
        timestamp: Date.now()
      };

      messages.push(message);
      io.emit('chat message', message);
      logger.info(`Fichier reçu de ${user.username} (${fileData.fileType})`);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      socket.emit('error', 'Erreur lors du traitement du fichier');
    }
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
`Serveur démarré sur le port ${PORT}`);
});

export default app;

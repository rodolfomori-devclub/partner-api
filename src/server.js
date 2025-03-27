const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas
const userRoutes = require('./routes/userRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet()); // Segurança
app.use(cors()); // Permitir CORS
app.use(express.json()); // Parsing do body
app.use(compression()); // Compressão de respostas
app.use(morgan('dev')); // Logging

// Rate limiting para prevenir ataques de força bruta
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Rotas
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);

// Rota para health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  res.status(status).json({ message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; // Para testes
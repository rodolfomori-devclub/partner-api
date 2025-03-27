const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Inicializar o Firebase Admin
// Em ambiente de desenvolvimento, usamos o arquivo de serviço
// Em produção, usamos variáveis de ambiente
let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // Verificar se temos todas as variáveis necessárias
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
  }

  serviceAccount = {
    type: process.env.FIREBASE_TYPE || 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };
} else {
  // Em desenvolvimento, carregamos o arquivo local
  const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(serviceAccountPath)) {
    console.warn(`Arquivo de credenciais não encontrado em ${serviceAccountPath}`);
    console.warn('Para desenvolvimento local, crie este arquivo com suas credenciais do Firebase');
    
    // Credenciais de exemplo para desenvolvimento (não funcionais)
    serviceAccount = {
      type: 'service_account',
      project_id: 'example-project',
      private_key_id: '1234567890abcdef',
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BA-----END PRIVATE KEY-----\n',
      client_email: 'firebase-adminsdk@example-project.iam.gserviceaccount.com',
      client_id: '1234567890',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40example-project.iam.gserviceaccount.com'
    };
  } else {
    serviceAccount = require(serviceAccountPath);
  }
}

// Verificar se já foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

// Inicializar Firestore
const db = admin.firestore();

// Habilitar caching para melhorar performance
db.settings({
  cacheSizeBytes: admin.firestore.CACHE_SIZE_UNLIMITED
});

// Coleções que vamos usar
const usersCollection = db.collection('users');
const locationsCollection = db.collection('locations');

module.exports = {
  admin,
  db,
  usersCollection,
  locationsCollection
};
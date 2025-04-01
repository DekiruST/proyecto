// index.js (Servidor 1 con Rate Limit - extendido con más info de logs)
const express = require('express');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const cors = require('cors');
const bcrypt = require('bcrypt');
const os = require('os');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://proyecto-final-8e070.firebaseio.com'
});

const db = admin.firestore();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    logRequest(req, 429, 'warn');
    return res.status(429).json({ error: 'Demasiadas peticiones, intente más tarde' });
  }
});

const logRequest = async (req, statusCode = 200, logLevel = 'info') => {
  try {
    const log = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      method: req.method,
      path: req.path,
      protocol: req.protocol,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: statusCode,
      logLevel,
      server: 1,
      hostname: os.hostname(),
      responseTime: Date.now() - (req.startTime || Date.now()),
      query: req.query || {},
      params: req.params || {},
      system: {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        pid: process.pid,
        url: req.originalUrl
      },
      headers: req.headers,
      body: req.method === 'POST' ? req.body : null
    };
    await db.collection('logs').add(log);
  } catch (error) {
    console.error('Error guardando log:', error);
  }
};

app.use(async (req, res, next) => {
  await logRequest(req, 200);
  next();
});

app.get('/getInfo', limiter, (req, res) => {
  res.json({
    nodeVersion: process.version,
    student: {
      name: 'Jose Maria Santa Ana',
      group: 'IDGS011'
    }
  });
});

app.post('/register', limiter, [
  check('email').isEmail().normalizeEmail(),
  check('username').notEmpty().trim().escape(),
  check('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    await logRequest(req, 400, 'warn');
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userSnapshot = await db.collection('users')
      .where('email', '==', req.body.email)
      .limit(1)
      .get();

    if (!userSnapshot.empty) {
      await logRequest(req, 400, 'warn');
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const secret = speakeasy.generateSecret({
      length: 32,
      name: `MiApp (${req.body.email})`,
      issuer: 'MiApp'
    });

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const newUser = {
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
      mfaSecret: secret.base32,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null
    };

    const userRef = await db.collection('users').add(newUser);
    await logRequest(req, 201, 'info');

    return res.status(201).json({
      message: 'Usuario registrado con éxito',
      userId: userRef.id,
      otpauth_url: secret.otpauth_url
    });
  } catch (error) {
    await logRequest(req, 500, 'error');
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/login', limiter, async (req, res) => {
  try {
    const userSnapshot = await db.collection('users')
      .where('email', '==', req.body.email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      await logRequest(req, 404, 'warn');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      await logRequest(req, 401, 'warn');
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: userDoc.id, email: user.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    await db.collection('users').doc(userDoc.id).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    await logRequest(req, 200, 'info');

    return res.json({
      token,
      mfaSecret: user.mfaSecret,
      userId: userDoc.id
    });
  } catch (error) {
    await logRequest(req, 500, 'error');
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/verify-mfa', limiter, async (req, res) => {
  try {
    const { token, mfaCode, userId } = req.body;
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      await logRequest(req, 404, 'warn');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = userDoc.data();
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaCode,
      window: 2
    });

    if (verified) {
      await logRequest(req, 200, 'info');
      return res.json({ accessToken: token, message: 'Autenticación MFA exitosa' });
    } else {
      await logRequest(req, 401, 'warn');
      return res.status(401).json({ message: 'Código MFA inválido' });
    }
  } catch (error) {
    await logRequest(req, 500, 'error');
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.listen(3000, () => {
  console.log('Servidor 1 (con Rate Limit) escuchando en puerto 3000');
});

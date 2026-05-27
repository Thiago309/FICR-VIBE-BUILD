const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do Frontend (index.html, index.css, app.js) na raiz
app.use(express.static(__dirname));

// Configuração Inteligente de Conexão com o PostgreSQL
const host = process.env.DB_HOST || 'localhost';
const isConnectionString = host.startsWith('postgresql://') || host.startsWith('postgres://');

let connectionString = process.env.DATABASE_URL;
let isLocal = false;

if (connectionString) {
  isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
} else {
  if (isConnectionString) {
    connectionString = host;
    isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  } else {
    connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${host}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
    isLocal = host === 'localhost' || host === '127.0.0.1';
  }
}

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Test DB Connection & Auto-Migration
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao PostgreSQL:', err.stack);
  }
  console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
  
  // Criar tabela 'submissions' se ela não existir (auto-migration)
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        mensagem_original TEXT NOT NULL,
        mensagem_higienizada TEXT NOT NULL,
        consentimento BOOLEAN NOT NULL DEFAULT FALSE,
        compliance_score INT NOT NULL,
        violations_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  client.query(createTableQuery, (tableErr, result) => {
    release();
    if (tableErr) {
      return console.error('Erro ao criar/verificar tabela submissions:', tableErr.stack);
    }
    console.log('Tabela "submissions" verificada/criada com sucesso no banco de dados!');
  });
});

// Routes
// 1. POST - Save a new submission
app.post('/api/submissions', async (req, res) => {
  const { nome, email, mensagem_original, mensagem_higienizada, consentimento, compliance_score, violations_count } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ error: 'Os campos nome e email são obrigatórios.' });
  }

  try {
    const queryText = `
      INSERT INTO submissions (nome, email, mensagem_original, mensagem_higienizada, consentimento, compliance_score, violations_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      nome,
      email,
      mensagem_original || '',
      mensagem_higienizada || '',
      consentimento === true,
      compliance_score || 100,
      violations_count || 0
    ];

    const result = await pool.query(queryText, values);
    console.log(`[DB SAVE] Registro inserido ID: ${result.rows[0].id}`);
    res.status(201).json({
      success: true,
      message: 'Submissão de formulário salva com sucesso em conformidade com a LGPD.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao salvar no banco:', error);
    res.status(500).json({ error: 'Erro interno ao salvar no banco de dados.' });
  }
});

// 2. GET - Retrieve all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM submissions ORDER BY created_at DESC;');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erro ao consultar banco:', error);
    res.status(500).json({ error: 'Erro interno ao consultar o banco de dados.' });
  }
});

// Rota Fallback para SPA (Servir index.html para qualquer rota que não seja de API)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Servidor de conformidade LGPD ativo na porta ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test DB Connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao PostgreSQL no Docker:', err.stack);
  }
  console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
  release();
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

// Start Server
app.listen(PORT, () => {
  console.log(`Servidor de conformidade LGPD ativo na porta ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ===> LINHA ADICIONADA AQUI <===
// Diz ao servidor para entregar o index.html, index.css e app.js para o navegador
app.use(express.static(__dirname));

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // <-- LINHA OBRIGATÓRIA PARA O RENDER
  }
});

// Test DB Connection
pool.connect((err, client, release) => {
  if (err) {
    // Atualizei o texto de 'Docker' para 'Render/Nuvem' para ficar coerente com seu ambiente atual
    return console.error('Erro ao conectar ao PostgreSQL na Nuvem:', err.stack);
  }
  console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
  release();
});

// ... (O restante do código das rotas app.post e app.get continua exatamente igual ao que você mandou!)
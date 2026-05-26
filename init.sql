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

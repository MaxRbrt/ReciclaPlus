CREATE DATABASE IF NOT EXISTS reciclaplus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE reciclaplus;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pontos_coleta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  descricao TEXT NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  bairro VARCHAR(120) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  foto_url TEXT NOT NULL,
  horario_funcionamento VARCHAR(160) NOT NULL,
  status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
  usuario_id INT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pontos_status (status),
  INDEX idx_pontos_bairro (bairro),
  CONSTRAINT fk_pontos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ponto_categorias (
  ponto_id INT NOT NULL,
  categoria_id INT NOT NULL,
  PRIMARY KEY (ponto_id, categoria_id),
  CONSTRAINT fk_ponto_categorias_ponto
    FOREIGN KEY (ponto_id) REFERENCES pontos_coleta(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ponto_categorias_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favoritos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  ponto_id INT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_favoritos_usuario_ponto (usuario_id, ponto_id),
  CONSTRAINT fk_favoritos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_ponto
    FOREIGN KEY (ponto_id) REFERENCES pontos_coleta(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categorias (id, nome) VALUES
  (1, 'Papel'),
  (2, 'Plastico'),
  (3, 'Vidro'),
  (4, 'Metal'),
  (5, 'Pilhas e baterias'),
  (6, 'Eletronicos'),
  (7, 'Oleo de cozinha'),
  (8, 'Roupas'),
  (9, 'Outros')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Migracao 001: cidade do ponto de coleta (filtro por cidade na Comunidade).
-- Para bancos criados antes desta coluna existir. Rode uma unica vez:
--   mysql -u root -p -e "source sql/migracao-001-cidade.sql"
-- Bancos novos ja nascem com a coluna pelo init.sql.

SET NAMES utf8mb4;

USE reciclaplus;

ALTER TABLE pontos_coleta
  ADD COLUMN cidade VARCHAR(120) NOT NULL DEFAULT '' AFTER bairro,
  ADD INDEX idx_pontos_cidade (cidade);

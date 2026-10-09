-- Migracao 002: momento da ultima troca de senha.
-- Tokens emitidos antes dessa data deixam de valer, entao trocar a senha
-- encerra as sessoes abertas em outros aparelhos.
-- Para bancos criados antes desta coluna existir. Rode uma unica vez:
--   mysql -u root -p -e "source sql/migracao-002-senha-alterada.sql"
-- Bancos novos ja nascem com a coluna pelo init.sql.

SET NAMES utf8mb4;

USE reciclaplus;

ALTER TABLE usuarios
  ADD COLUMN senha_alterada_em TIMESTAMP NULL DEFAULT NULL AFTER senha;

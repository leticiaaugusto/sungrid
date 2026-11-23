-- =====================================================================
-- SunGrid - Segurança no Supabase (rodar SOMENTE no Supabase)
--
-- O Supabase publica automaticamente uma API para as tabelas do schema
-- "public". Como quem acessa o banco é a nossa API em Express, ligamos o
-- RLS sem nenhuma política: ninguém lê as tabelas por essa API pública.
-- A nossa API continua com acesso total porque conecta com o usuário
-- "postgres", dono das tabelas (o dono não é bloqueado pelo RLS).
-- =====================================================================

ALTER TABLE usuario           ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_recuperacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE ativo             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leitura           ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetria_atual  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerta            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamado           ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifa            ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao      ENABLE ROW LEVEL SECURITY;

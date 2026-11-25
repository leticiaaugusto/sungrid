-- Esta migração separa os dados da loja simulada das contas dos usuários.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'usuario_papel_check'
  ) THEN
    ALTER TABLE usuario
      ADD CONSTRAINT usuario_papel_check
      CHECK (papel IN ('OPERADOR', 'ADMINISTRADOR', 'SISTEMA'));
  ELSE
    ALTER TABLE usuario DROP CONSTRAINT usuario_papel_check;
    ALTER TABLE usuario
      ADD CONSTRAINT usuario_papel_check
      CHECK (papel IN ('OPERADOR', 'ADMINISTRADOR', 'SISTEMA'));
  END IF;
END $$;

INSERT INTO usuario (nome, email, senha_hash, cargo, papel)
VALUES (
  'Simulador SunGrid',
  'simulador@sungrid.local',
  '!conta-interna-sem-login',
  'Sistema',
  'SISTEMA'
)
ON CONFLICT (LOWER(email)) DO UPDATE
SET nome = EXCLUDED.nome,
    cargo = EXCLUDED.cargo,
    papel = 'SISTEMA';

ALTER TABLE ativo
  ADD COLUMN IF NOT EXISTS usuario_id INT;

UPDATE ativo
SET usuario_id = (
  SELECT id
  FROM usuario
  WHERE email = 'simulador@sungrid.local'
  LIMIT 1
)
WHERE usuario_id IS NULL;

ALTER TABLE ativo
  ALTER COLUMN usuario_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'ativo_usuario_fk'
  ) THEN
    ALTER TABLE ativo
      ADD CONSTRAINT ativo_usuario_fk
      FOREIGN KEY (usuario_id)
      REFERENCES usuario (id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ativo_usuario ON ativo (usuario_id);

COMMIT;

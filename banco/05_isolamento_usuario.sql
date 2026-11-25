-- Esta migração atribui os ativos existentes à conta administradora.
BEGIN;

ALTER TABLE ativo
  ADD COLUMN IF NOT EXISTS usuario_id INT;

ALTER TABLE ativo
  ALTER COLUMN usuario_id DROP NOT NULL;

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

UPDATE ativo
SET usuario_id = (
  SELECT id FROM usuario WHERE papel = 'ADMINISTRADOR' ORDER BY id LIMIT 1
)
WHERE usuario_id IS NULL
   OR usuario_id IN (SELECT id FROM usuario WHERE papel = 'SISTEMA');

DELETE FROM usuario WHERE papel = 'SISTEMA';

ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_papel_check;
ALTER TABLE usuario
  ADD CONSTRAINT usuario_papel_check
  CHECK (papel IN ('OPERADOR', 'ADMINISTRADOR'));

CREATE INDEX IF NOT EXISTS idx_ativo_usuario ON ativo (usuario_id);

COMMIT;

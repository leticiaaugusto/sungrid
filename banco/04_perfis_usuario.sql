
-- Esta parte altera a tabela usuario.
ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS papel_solicitado VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'usuario_papel_solicitado_check'
  ) THEN
    ALTER TABLE usuario
      ADD CONSTRAINT usuario_papel_solicitado_check
      CHECK (papel_solicitado IN ('OPERADOR', 'ADMINISTRADOR'));
  END IF;
END $$;

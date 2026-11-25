-- Esta migração permite ao administrador atribuir ativos aos operadores.
BEGIN;

CREATE TABLE IF NOT EXISTS ativo_operador (
  ativo_id INT NOT NULL
    REFERENCES ativo (id) ON DELETE CASCADE,
  operador_id INT NOT NULL
    REFERENCES usuario (id) ON DELETE CASCADE,
  atribuido_por INT
    REFERENCES usuario (id) ON DELETE SET NULL,
  atribuido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ativo_id, operador_id)
);

CREATE INDEX IF NOT EXISTS idx_ativo_operador_operador
  ON ativo_operador (operador_id);

COMMIT;

-- Esta migração vincula os ativos simulados à conta administradora.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE papel = 'ADMINISTRADOR') THEN
    RAISE EXCEPTION 'Crie uma conta administradora antes de executar esta migração.';
  END IF;
END $$;

INSERT INTO ativo (
  codigo, nome, tipo, fabricante, status, horas_operacao, proxima_manutencao_h, instalado_em,
  temperatura_max_c, tensao_nominal_v, tolerancia_tensao_pct, corrente_max_a, eficiencia_min_pct, usuario_id
)
SELECT
  dados.codigo,
  dados.nome,
  dados.tipo,
  dados.fabricante,
  dados.status,
  dados.horas_operacao,
  dados.proxima_manutencao_h,
  dados.instalado_em,
  dados.temperatura_max_c,
  dados.tensao_nominal_v,
  dados.tolerancia_tensao_pct,
  dados.corrente_max_a,
  dados.eficiencia_min_pct,
  administrador.id
FROM (
  VALUES
    ('PNL-01', 'Arranjo Fotovoltaico A (15 kWp)', 'PAINEL', 'Canadian Solar', 'OPERANDO', 0, 8000, '2025-03-10'::date, 85, 600, 10, 30, 17),
    ('PNL-02', 'Arranjo Fotovoltaico B (15 kWp)', 'PAINEL', 'Canadian Solar', 'OPERANDO', 0, 8000, '2025-03-10'::date, 85, 600, 10, 30, 17),
    ('INV-01', 'Inversor Solar IS-1500 #1', 'INVERSOR', 'SunTech Inc.', 'OPERANDO', 0, 5000, '2025-03-12'::date, 70, 380, 5, 25, 95),
    ('INV-02', 'Inversor Solar IS-1500 #2', 'INVERSOR', 'SunTech Inc.', 'OPERANDO', 0, 1200, '2025-03-12'::date, 70, 380, 5, 25, 95),
    ('MED-01', 'Medidor Geral da Loja', 'MEDIDOR', 'Landis+Gyr', 'OPERANDO', 0, NULL, '2025-03-05'::date, NULL, 380, 5, 80, NULL),
    ('BAT-01', 'Banco de Baterias 20 kWh', 'BATERIA', 'BYD', 'OPERANDO', 0, 6000, '2025-04-01'::date, 45, 48, 10, 120, NULL),
    ('SNS-01', 'Sensor de Temperatura Ambiente', 'SENSOR', 'Hikari', 'OPERANDO', 0, NULL, '2025-03-10'::date, 60, 12, 10, 1, NULL)
) AS dados(
  codigo, nome, tipo, fabricante, status, horas_operacao, proxima_manutencao_h, instalado_em,
  temperatura_max_c, tensao_nominal_v, tolerancia_tensao_pct, corrente_max_a, eficiencia_min_pct
)
CROSS JOIN LATERAL (
  SELECT id
  FROM usuario
  WHERE papel = 'ADMINISTRADOR'
  ORDER BY id
  LIMIT 1
) AS administrador
ON CONFLICT (codigo) DO UPDATE
SET usuario_id = EXCLUDED.usuario_id;

COMMIT;

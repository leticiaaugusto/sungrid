
-- Esta parte inicia as alterações no banco.
BEGIN;
-- Esta parte insere dados iniciais em ativo.
INSERT INTO ativo (codigo, nome, tipo, fabricante, status, horas_operacao, proxima_manutencao_h, instalado_em,
                   temperatura_max_c, tensao_nominal_v, tolerancia_tensao_pct, corrente_max_a, eficiencia_min_pct)
VALUES
  ('PNL-01', 'Arranjo Fotovoltaico A (15 kWp)', 'PAINEL',   'Canadian Solar', 'OPERANDO', 0, 8000, '2025-03-10', 85, 600, 10, 30,  17),
  ('PNL-02', 'Arranjo Fotovoltaico B (15 kWp)', 'PAINEL',   'Canadian Solar', 'OPERANDO', 0, 8000, '2025-03-10', 85, 600, 10, 30,  17),
  ('INV-01', 'Inversor Solar IS-1500 #1',       'INVERSOR', 'SunTech Inc.',   'OPERANDO', 0, 5000, '2025-03-12', 70, 380, 5,  25,  95),
  ('INV-02', 'Inversor Solar IS-1500 #2',       'INVERSOR', 'SunTech Inc.',   'OPERANDO', 0, 1200, '2025-03-12', 70, 380, 5,  25,  95),
  ('MED-01', 'Medidor Geral da Loja',           'MEDIDOR',  'Landis+Gyr',     'OPERANDO', 0, NULL, '2025-03-05', NULL, 380, 5, 80, NULL),
  ('BAT-01', 'Banco de Baterias 20 kWh',        'BATERIA',  'BYD',            'OPERANDO', 0, 6000, '2025-04-01', 45, 48,  10, 120, NULL),
  ('SNS-01', 'Sensor de Temperatura Ambiente',  'SENSOR',   'Hikari',         'OPERANDO', 0, NULL, '2025-03-10', 60, 12,  10, 1,   NULL);

-- Esta parte insere dados iniciais em configuracao.
INSERT INTO configuracao (id, meta_consumo_diario_kwh, limite_contratual_mes_kwh, limite_operacional_kw, fator_emissao_kgco2_kwh)
VALUES (1, 270, 8500, 25, 0.0289);

-- Esta parte insere dados iniciais em tarifa.
INSERT INTO tarifa (valor_kwh, vigente_desde) VALUES (0.95, '2025-01-01');

-- Esta parte confirma as alterações no banco.
COMMIT;
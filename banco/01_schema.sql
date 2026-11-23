-- =====================================================================
-- SunGrid - Schema PostgreSQL
-- Base: "SunGrid: Arquitetura e Regras de Negócio" v1.1 (Anexo A - MER,
--       Anexo B - enumerações) e frontend Caioosm/sungrid-frontend.
-- Execução: pgAdmin > banco de destino > Query Tool > executar (F5).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- usuario (RN01-RN03, RN09, RNF09, RNF11, RNF14)
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id          SERIAL       PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,                 -- hash bcrypt
    cargo       VARCHAR(60),
    papel       VARCHAR(20)  NOT NULL DEFAULT 'OPERADOR'
                CHECK (papel IN ('OPERADOR', 'ADMINISTRADOR')),
    papel_solicitado VARCHAR(20)
                CHECK (papel_solicitado IN ('OPERADOR', 'ADMINISTRADOR')),
    foto_url    VARCHAR(255),
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- RN03: e-mail único sem diferenciar maiúsculas/minúsculas
CREATE UNIQUE INDEX uk_usuario_email ON usuario (LOWER(email));

-- ---------------------------------------------------------------------
-- token_recuperacao (RN05, RNF12) - guarda apenas o hash do token
-- ---------------------------------------------------------------------
CREATE TABLE token_recuperacao (
    id          SERIAL       PRIMARY KEY,
    usuario_id  INT          NOT NULL
                REFERENCES usuario (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ  NOT NULL,
    usado_em    TIMESTAMPTZ
);

CREATE INDEX idx_token_recuperacao_usuario ON token_recuperacao (usuario_id);

-- ---------------------------------------------------------------------
-- ativo (RN11, RN40, RN41, RN44) - colunas *_max/_nominal/_min = FaixaOperacao
-- ---------------------------------------------------------------------
CREATE TABLE ativo (
    id                      SERIAL       PRIMARY KEY,
    codigo                  VARCHAR(30)  NOT NULL UNIQUE,
    nome                    VARCHAR(120) NOT NULL,
    tipo                    VARCHAR(20)  NOT NULL
                            CHECK (tipo IN ('PAINEL', 'INVERSOR', 'MEDIDOR', 'BATERIA', 'SENSOR')),
    fabricante              VARCHAR(80),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'OPERANDO'
                            CHECK (status IN ('OPERANDO', 'ALERTA', 'OFFLINE', 'MANUTENCAO')),
    horas_operacao          NUMERIC      NOT NULL DEFAULT 0 CHECK (horas_operacao >= 0),
    proxima_manutencao_h    NUMERIC,
    instalado_em            DATE,
    temperatura_max_c       NUMERIC,
    tensao_nominal_v        NUMERIC,
    tolerancia_tensao_pct   NUMERIC,
    corrente_max_a          NUMERIC,
    eficiencia_min_pct      NUMERIC
);

-- RN10: busca por nome
CREATE INDEX idx_ativo_nome ON ativo (LOWER(nome));

-- ---------------------------------------------------------------------
-- leitura (RN15, RN43, RNF24) - histórico a cada 15 min
-- ---------------------------------------------------------------------
CREATE TABLE leitura (
    id                      BIGSERIAL    PRIMARY KEY,
    ativo_id                INT          NOT NULL
                            REFERENCES ativo (id) ON DELETE CASCADE,
    data_hora               TIMESTAMPTZ  NOT NULL,
    potencia_gerada_kw      NUMERIC,
    potencia_consumida_kw   NUMERIC,
    energia_gerada_kwh      NUMERIC,
    energia_consumida_kwh   NUMERIC,
    temperatura_c           NUMERIC,
    tensao_v                NUMERIC,
    corrente_a              NUMERIC,
    eficiencia_pct          NUMERIC,
    carga_pct               NUMERIC,
    -- RNF24 / RN17: uma leitura por ativo e data/hora (evita duplicação)
    CONSTRAINT uk_leitura_ativo_data UNIQUE (ativo_id, data_hora)
);

-- RNF06: agregações por período de toda a instalação
CREATE INDEX idx_leitura_data_hora ON leitura (data_hora);

-- ---------------------------------------------------------------------
-- telemetria_atual (RN42, RNF07) - no máximo 1 linha por ativo
-- ---------------------------------------------------------------------
CREATE TABLE telemetria_atual (
    ativo_id                INT          PRIMARY KEY
                            REFERENCES ativo (id) ON DELETE CASCADE,
    atualizado_em           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    potencia_gerada_kw      NUMERIC,
    potencia_consumida_kw   NUMERIC,
    temperatura_c           NUMERIC,
    tensao_v                NUMERIC,
    corrente_a              NUMERIC,
    eficiencia_pct          NUMERIC,
    carga_pct               NUMERIC
);

-- ---------------------------------------------------------------------
-- alerta (RN29, RN30, RN37, RN38, RNF08)
-- ativo_id nulo = alerta da instalação inteira
-- resolvido_por nulo em resolução automática (ação do sistema)
-- ---------------------------------------------------------------------
CREATE TABLE alerta (
    id              SERIAL       PRIMARY KEY,
    ativo_id        INT          REFERENCES ativo (id) ON DELETE SET NULL,
    tipo            VARCHAR(40)  NOT NULL,
    descricao       VARCHAR(255) NOT NULL,
    prioridade      VARCHAR(10)  NOT NULL
                    CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA')),
    status          VARCHAR(10)  NOT NULL DEFAULT 'ATIVO'
                    CHECK (status IN ('ATIVO', 'RESOLVIDO')),
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolvido_em    TIMESTAMPTZ,
    resolvido_por   INT          REFERENCES usuario (id) ON DELETE SET NULL,
    -- RN38: alerta resolvido precisa de data/hora de resolução
    CONSTRAINT ck_alerta_resolucao CHECK (
        (status = 'ATIVO'     AND resolvido_em IS NULL AND resolvido_por IS NULL) OR
        (status = 'RESOLVIDO' AND resolvido_em IS NOT NULL)
    )
);

-- RNF08: filtros por status e prioridade
CREATE INDEX idx_alerta_filtros ON alerta (status, prioridade, criado_em);
CREATE INDEX idx_alerta_ativo   ON alerta (ativo_id);

-- ---------------------------------------------------------------------
-- chamado (RN48, RN49)
-- ---------------------------------------------------------------------
CREATE TABLE chamado (
    id              SERIAL       PRIMARY KEY,
    ativo_id        INT          NOT NULL REFERENCES ativo (id),
    alerta_id       INT          REFERENCES alerta (id) ON DELETE SET NULL,
    aberto_por      INT          NOT NULL REFERENCES usuario (id),
    descricao       VARCHAR(500) NOT NULL,
    status          VARCHAR(15)  NOT NULL DEFAULT 'ABERTO'
                    CHECK (status IN ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO')),
    aberto_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolvido_em    TIMESTAMPTZ,
    -- RN49: chamado resolvido precisa de data/hora de encerramento
    CONSTRAINT ck_chamado_resolucao CHECK (
        (status <> 'RESOLVIDO' AND resolvido_em IS NULL) OR
        (status =  'RESOLVIDO' AND resolvido_em IS NOT NULL)
    )
);

CREATE INDEX idx_chamado_ativo  ON chamado (ativo_id);
CREATE INDEX idx_chamado_status ON chamado (status);

-- ---------------------------------------------------------------------
-- auditoria (RN39, RN46, RNF13) - alvo guardado por entidade + id
-- ---------------------------------------------------------------------
CREATE TABLE auditoria (
    id           BIGSERIAL    PRIMARY KEY,
    usuario_id   INT          REFERENCES usuario (id) ON DELETE SET NULL,
    acao         VARCHAR(40)  NOT NULL,
    entidade     VARCHAR(30),
    entidade_id  INT,
    ip           INET,
    detalhes     JSONB,
    data_hora    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditoria_usuario   ON auditoria (usuario_id);
CREATE INDEX idx_auditoria_data_hora ON auditoria (data_hora);

-- ---------------------------------------------------------------------
-- tarifa (RN27) - escolhida pela data de vigência
-- ---------------------------------------------------------------------
CREATE TABLE tarifa (
    id             SERIAL   PRIMARY KEY,
    valor_kwh      NUMERIC  NOT NULL CHECK (valor_kwh >= 0),
    vigente_desde  DATE     NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- configuracao (RN19, RN20, RN25) - linha única
-- ---------------------------------------------------------------------
CREATE TABLE configuracao (
    id                          INT      PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    meta_consumo_diario_kwh     NUMERIC,
    limite_contratual_mes_kwh   NUMERIC,
    limite_operacional_kw       NUMERIC,
    fator_emissao_kgco2_kwh     NUMERIC
);

COMMIT;

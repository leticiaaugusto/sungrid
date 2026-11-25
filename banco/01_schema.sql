
-- Esta parte inicia as alterações no banco.
BEGIN;
-- Esta parte cria a tabela usuario.
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

-- Este índice melhora as buscas em uk_usuario_email.
CREATE UNIQUE INDEX uk_usuario_email ON usuario (LOWER(email));

-- Esta parte cria a tabela token_recuperacao.
CREATE TABLE token_recuperacao (
    id          SERIAL       PRIMARY KEY,
    usuario_id  INT          NOT NULL
                REFERENCES usuario (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ  NOT NULL,
    usado_em    TIMESTAMPTZ
);

-- Este índice melhora as buscas em idx_token_recuperacao_usuario.
CREATE INDEX idx_token_recuperacao_usuario ON token_recuperacao (usuario_id);

-- Esta parte cria a tabela ativo.
CREATE TABLE ativo (
    id                      SERIAL       PRIMARY KEY,
    usuario_id              INT,
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
    eficiencia_min_pct      NUMERIC,
    CONSTRAINT ativo_usuario_fk
        FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

-- Este índice melhora as buscas em idx_ativo_nome.
CREATE INDEX idx_ativo_nome ON ativo (LOWER(nome));

-- Esta parte cria a tabela leitura.
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

    CONSTRAINT uk_leitura_ativo_data UNIQUE (ativo_id, data_hora)
);

-- Este índice melhora as buscas em idx_leitura_data_hora.
CREATE INDEX idx_leitura_data_hora ON leitura (data_hora);

-- Esta parte cria a tabela telemetria_atual.
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

-- Esta parte cria a tabela alerta.
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

    CONSTRAINT ck_alerta_resolucao CHECK (
        (status = 'ATIVO'     AND resolvido_em IS NULL AND resolvido_por IS NULL) OR
        (status = 'RESOLVIDO' AND resolvido_em IS NOT NULL)
    )
);

-- Este índice melhora as buscas em idx_alerta_filtros.
CREATE INDEX idx_alerta_filtros ON alerta (status, prioridade, criado_em);
-- Este índice melhora as buscas em idx_alerta_ativo.
CREATE INDEX idx_alerta_ativo   ON alerta (ativo_id);

-- Esta parte cria a tabela chamado.
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

    CONSTRAINT ck_chamado_resolucao CHECK (
        (status <> 'RESOLVIDO' AND resolvido_em IS NULL) OR
        (status =  'RESOLVIDO' AND resolvido_em IS NOT NULL)
    )
);

-- Este índice melhora as buscas em idx_chamado_ativo.
CREATE INDEX idx_chamado_ativo  ON chamado (ativo_id);
-- Este índice melhora as buscas em idx_chamado_status.
CREATE INDEX idx_chamado_status ON chamado (status);

-- Esta parte cria a tabela auditoria.
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

-- Este índice melhora as buscas em idx_auditoria_usuario.
CREATE INDEX idx_auditoria_usuario   ON auditoria (usuario_id);
-- Este índice melhora as buscas em idx_auditoria_data_hora.
CREATE INDEX idx_auditoria_data_hora ON auditoria (data_hora);

-- Esta parte cria a tabela tarifa.
CREATE TABLE tarifa (
    id             SERIAL   PRIMARY KEY,
    valor_kwh      NUMERIC  NOT NULL CHECK (valor_kwh >= 0),
    vigente_desde  DATE     NOT NULL UNIQUE
);

-- Esta parte cria a tabela configuracao.
CREATE TABLE configuracao (
    id                          INT      PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    meta_consumo_diario_kwh     NUMERIC,
    limite_contratual_mes_kwh   NUMERIC,
    limite_operacional_kw       NUMERIC,
    fator_emissao_kgco2_kwh     NUMERIC
);

-- Esta parte confirma as alterações no banco.
COMMIT;
# SunGrid

Plataforma de monitoramento de geração e consumo de energia solar — Projeto Integrador (UNICEPLAC).

Os dados vêm de um **simulador de uma loja em 24 horas** (painéis, inversores, medidor, bateria e sensor), gravados no PostgreSQL no mesmo formato que medidores reais produziriam.

Arquitetura (seção 2 do relatório): monólito em três camadas.

| Camada | Tecnologia | Pasta |
| --- | --- | --- |
| Interface web | React + Vite + Chart.js | `frontend/` |
| API REST | Node.js + Express (JavaScript) | `backend/` |
| Banco de dados | PostgreSQL (Supabase) | `banco/` |

## Organização por domínio (uma pasta por tela)

Cada tela do protótipo tem a sua pasta, no frontend e no backend, com o mesmo nome. Para explicar uma tela, basta abrir a pasta dela.

| Tela | Frontend (`frontend/src/dominios/`) | Backend (`backend/src/dominios/`) |
| --- | --- | --- |
| Login, Cadastro, Esqueci a senha, Redefinir senha | `autenticacao/` | `autenticacao/` (+ `usuarios/` para LGPD) |
| Dashboard Principal | `dashboard/` | `dashboard/` (+ `economia/` para CO₂) |
| Consumo Diário | `consumo-diario/` | `consumo/` |
| Consumo Mensal | `consumo-mensal/` | `consumo/` + `economia/` |
| Gerenciamento de Alertas | `alertas/` | `alertas/` |
| Acompanhamento de Ativo | `ativos/` | `ativos/` + `chamados/` |
| Lista de Ativos | `ativos/` | `ativos/` |
| Minha Conta | `usuarios/` | `autenticacao/` + `usuarios/` |
| Usuários (administrador) | `usuarios/` | `usuarios/` + `autenticacao/` |
| — (dados simulados) | — | `simulador/` |

Dentro de cada domínio do backend, as camadas são as do relatório (seção 2.2):

```
xxxRotas.js        -> recebe a requisição e devolve JSON (sem regra de negócio)
XxxService.js      -> regras de negócio (RN01–RN50)
xxxRepositorio.js  -> único lugar que acessa o banco
Xxx.js             -> entidade do diagrama de classes (Usuario, Ativo, Alerta...)
```

No frontend, cada domínio tem `PaginaXxx.jsx` (a tela), `GraficoXxx.jsx` (quando há gráfico) e `xxxServico.js` (chamadas à API). O que é comum a todas as telas (menu lateral, cabeçalho, componentes, cliente da API, sessão) fica em `frontend/src/compartilhado/`.

## Como rodar

Pré-requisito: **Node.js 20 ou mais novo**.

### 1. Banco de dados (Supabase)

No painel do Supabase, abra **SQL Editor** e rode, nesta ordem, o conteúdo de:

1. `banco/01_schema.sql` — cria as 10 tabelas
2. `banco/02_seguranca_supabase.sql` — fecha a API pública automática do Supabase (só no Supabase)
3. `banco/03_dados_iniciais.sql` — equipamentos da loja, metas/limites e tarifa
4. Para bancos criados antes desta versão, rode também `banco/04_perfis_usuario.sql`.
5. Em bancos criados antes da separação por usuário, rode também `banco/05_isolamento_usuario.sql`.

### 2. Backend (API)

```bash
cd backend
npm install
copy .env.example .env      # no Windows (no Linux/Mac: cp .env.example .env)
```

Abra o `.env` e preencha pelo menos:

- `DATABASE_URL`: no Supabase, clique em **Connect** → **Session pooler** e copie a string (troque `[YOUR-PASSWORD]` pela senha do banco).
- `JWT_SEGREDO`: um texto longo e aleatório.

Opcionalmente, configure os intervalos do simulador:

- `SIMULADOR_TELEMETRIA_SEG=5` — intervalo da telemetria (1 a 60 segundos).
- `SIMULADOR_LEITURA_MIN=15` — intervalo das leituras históricas (aceita `1` para demonstração).

Gere o histórico simulado (últimos 60 dias, leva poucos segundos):

```bash
npm run simulador:historico
```

Suba a API (já liga o simulador em tempo real e o job de detecção de offline):

```bash
npm start
```

A API fica em `http://localhost:3000/api/v1` (teste: `http://localhost:3000/api/v1/health`).

> **Atenção:** deixe `SIMULADOR_ATIVO=true` em **apenas uma máquina** do grupo. Nas outras, use `SIMULADOR_ATIVO=false`, senão vários simuladores escrevem no mesmo banco.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`, crie uma conta em **Cadastrar-se** e entre.

Para tornar um usuário administrador (no SQL Editor):

```sql
UPDATE usuario SET papel = 'ADMINISTRADOR' WHERE email = 'seu@email.com';
```

## O simulador (loja 24 h)

Arquivo principal: `backend/src/dominios/simulador/perfilLoja.js` (só matemática, fácil de explicar).

- **Loja**: aberta de segunda a sábado das 08h às 21h e domingo das 09h às 14h. De madrugada fica só a refrigeração (~5 kW); aberta, ~13 kW mais ar-condicionado, que acompanha a temperatura e faz o pico entre 13h e 16h.
- **Geração**: 2 arranjos de 15 kWp ligados a 2 inversores, com curva de sino e pico perto do meio-dia. A nebulosidade muda a cada dia.
- **Bateria de 20 kWh**: carrega com sol forte e descarrega das 17h30 às 21h.
- **Falhas para demonstrar alertas**: superaquecimento do INV-02 em alguns dias às 13h, pico de tensão no medidor, consumo acima do limite em dias quentes, bateria baixa em dias nublados e sensor que perde a comunicação de vez em quando.
- **Intervalos** (seção 2.2): telemetria atual a cada **10 s** (tabela `telemetria_atual`) e histórico a cada **15 min** (tabela `leitura`).

## Rotas da API (prefixo `/api/v1`)

| Método e rota | Tela |
| --- | --- |
| `POST /auth/login`, `POST /auth/cadastro`, `POST /auth/recuperar-senha`, `POST /auth/redefinir-senha`, `GET /auth/me` | Autenticação |
| `GET /dashboard/resumo`, `GET /consumo/diario`, `GET /sustentabilidade/carbono?periodo=semana` | Dashboard |
| `GET /consumo/horario?data=` | Consumo Diário |
| `GET /consumo/mensal/:mes`, `GET /economia/estimativa?mes=` | Consumo Mensal |
| `GET /alertas?status=&prioridade=`, `GET /alertas/exportar?formato=csv\|xlsx\|pdf`, `PATCH /alertas/:id/resolver` | Alertas |
| `GET /ativos?busca=`, `GET /ativos/:id`, `GET /ativos/:id/telemetria`, `GET /ativos/:id/historico?dias=7`, `POST /ativos/:id/reiniciar`, `POST /ativos/:id/chamados` | Acompanhamento de Ativo |
| `POST /ativos`, `PUT /ativos/:id` | Cadastro/edição de ativo (administrador) |
| `GET /usuarios`, `PATCH /usuarios/:id/papel` | Administração de usuários |
| `PATCH /usuarios/me`, `PUT /usuarios/me/senha` | Minha Conta |
| `GET /chamados?status=` | Chamados |
| `GET /usuarios/me/dados`, `DELETE /usuarios/me` | Conta (LGPD) |
| `GET /health` | Monitoramento |

## Decisões tomadas onde o relatório deixa pendências

No código, cada uma está marcada com o comentário `DECISÃO (DPxx)`. Basta buscar por "DECISÃO" para revisar.

| Pendência | Decisão adotada |
| --- | --- |
| DP03 — fuso horário | `America/Sao_Paulo` |
| DP04 — variação diária (RN16) | hoje x ontem **até o mesmo horário** |
| DP04 — comparação mensal (RN26) | média diária do mês x **mesmo período** do mês anterior |
| DP04 — pico solar (RN22) | leitura de 15 min com a maior potência somada dos inversores |
| DP05/DP15 — meta do gráfico semanal | usa a meta de consumo diário da `configuracao` |
| DP06/DP07 — economia e CO₂ | fórmulas **propostas** na seção 4 (energia gerada x tarifa / x fator de emissão) |
| DP08 — bateria baixa | abaixo de 20% |
| DP09 — resolução de alertas | automática quando normaliza, exceto **pico de tensão** (manual) |
| DP10 — exportação | exporta exatamente os alertas filtrados na tela |
| DP11 — manutenção | `proxima_manutencao_h` é um marco absoluto de horas de operação |
| DP12/DP22 — reinício remoto | bloqueado em MANUTENÇÃO; no modo simulado, o ativo fica 20 s sem gerar e a solicitação e o resultado são auditados separadamente |
| DP14 — alerta crítico | alerta ATIVO com prioridade ALTA |
| DP16 — economia do Dashboard | a do mês corrente (igual à da tela Consumo Mensal) |

Valores ilustrativos em `banco/03_dados_iniciais.sql`: tarifa de R$ 0,95/kWh (substituir pela tarifa da distribuidora) e fator de emissão de 0,0289 kgCO₂/kWh (MCTI, abr/2025 — confirmar a fonte).

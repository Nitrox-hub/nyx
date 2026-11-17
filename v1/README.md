# Nyx V1 — Local AI Companion

Primeira versao da Nyx: chat local via browser com LLM rodando em KoboldCpp.

## Stack

- **Backend**: Node.js (zero dependencias externas — HTTP puro)
- **Frontend**: HTML + CSS + JS vanilla
- **LLM**: Qwen3 8B via KoboldCpp (Vulkan, GPU AMD)
- **Interface**: Browser (localhost:3000)

## Arquitetura

```
Browser (localhost:3000)
   |
   v
server.js (Node.js HTTP)
   |
   v
KoboldCpp API (localhost:5001)
   |
   v
Qwen3 8B (GPU local)
```

## Arquivos

| Arquivo | Funcao |
|---------|--------|
| `server.js` | Servidor HTTP, proxy pro KoboldCpp, gerenciamento de sessao e resumos |
| `character.json` | Personalidade completa da Nyx (lore, prompts, dialogos, emocoes) |
| `package.json` | Metadados do projeto Node.js |
| `.env.example` | Exemplo de variaveis de ambiente (URL do KoboldCpp) |
| `public/index.html` | Interface HTML |
| `public/style.css` | Dark gothic theme (paleta vermelho/preto) |
| `public/app.js` | Frontend JS (chat, avatar, emocoes) |
| `public/sprites/` | Sprites pixel art da Nyx (idle, happy, thinking) |
| `data/` | Dados persistentes em runtime (summaries.json) |

## Features V1

- Chat com personalidade completa (Nyx, a Viuva Negra — mordoma vampira de Dracula)
- Lorebook dinamico (ativa entradas relevantes baseado no input)
- Deteccao de emocao por keywords (muda sprite: idle/happy/thinking)
- Rolling summaries automaticos (a cada 10 pares de mensagens)
- Sessao persistente com historico limitado (20 msgs)
- Sistema de novo-sessao com summary antes de limpar
- Interface dark gothic com sidebar + avatar

## Como Rodar

1. Tenha o KoboldCpp rodando com o modelo Qwen3 8B
2. Copie `.env.example` para `.env` e ajuste a URL se necessario
3. Execute:
```bash
npm start
```
4. Acesse http://localhost:3000

## Lore

Nyx e uma assassina vampira, uma dos Doze Mordomos do Conde Dracula. Sua personalidade mistura elegancia sombria com sarcasmo afiado. O usuario (Nitrox) e outro mordomo — o tesoureiro que domina Oromancia e Pratomancia.

Ver `character.json` para o lore completo.

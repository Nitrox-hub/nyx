<p align="center">
  <img src="docs/assets/nyx-banner.png" alt="Nyx" width="600">
  <br>
  <em>Your desktop AI companion with personality, memory, and a pixel art soul.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-v1%20complete-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/v2-in%20development-orange" alt="V2">
  <img src="https://img.shields.io/badge/LLM-local%20first-blue" alt="Local LLM">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

---

# Nyx

**Nyx** is a local-first AI desktop companion inspired by [Neuro-sama](https://virtualyoutuber.fandom.com/wiki/Neuro-sama). She lives on your screen as an animated pixel art avatar, chats with personality, remembers your conversations, sees your screen, and helps you with tasks — all running locally on your machine.

> **⚠️ This is a personal project built with AI-assisted development.**  
> I used Claude, GitHub Copilot, and other AI tools throughout the process — from architecture design to implementation. The goal was to demonstrate proficiency in orchestrating AI tools for real software engineering, not to pretend everything was hand-written.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              ORCHESTRATOR (Core)                 │
│         Event Bus + Message Pipeline             │
├─────────┬────────┬────────┬────────┬────────────┤
│  Brain  │  Voice │  Body  │  Eyes  │   Memory   │
│  (LLM)  │ (TTS)  │(Overlay)│(Vision)│  (Hybrid)  │
└────┬────┴───┬────┴───┬────┴───┬────┴─────┬──────┘
     │        │        │        │          │
  Qwen3/   Piper/   Electron/ Screen   SQLite +
  Llama    Coqui    Tauri    Capture   Markdown
                   +Sprites           + Obsidian
```

Nyx is built as a **modular orchestrator** — each component (brain, voice, body, eyes, memory) is an independent module connected through a central event bus. Swap any piece without rewriting the rest.

## Versions

### V1 — Terminal Chat ✅

The MVP that proved the concept works.

| Feature | Implementation |
|---------|---------------|
| Chat interface | Terminal-based text input/output |
| LLM Backend | KoboldCpp running Qwen3 8B locally |
| Personality | Character card with defined traits and behavior |
| Avatar | Static PNG display |
| Memory | Rolling conversation summaries |

👉 See [`v1/README.md`](v1/README.md) for setup and usage.

### V2 — Desktop Companion 🚧

The full vision: an animated pixel art companion living on your desktop.

| Module | Description | Status |
|--------|-------------|--------|
| **Orchestrator** | Event bus + plugin system connecting all modules | 🔜 Next |
| **Brain** | LLM integration with dynamic character card | 📋 Planned |
| **Memory** | 4-layer hybrid system (SQLite + Markdown files) | 📋 Planned |
| **Body** | Transparent overlay with animated pixel art sprites | 📋 Planned |
| **Voice** | Local TTS (Piper/Coqui) + STT (Whisper) | 📋 Planned |
| **Eyes** | Screen capture → multimodal LLM context | 📋 Planned |
| **Tools** | Web search, app launching, file interaction | 📋 Planned |

👉 See [`docs/architecture.md`](docs/architecture.md) for the full technical design.

## Memory System

Nyx uses a **hybrid memory architecture** — SQLite for fast indexed access, plain Markdown files for human readability:

```
nyx-memory/
├── episodes/      ← Conversation summaries
├── facts/         ← Learned facts about the user
├── personality/   ← Evolved personality traits
└── knowledge/     ← Accumulated knowledge
```

The same folder can be opened in **Obsidian** (or any Markdown editor) to browse and manually edit Nyx's memories. The viewer app is completely independent from the engine — Nyx doesn't need it running.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | KoboldCpp + Qwen3 8B (local) |
| Orchestrator | TypeScript / Python asyncio (TBD) |
| Overlay | Electron or Tauri |
| TTS | Piper / Coqui |
| STT | OpenAI Whisper (local) |
| Memory | SQLite (FTS5) + Markdown |
| Memory Viewer | Obsidian (optional) |
| Sprites | Aseprite (pixel art) |

## Project Structure

```
nyx/
├── v1/                 # V1: Terminal chat MVP
├── v2/                 # V2: Desktop companion (in development)
├── docs/
│   ├── architecture.md # Full technical design document
│   └── assets/         # Diagrams, screenshots, banners
├── memory/             # Memory folder template
├── README.md           # You are here
└── LICENSE
```

## Development Philosophy

1. **Local first** — Everything runs on your machine. No cloud APIs required.
2. **Modular** — Each component is replaceable. Swap LLMs, TTS engines, or the overlay without touching the rest.
3. **AI-assisted** — Built using AI tools as force multipliers, not as a crutch. Every architectural decision is documented and intentional.
4. **Iterative** — V1 proved the concept. V2 builds the product. Each phase delivers something usable.

## Acknowledgments

- Inspired by [Neuro-sama](https://www.twitch.tv/vedal987) and the VedalAI ecosystem
- Built with assistance from [Claude](https://claude.ai) (Anthropic) for architecture design, code generation, and project organization
- Pixel art sprites created in [Aseprite](https://www.aseprite.org/)

## Author

**Nitrox** — Computer Engineering student, 3D modeler, aspiring cloud engineer.

- Focused on AI orchestration, cloud infrastructure (AWS), and creative tech
- This project demonstrates practical AI tool proficiency for real software engineering

## License

MIT — See [LICENSE](LICENSE) for details.

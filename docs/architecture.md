# Nyx V2 — Architecture Design

> Full technical specification for the Nyx desktop companion.  
> Last updated: 2026-11-17

---

## Overview

Nyx V2 is a modular AI desktop companion built around a central **orchestrator** that connects independent modules through an event bus. Each module handles one concern (language, voice, display, vision, memory) and can be swapped without affecting the others.

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

---

## Module 1: Orchestrator (Core)

The backbone of the system. Manages module lifecycle and routes messages between them.

**Responsibilities:**
- Central event bus (pub/sub pattern)
- Message pipeline between modules
- Global state management (mood, current context, active mode)
- Module lifecycle (load, unload, restart)
- Plugin system for extending functionality

**Message flow example — user sends a message:**
```
User Input
  → Orchestrator receives text
  → Brain processes (LLM generates response + emotion tag)
  → Orchestrator routes:
      → Body: display text balloon + set sprite to emotion state
      → Voice: synthesize speech from response text
      → Memory: store conversation turn
```

**Tech candidates:** Node.js/TypeScript, Python asyncio, or Rust

---

## Module 2: Brain (LLM)

The language and reasoning engine.

**Responsibilities:**
- Process user input through the LLM
- Maintain dynamic system prompt with character card + context
- Detect emotion in generated responses → emit to overlay
- Support multiple backends (KoboldCpp now, Ollama/vLLM/cloud later)

**Current backend:** KoboldCpp with Qwen3 8B (proven in V1)

**Character card system:**
- Base personality traits (static)
- Dynamic context injection from Memory module
- Emotion detection from response content → mapped to sprite states

---

## Module 3: Voice (TTS/STT)

Gives Nyx a voice and ears.

**TTS (Text-to-Speech):**
- Primary: Piper or Coqui TTS (local, fast)
- Streaming output (start speaking before full response is ready)
- Voice profile customization

**STT (Speech-to-Text):**
- OpenAI Whisper running locally
- Wake word detection (optional)
- Continuous listening mode vs push-to-talk

**Optional:** Voice changer (w-okada/voice-changer repo available)

---

## Module 4: Body (Desktop Overlay)

Nyx's visual presence on screen.

**Responsibilities:**
- Transparent, always-on-top overlay window
- Render animated pixel art sprites based on current state
- Display text balloons with typewriter effect
- Handle user interaction (drag, click, minimize)

**Sprite states (priority order):**

| Priority | State | Description |
|----------|-------|-------------|
| P1 | idle | Breathing, blinking — default state |
| P1 | talking | Mouth moving, hand gestures |
| P1 | happy | Smiling, bright eyes |
| P1 | thinking | Hand on chin, ellipsis bubble |
| P2 | walk | Walking across screen |
| P2 | appear | Dramatic entrance animation |
| P2 | disappear | Exit with effect |
| P3 | angry | Irritated expression |
| P3 | sad | Sad expression |
| P3 | surprised | Wide eyes |
| P3 | sleeping | Zzz, closed eyes |

**Visual identity:**
- Pixel art style (sprite sheets made in Aseprite)
- Color palette: black / gold / red / silver (aligned with streaming brand)

**Tech candidates:** Electron or Tauri

---

## Module 5: Eyes (Screen Vision)

Nyx can see what's on your screen.

**Responsibilities:**
- Periodic or on-demand screen capture
- Send screenshots to LLM for multimodal context
- OCR fallback for non-multimodal models
- Contextual reactions to screen content

**Use cases:**
- "What am I looking at?" → Nyx describes the screen
- Proactive comments on detected activities (gaming, coding, browsing)
- Reading error messages and offering help

---

## Module 6: Memory (Hybrid Architecture)

Persistent memory using SQLite as the engine and Markdown files as the human-readable layer.

### 4 Memory Layers

| Layer | Scope | Storage | Lifetime |
|-------|-------|---------|----------|
| **Short-term** | Current conversation | RAM (rolling window) | Session |
| **Medium-term** | Recent session summaries | SQLite + episodes/*.md | Weeks |
| **Long-term** | Facts, preferences, learned traits | SQLite + facts/*.md, personality/*.md | Permanent |
| **Episodic** | Notable moments, specific events | SQLite + tagged episodes/*.md | Permanent |

### Hybrid Storage

```
┌──────────────────────────────────────────────┐
│          HYBRID MEMORY                       │
│                                              │
│  ┌─────────────┐    ┌─────────────────────┐  │
│  │   SQLite     │    │  /nyx-memory/       │  │
│  │  (engine)    │◄──►│  ├── episodes/      │  │
│  │  - FTS5      │    │  ├── facts/         │  │
│  │  - metadata  │    │  ├── personality/   │  │
│  │  - embeddings│    │  └── knowledge/     │  │
│  └──────────────┘    └──────────┬──────────┘  │
│                                 │             │
│    Nyx reads/writes         User can open    │
│    via orchestrator         with Obsidian    │
└──────────────────────────────────────────────┘
```

**SQLite handles:** Full-text search (FTS5), metadata indexing, timestamps, access frequency, vector embeddings (future).

**Markdown files handle:** Human-readable content, manual editing by user, git-versionable history, portable (copy folder = migrate memory).

**Viewer app (optional):** The `/nyx-memory/` folder is a standard Markdown workspace. Open it in Obsidian (recommended), Logseq, VSCode, or any editor. The viewer is independent from the engine — Nyx works without it.

---

## Module 7: Tools

Nyx's ability to act in the world.

**Planned capabilities:**
- Web search (via Firecrawl, Playwright)
- Open apps and URLs
- File system interaction
- Calendar/task integration (future)

---

## Development Phases

```
Phase 1: ORCHESTRATOR
  → Event bus + base module interface + tests
  → Plugin system (load/unload modules)

Phase 2: BRAIN + MEMORY
  → KoboldCpp API integration
  → Dynamic character card
  → Hybrid memory (SQLite + .md) with 4 layers

Phase 3: BODY (Overlay)
  → Transparent Electron/Tauri window
  → Sprite sheet renderer
  → State-based animation (idle, talking, etc)
  → Text balloon with typewriter effect

Phase 4: VOICE
  → TTS (Piper/Coqui)
  → STT (Whisper)
  → Lip sync with sprite animation

Phase 5: EYES + TOOLS
  → Screen capture → LLM
  → Web search
  → Desktop actions

Phase 6: POLISH
  → Refined personality
  → More sprites/emotions
  → Streaming integration (OBS)
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Modular orchestrator | Swap any piece without rewriting |
| Build order | Orchestrator first | Skeleton that connects everything |
| LLM backend | KoboldCpp (Qwen3 8B) | Proven in V1, local, free |
| Overlay | Electron or Tauri | Transparency, always-on-top, cross-platform |
| Avatar | Pixel art sprite sheet | Lightweight, stylish, frame-by-frame animation |
| Memory engine | SQLite + Markdown | Fast indexed access + human-readable files |
| Memory viewer | Obsidian (optional) | Graph view for exploring memory connections |
| Memory layers | 4 (short/medium/long/episodic) | Balances immediate context and long-term recall |
| Visual palette | Black/gold/red/silver | Aligned with streaming brand identity |

---

## Reference Repositories

Architectures and tools studied during design:

| Repo | Relevance |
|------|-----------|
| neuro-sdk | Brain/body WebSocket separation pattern |
| eliza | Plugin-based agent framework |
| langchain/langgraph | Chain orchestration patterns |
| Mate-Engine | Desktop companion engine |
| z-waif | Desktop waifu with personality |
| pestinha | Brazilian desktop assistant |
| mem0 | Persistent AI memory API |
| Open-LLM-VTuber | VTuber + LLM overlay reference |

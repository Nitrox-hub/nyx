# Nyx V1 — Terminal Chat MVP

The first version of Nyx: a terminal-based AI chat companion with personality, powered by a local LLM.

## What it does

- Text chat through the terminal
- Personality defined via character card
- Rolling conversation memory (summarized context window)
- Static PNG avatar display
- Fully local — no internet required after setup

## Requirements

- [KoboldCpp](https://github.com/LostRuins/koboldcpp) installed and running
- A GGUF model file (tested with Qwen3 8B)
- Python 3.10+

## Setup

1. **Start KoboldCpp** with your model:
   ```bash
   koboldcpp --model path/to/qwen3-8b.gguf --port 5001
   ```

2. **Configure Nyx** — edit `config.json` with your KoboldCpp endpoint and character card settings.

3. **Run:**
   ```bash
   python nyx.py
   ```

## Character Card

Nyx's personality is defined in `character_card.json`. Key traits:

- Curious and playful
- Slightly sarcastic but caring
- Interested in tech, games, and creative projects
- Remembers context from the current session via rolling summaries

## Limitations (why V2 exists)

- Terminal only — no GUI, no overlay
- Static avatar — no animations or expressions
- No voice — text input/output only
- No screen awareness — can't see what you're doing
- Memory resets between sessions — no long-term persistence
- Single LLM backend — KoboldCpp only

All of these are addressed in [V2](../docs/architecture.md).

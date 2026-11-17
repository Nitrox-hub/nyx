# Nyx Memory

This folder is Nyx's persistent memory store.

**For Nyx:** SQLite indexes and reads/writes the Markdown files programmatically.  
**For you:** Open this folder as an Obsidian vault (or any Markdown editor) to browse and edit memories.

## Structure

```
memory/
├── episodes/      ← Conversation summaries (auto-generated)
├── facts/         ← Learned facts about the user
├── personality/   ← Evolved personality traits
├── knowledge/     ← Accumulated knowledge
├── nyx.db         ← SQLite index (auto-generated, gitignored)
└── README.md      ← You are here
```

## Notes

- The `.md` files are the source of truth — SQLite re-indexes from them
- Edit any `.md` file manually; Nyx picks up changes on next load
- The `nyx.db` file is gitignored (it contains personal data and is regenerated from the .md files)
- Memory folders are gitignored by default — your memories are private

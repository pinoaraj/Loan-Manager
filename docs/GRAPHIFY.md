# Graphify Workflow

## Purpose
Use Graphify in this repo to keep the architecture map current and to answer dependency questions quickly while working on the desktop app.

## Recommended Commands

### Refresh the project graph
```bash
graphify update .
```

Use this after meaningful code changes. It refreshes `graphify-out/` without needing an API key or semantic extraction.

### Keep the graph updated during a longer session
```bash
graphify watch .
```

Use this when touching several files in one sitting.

### Rebuild communities/report only
```bash
graphify cluster-only .
```

Useful when the structure changed enough that you want a fresh report, but do not need a full re-extraction.

### Ask architecture questions
```bash
graphify query "What connects the desktop app to Prisma?"
graphify explain "useLoans()"
graphify path "Desktop App - Electron 33" "Backend - Express 5 + Prisma 5"
```

## Repo Routine
1. Make code changes.
2. Run `graphify update .`
3. Review `graphify-out/GRAPH_REPORT.md` if the change touched architecture.
4. Commit updated graph files together with the code change when they add value.

## Files Worth Keeping
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.json`
- `graphify-out/graph.html`
- `graphify-out/manifest.json`
- `graphify-out/.graphify_labels.json`

## Files Ignored
The repo ignores Graphify cache and temporary helper artifacts to keep Git history cleaner.

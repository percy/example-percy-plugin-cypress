## Visual review (Percy)
<!-- percy-hook v2 -->

This repo uses the Percy Visual Testing plugin. When you change UI code:
1. Before/while opening the PR, run `/percy:visual-intent` (it injects the intent section and auto-starts `/percy:watch`).
2. The watcher runs `/percy:gate` automatically when the Percy build finishes — don't merge UI changes before the gate passes.
3. If you skipped intent and a build already exists, run `/percy:gate` directly.
4. If this repo's CI doesn't run Percy, run `/percy:run-build` after pushing — the watcher can't watch a build that never starts.

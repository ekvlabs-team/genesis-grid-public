# Genesis Grid Public Prelaunch Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable Vite/React prelaunch site for Genesis Grid using the Claude design direction without fictional day data.

**Architecture:** The site is a static Vite app. Canonical public content lives in `src/content.js`, React renders prelaunch views from that content, and machine-readable files live under `public/`.

**Tech Stack:** Vite, React, Node test runner, Cloudflare Pages.

---

### Task 1: Content Contract

**Files:**
- Create: `src/content.js`
- Test: `test/content.test.js`

- [x] Write tests that require Day 0, no traces, no archive, and fixed mechanics.
- [x] Run `npm test` and verify failure before `src/content.js` exists.
- [x] Add `src/content.js` with canonical prelaunch content.
- [x] Run `npm test` and verify pass.

### Task 2: React Site

**Files:**
- Create: `src/main.jsx`
- Create: `src/styles.css`
- Create: `index.html`

- [x] Create Vite entrypoint.
- [x] Build a prelaunch home, grid wall, mechanics, Day Pool preview, Oracle requirements, agency goal, protocol links and no-promises disclaimer.
- [x] Run `npm run build`.

### Task 3: Agent-Readable Static Files

**Files:**
- Create: `public/skill.md`
- Create: `public/data/current-day.json`
- Create: `public/data/routes.json`
- Create: `public/data/trial/example.json`

- [x] Add machine-readable prelaunch files.
- [x] Verify build includes the files in `dist`.

### Task 4: Publish

**Files:**
- Modify: `README.md`

- [x] Update README with Cloudflare build settings.
- [x] Commit and push to `main`.

# /pinokio-launcher - Running and developing Rumi inside Pinokio

> **Up:** [.claude/CLAUDE.md](../../CLAUDE.md) (config & skills router) · **The wizard's layout:** [onboarding/CLAUDE.md](../../../onboarding/CLAUDE.md) · **User-facing docs:** [PINOKIO.md](../../../PINOKIO.md)

This fork adds a [Pinokio](https://pinokio.co) launcher at the repository root: a sidebar that installs,
configures and starts Rumi in one click, and a browser wizard that replaces the terminal setup. Everything
else in the repo is Rumi, unchanged.

Use this skill when a task touches the root `*.js` scripts, `onboarding/`, or how Rumi is run under Pinokio.
For the bot itself, go to [digital-coach](../digital-coach/SKILL.md).

## What belongs to the launcher

| Path | Purpose |
|------|---------|
| `pinokio.js` | Builds the sidebar. Pure function of state — what exists, what is running |
| `pinokio.json` | Title, description, icon |
| `install.js` | npm install (root + `bot/`), `.env` from template, local Redis via conda |
| `onboard.js` | Daemon: serves the GUI wizard, captures its URL |
| `start.js` | Daemon: local Redis, then `node bin/rumi.js start`, captures the console URL |
| `setup.js` `pair.js` `doctor.js` | Terminal fallbacks — `rumi setup`/`pair`/`doctor` in an interactive shell |
| `claude.js` | Opens a Claude Code session at the repository root |
| `update.js` `reset.js` | `git pull` + reinstall; clear generated state |
| `onboarding/` | The GUI wizard — see [its router](../../../onboarding/CLAUDE.md) |

Only three files of Rumi's own are modified, which keeps merges from `upstream` cheap: `package.json`
(adds `qrcode`), its lockfile, and `.gitignore`.

## The launcher is at the root, and has to be

Pinokio discovers an app by `pinokio.js` **at the root of the app folder**. A launcher in a subdirectory is
not found. That is why these files sit beside `bot/` and `bin/` rather than in a `pinokio/` folder, and why
the layout differs from a standalone launcher (which keeps the app in `app/` and the launcher above it).

## Rules that are easy to get wrong

1. **Capture URLs by regex, set them with `local.set`.** A daemon script watches its own output for a URL
   and stores it, which is what makes "Open Console" appear in the sidebar:
   ```js
   on: [{ event: "/(http:\\/\\/\\S+\\/console)/", done: true }]
   // then
   { method: "local.set", params: { url: "{{input.event[1]}}" } }
   ```
   `start.js` anchors on `/console` because Rumi's banner prints a bare local URL and a health URL first.
   Never hardcode a host or port in the pattern.
2. **Use `{{port}}`, not a fixed port.** Both daemons take one. The single exception is the bundled Redis on
   6379, because `.env.template` already points `REDIS_URL` there — using anything else would mean patching
   a file the operator owns.
3. **`QUEUE_DRIVER=bullmq` is injected as a shell env var**, not written to `.env`. dotenv never overrides
   an already-set variable, so injection wins; and the template's default of `sqs` would make every queued
   job die with "SQS Queue not configured".
4. **`RUMI_NO_OPEN=1` on start**, or `rumi start` opens a system browser behind Pinokio's back.
5. **Interactive commands need `input: true`.** `rumi setup`, `rumi pair` and `claude` are TTY programs;
   without it they stop at the first prompt forever. Same warning as [setup](../setup/SKILL.md).
6. **`npm ci || npm install`, never bare `npm install`.** Rumi's lockfile carries a stale `version` field
   that `npm install` rewrites, dirtying a checkout you are going to commit from — and making the `git pull`
   in `update.js` refuse to run.
7. **Reset must not delete the checkout.** The repository *is* the launcher here, so `reset.js` clears
   `node_modules`, `.env`, `.channel-state/` and `.setup-state.json` instead.

## Two steps no launcher can automate

- **The `exec_sql` paste.** Supabase exposes no API for arbitrary SQL. The wizard shows the exact SQL,
  copies it, deep-links the operator's own editor and polls `waitForExecSql` — but a human still pastes it.
- **Scanning the QR.** Rumi answers *as* the linked number, so it cannot reply to that same number. A second
  phone is required.

## Developing the launcher

```bash
node onboarding/server.js --port=4180     # the wizard, without Pinokio
node bin/rumi.js doctor                   # what Rumi thinks of the current .env
```

The wizard's client is plain ES modules — edit and reload, no build step. Server-side changes need a
restart. `node --check` covers the CommonJS files; for `onboarding/public/**` copy to `.mjs` first, since
`--check` parses `.js` as CommonJS and rejects `import`.

Worth re-running after any change to the routes:

```bash
# must 404 — a plain lookup here once returned the whole environment
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:4180/api/probe/constructor -H 'X-Rumi-Onboarding: 1'
# must 403 — the header check and the Host allowlist
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:4180/api/env -d '{}'
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: evil.example.com' localhost:4180/api/state
```

## A trap specific to this repo

`.gitignore` carries a `credentials*` rule, there to keep credential files out of the repo. It also matches
`onboarding/routes/credentials.js` and `onboarding/public/steps/credentials.js`, which silently excluded
them — a fresh clone was missing the step that collects API keys. Two negation lines at the end of
`.gitignore` fix it. **If you add a file whose name starts with `credentials`, check `git status` before
assuming it is tracked.**

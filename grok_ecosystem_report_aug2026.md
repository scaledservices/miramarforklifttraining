# xAI Grok Ecosystem — Structured Factual Report (August 2026)

Last updated: August 15, 2026
Sources: docs.x.ai, grok.com, github.com/xai-org, release notes

---

## 1. Consumer & Agent Grok Products

### Consumer Chat App (grok.com)
- **Web app** at grok.com — consumer-facing chat with model selection: Fast (Grok 4.5), Auto, Expert (Grok 4.5 thinks hard), Heavy (Team of Experts · Grok 4.5)
- **iOS app** — listed as available on App Store (UNVERIFIED exact features)
- **Android app** — listed as available on Google Play (UNVERIFIED exact features)
- **macOS app** — no dedicated macOS desktop app found; web app only
- **@grok bot on X** — the `@grok` bot that replies to mentions on X/Twitter, powered by grok-prompts
  - Source: github.com/xai-org/grok-prompts description: "Prompts for our Grok chat assistant and the `@grok` bot on X."
- Source: https://grok.com, https://docs.x.ai/overview

### Grok Build (Coding Agent CLI — comparable to Claude Code / Codex / Hermes)
- **CLI tool** installed via `curl -fsSL https://x.ai/cli/install.sh | bash`
- Runs as `grok` command with TUI (fullscreen, mouse-interactive) or headlessly (`grok -p "prompt" --output-format streaming-json`)
- Supports **custom models** via `~/.grok/config.toml` — can use any OpenAI-compatible endpoint
- Backed by model `grok-build-0.1` (256k context) or `grok-4.5`/`grok-4.6`
- Supports **Agent Client Protocol (ACP)** for integration into other apps
- Open source repo: github.com/xai-org/grok-build (25.3k stars)
- Source: https://docs.x.ai/overview (Grok Build Getting Started), https://github.com/xai-org

### Grok Bot (Durable AI Teammates — announced August 11, 2026)
- "Durable AI teammates that work on a persistent cloud computer, with messaging, approvals, connectors, and routines"
- Released August 11, 2026 per Release Notes
- Distinct product from Grok Build and the consumer Grok chat
- Source: https://docs.x.ai/developers/release-notes (August 11 entry)

### Grok Code Fast (grok-code-fast-1)
- **This is NOT a separate product.** It's a model **alias** for `grok-build-0.1`, confirmed by the public model config JSON on docs.x.ai:
  - `grok-build-0.1` has aliases: `["grok-code-fast-1", "grok-code-fast", "grok-code-fast-1-0825"]`
- 256k context, $1/$2 per 1M tokens (input/output), $2/$4 for long context (≥200k)
- Source: Embedded JSON in https://docs.x.ai/faq/data-and-privacy

### Subscription Tiers

#### X Premium+
- Previously gave access to Grok on X; currently **UNVERIFIED** exact current pricing and inclusion as of August 2026
- Source for historical: help.x.com (site blocked by Cloudflare)

#### SuperGrok
- **UNVERIFIED** exact price as of August 2026. Previously reported at ~$30/month for SuperGrok and ~$100/month for SuperGrok Heavy, but cannot confirm current pricing
- SuperGrok Heavy: **UNVERIFIED** — the consumer app shows "Heavy: Team of Experts · Grok 4.5" mode, suggesting the "Heavy" name refers to a multi-model "team of experts" inference mode rather than a separate subscription tier
- Source: Consumer app at grok.com shows "Heavy" mode using "Team of Experts"

#### Grok for Work / Team / Enterprise
- **Grok Build Enterprise Deployments** page exists in docs: https://docs.x.ai/grok-build/enterprise-deployments (UNVERIFIED content — docs SPA did not load specific subpage)
- API access is pay-as-you-go via API credits (no mention of bundled subscriptions)
- Source: docs.x.ai sidebar shows "Enterprise Deployments" under Grok Build

---

## 2. Agentic Capabilities Table

| Feature | Consumer Grok (grok.com) | Grok Build (CLI) | Grok Bot | API / Platform |
|---|---|---|---|---|
| **Scheduled / recurring tasks (cron-like)** | Not supported | **Yes** — "Background Tasks" feature exists in sidebar | **Yes** — "routines" mentioned in Grok Bot release note | No (API is request-response) |
| **Persistent memory across conversations** | **UNVERIFIED** — consumer app likely has basic history | **Yes** — "Sessions" feature in Grok Build | **Yes** — "durable" teammates | No (stateless API) |
| **Custom skills / instructions / plugins** | Not supported | **Yes** — Skills (SKILL.md), Plugins, Hooks, Marketplace | **UNVERIFIED** | Via Remote MCP Tools |
| **Tool use: web search** | **Yes** | **Yes** | **UNVERIFIED** | **Yes** — web_search tool |
| **Tool use: shell access** | Not supported | **Yes** — "terminal" tool, sandboxed code execution | **UNVERIFIED** | **Yes** — code_execution / code_interpreter |
| **Tool use: file editing on user's machine** | Not supported | **Yes** — Grok Build can edit files in the project directory | **Yes** — persistent cloud computer | No (sandboxed) |
| **Tool use: git operations** | Not supported | **Yes** — implied by TUI coding agent | **UNVERIFIED** | No (sandboxed) |
| **Computer-use / desktop control** | Not supported | **UNVERIFIED** — no "computer use" feature found in docs sidebar | **UNVERIFIED** — persistent cloud computer ≠ desktop control | Not supported |
| **Messaging-platform integration** | Not supported natively | Via ACP / headless scripting | **Yes** — "messaging" mentioned in Grok Bot release | Via API (build your own) |
| **MCP server support** | Not supported | **Yes** — Grok Build has MCP Servers feature; API has Remote MCP Tools | **UNVERIFIED** | **Yes** — Remote MCP Tools via Responses API |
| **API for building agents** | N/A | N/A | N/A | **Yes** — Responses API, Chat Completions API, Batch API, WebSocket mode |
| **Subagents / multi-agent** | **UNVERIFIED** | **Yes** — Subagents feature spawns independent child sessions | **UNVERIFIED** | **Yes** — grok-4.20-multi-agent-0309 model + Multi Agent API |
| **Plan Mode** | Not supported | **Yes** | **UNVERIFIED** | No |
| **Sandboxed code execution** | **UNVERIFIED** (consumer app may have limited code exec) | **Yes** — Sandbox feature + code_execution tool | **UNVERIFIED** | **Yes** — code_execution tool ($5/1k calls) |
| **Hooks (lifecycle events)** | Not supported | **Yes** | **UNVERIFIED** | No |

Sources: docs.x.ai sidebar structure for Grok Build Features, docs.x.ai/tools/overview, docs.x.ai/developers/release-notes

---

## 3. Model Lineup & Pricing (API — as of August 12, 2026)

### Text / Code Models

| Model ID | Context | Aliases | Input/M tok | Cached/M tok | Output/M tok | Long Input/M tok | Long Output/M tok |
|---|---|---|---|---|---|---|---|
| **grok-4.6** | 500k | — | $2.00 | $0.50 | $6.00 | $4.00 | $12.00 |
| **grok-4.5** | 500k | grok-4.5-latest, grok-build-latest | $2.00 | $0.30 | $6.00 | $4.00 | $12.00 |
| **grok-4.3** | 1M | grok-4.3-latest | $1.25 | $0.20 | $2.50 | $2.50 | $5.00 |
| **grok-build-0.1** | 256k | grok-code-fast-1, grok-code-fast, grok-code-fast-1-0825 | $1.00 | $0.20 | $2.00 | $2.00 | $4.00 |
| **grok-4.20-0309-reasoning** | 1M | grok-4.20, grok-4.20-beta, etc. | $1.25 | $0.20 | $2.50 | $2.50 | $5.00 |
| **grok-4.20-0309-non-reasoning** | 1M | grok-4.20-non-reasoning | $1.25 | $0.20 | $2.50 | $2.50 | $5.00 |
| **grok-4.20-multi-agent-0309** | 1M | grok-4.20-multi-agent | $1.25 | $0.20 | $2.50 | $2.50 | $5.00 |

Notes:
- Long context pricing applies when prompt ≥200k tokens
- grok-4.6 supports reasoning effort: low, medium, high (default), xhigh
- grok-4.3 supports reasoning effort: none, low, medium, high, xhigh (default: low)
- Batch API: 20% discount for grok-4.3, grok-4.20 series, grok-build-0.1; no discount for grok-4.5, grok-4.6
- Priority Processing: 2x standard rates

### Image Models

| Model | Cost per image |
|---|---|
| grok-imagine-image | $0.02 (1K/2K) |
| grok-imagine-image-2.0 | $0.04–$0.08 (depends on quality + resolution) |
| grok-imagine-image-quality (pro) | $0.05 (1K), $0.07 (2K) |

### Video Models

| Model | Cost |
|---|---|
| grok-imagine-video | $0.05/s (480p), $0.07/s (720p) |
| grok-imagine-video-1.5 | $0.08/s (480p), $0.14/s (720p), $0.25/s (1080p) |

### Voice Models

| Model/Capability | Cost |
|---|---|
| Speech to Speech (grok-voice-think-fast-2.0) | $0.08/min audio + $0.004/text input |
| Text to Speech | $15.00/1M chars |
| Speech to Text (REST) | $0.10/hr |
| Speech to Text (Streaming) | $0.20/hr |

### Tool Invocation Costs

| Tool | Cost/1k calls |
|---|---|
| Web Search | $5 |
| X Search | $5 |
| Code Execution | $5 |
| File Attachments | $10 |
| Collections Search (RAG) | $2.50 |
| Image Generation | At Imagine API rates |
| Image Understanding | Token-based |
| Remote MCP Tools | Token-based (no invocation fee) |

### Does SuperGrok include API usage?

**UNVERIFIED directly, but implied NO.** The API pricing page only mentions pay-as-you-go credits and API keys — no bundled plans. The API is a separate billing system from the consumer subscription (API credits vs SuperGrok subscription). Source structure on docs.x.ai separates API pricing from consumer subscription info entirely.

---

## 4. Data Portability

### Import from other tools (ChatGPT / Claude / Hermes)
- **No import feature found.** No documented migration path from any third-party tool.
- Grok Build does read Claude Code configs (`CLAUDE.md`, `Claude.md`, `CLAUDE.local.md`, `.claude/rules/`) as well as `AGENTS.md` files — but this is for **config/directives compatibility**, not conversation history import.
- Source: https://docs.x.ai/grok-build/features/skills-plugins ("Claude Code compatibility" section)

### Export of Grok data
- **UNVERIFIED.** No export feature mentioned in docs. The consumer app likely has conversation history but no documented export API.
- Files stored in xAI's Files API can be downloaded (at $0.20/GiB download cost).
- Source: docs.x.ai/pricing (Files and Collections Pricing)

### Migration path
- **No documented migration path.** API migration guides cover model retirement (May 15) and migrating from Chat Completions to Responses API — nothing about migrating user data between platforms.
- Source: docs.x.ai sidebar "Migration Guides" section

---

## 5. "Grok Bot" — Naming Clarification

**"Grok bot" refers to a specific product launched August 11, 2026**, not the general Grok app in agent mode.

Per the official release notes:
> "Grok Bot is now available. Durable AI teammates that work on a persistent cloud computer, with messaging, approvals, connectors, and routines."

Distinct products:
1. **Grok** — consumer chat app (grok.com, iOS, Android, @grok on X)
2. **Grok Build** — coding agent CLI (TUI + headless, comparable to Claude Code / Codex)
3. **Grok Bot** — durable AI teammates on cloud computer (announced Aug 11, 2026)
4. **@grok** — the bot that replies to mentions on X/Twitter (different from Grok Bot)

If the user Peter is referring to "Grok's new Grok bot," they likely mean **Grok Bot** (product 3), the persistent cloud-computer teammate. If they mean "the Grok app with agent mode," they likely mean **Grok Build** (product 2) or the consumer **Grok** app (product 1).

---

## 6. What Grok Cannot Do That Hermes Does

| Hermes Capability | Grok Equivalent | Status |
|---|---|---|
| **Persistent file-based skills (SKILL.md)** | Grok Build Skills (SKILL.md with YAML frontmatter) | ✅ Supported in Grok Build only |
| **Cron / scheduled recurring tasks** | Grok Build Background Tasks; Grok Bot routines | ✅ Supported (but UNVERIFIED exact cron syntax) |
| **Persistent cross-session memory** | Grok Build Sessions; Grok Bot persistent cloud computer | ✅ Partial (Grok Build sessions are per-session; Grok Bot is "durable") |
| **Computer-use / desktop control (click, type, scroll)** | **Not supported** in any Grok product | ❌ **Unsupported** |
| **Telegram/Discord/WhatsApp/iMessage gateway** | Grok Bot has "messaging" (UNVERIFIED which platforms) | ❓ UNVERIFIED which platforms |
| **Multi-model routing via OpenRouter** | Grok Build supports custom models via config.toml (any OpenAI-compatible endpoint) | ✅ Partial (bring your own key, not a router) |
| **Subagent delegation** | Grok Build Subagents feature | ✅ Supported |
| **Open source / self-hostable** | **Grok Build is open source** (MIT? — UNVERIFIED license); Grok models are API-only | ✅ Partial |
| **Data import from ChatGPT/Claude/Hermes** | **Not supported** | ❌ **Unsupported** |
| **Export of all conversation history** | **UNVERIFIED** — no export feature documented | ❓ UNVERIFIED |
| **macOS desktop app** | **No macOS desktop app** — web app only | ❌ Unsupported |
| **Local-first architecture** | **API-dependent** (Grok Build uses API for inference; skills/hooks are local) | ❌ Partial (not truly local-first) |
| **MCP server client** | Grok Build MCP Servers feature; API Remote MCP Tools | ✅ Supported |
| **Plugin system** | Grok Build Plugins (skills, agents, hooks, MCP, LSP) | ✅ Supported |
| **OpenAI / Claude API compatibility** | Grok Build supports any model via config.toml | ✅ Supported |
| **Free tier** | Consumer Grok is free (with limits); API is pay-as-you-go | ✅ Partial |

Legend: ✅ = explicitly supported and documented | ❌ = explicitly not supported or absent from docs | ❓ = UNVERIFIED

---

## Key Sources Referenced

1. https://docs.x.ai/overview — API docs overview, model info, Grok Build intro
2. https://docs.x.ai/developers/models — full model list with pricing
3. https://docs.x.ai/developers/pricing — API pricing page (token rates, tool costs, batch, priority)
4. https://docs.x.ai/developers/release-notes — Grok 4.6 (Aug 12), Grok Bot (Aug 11), Grok 4.5 (Jul 8)
5. https://docs.x.ai/grok-build — Grok Build Getting Started (CLI install, TUI, headless, custom models)
6. https://docs.x.ai/grok-build/features/skills-plugins — Skills, Plugins, Hooks, Marketplaces, Subagents, Claude Code compat
7. https://grok.com — Consumer chat app (model modes: Fast/Auto/Expert/Heavy)
8. https://github.com/xai-org — grok-build (25.3k★), grok-prompts (4.3k★), xai-sdk-python
9. Embedded JSON in docs.x.ai page source — model configs including grok-build-0.1 aliases

**Items that could not be independently verified due to Cloudflare blocks:**
- x.ai (x.ai/news, x.ai/about) — all blocked by Cloudflare
- help.x.com — blocked by Cloudflare
- Exact SuperGrok / X Premium+ pricing as of August 2026
- App Store / Google Play listing details
- Grok Bot detailed capabilities (page not navigable in SPA)
- Grok Build Enterprise Deployments content
- Background Tasks detailed documentation
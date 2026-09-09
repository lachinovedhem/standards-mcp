# standards-mcp

> An **MCP server** that serves a portable, brand-neutral **engineering standards** library, so any
> AI agent (Claude Code, Cursor, …) queries the rules over MCP — searching and applying them from a
> current, authoritative source instead of reading files or answering from memory. **Keyless. Offline. MIT.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-1.x-blue)](https://modelcontextprotocol.io)

## Why

Standards only help if they're actually applied. Bundling them into an MCP server turns "read the
docs" into a tool call: the agent searches the rules relevant to the task and applies them — the same
pattern the [AG Grid MCP](https://github.com/ag-grid/ag-mcp) uses for its own docs.

## What's inside (15 standards)

`00-index`, `01-golden-rules`, `02-architecture` (.NET AOT + Dapper.AOT, Clean Architecture, gRPC,
streaming, caching, resilience), `03-security`, `04-api-i18n-privacy`, `05-devops-test-observability`,
`06-optional-sso-audit`, `07-ui-ux` (AG Grid vs tile card, design tokens, PWA), `08-grpc`,
`09-compression-caching`, `10-validation-errors`, `11-configuration-options`, `12-background-messaging`,
`13-mcp-tools`, `14-design-skills` (taste-skill build step, mandatory web-design-guidelines review
gate, ~67 installable style skills). All brand-neutral; identity (hosts, keys, colors, fonts) is
config, never hardcoded.

## Tools

| Tool | Purpose |
|------|---------|
| `list_standards` | List every standard (id, title, headings) — start here |
| `search_standards` | Natural-language search → the most relevant rule sections (heading + snippet) |
| `get_standard` | Fetch a full standard by id (`02`), slug (`02-architecture`), or name (`architecture`) |
| `get_checklist` | The compliance checklist(s) — a Definition-of-Done gate |

## Install

```bash
# Claude Code
claude mcp add standards npx -y standards-mcp
```

Or in `~/.claude.json` / Cursor `mcp.json`:

```json
{
  "mcpServers": {
    "standards": { "command": "npx", "args": ["-y", "standards-mcp"] }
  }
}
```

## Build from source

```bash
npm install
npm run build
node smoke.mjs      # spawns the server, lists/searches/fetches — 6/6
node dist/index.js  # speaks MCP over stdio
```

## Usage (ask your agent)

- *"What are the Dapper.AOT rules for Oracle?"* → `search_standards` → `02-architecture` (RETURNING INTO → raw OracleCommand)
- *"Is response compression safe over HTTPS?"* → `09-compression-caching` (CRIME/BREACH)
- *"Give me the gRPC checklist."* → `get_checklist("08")`
- *"Show the security standard."* → `get_standard("security")`

## Keeping standards in sync

The `standards/` folder is bundled so the package is self-contained. It's a copy of the source
standards library — re-copy and rebuild when the source changes:

```bash
cp /path/to/standards/*.md standards/ && npm run build
```

## License

[MIT](LICENSE).

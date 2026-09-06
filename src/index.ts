#!/usr/bin/env node
/**
 * standards-mcp — serves a portable engineering standards library over MCP.
 *
 * Instead of an agent reading standards files (or answering from memory), it queries these
 * tools so the rules are always applied from a current, authoritative source. Keyless, offline.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadStandards, findFile, searchSections } from "./standards.js";

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "standards-mcp", version: "0.1.0" });

  server.registerTool(
    "list_standards",
    {
      title: "List standards",
      description:
        "List every engineering standard in the library (id, title, and its section headings). " +
        "Start here to see what rules exist before searching or fetching.",
      inputSchema: {},
    },
    async () => {
      const files = loadStandards().filter((f) => f.id !== "00");
      const lines = files.map(
        (f) => `- **${f.id}** \`${f.slug}\` — ${f.title.replace(/^\d+\s*—\s*/, "")}`,
      );
      return text(`# Engineering standards (${files.length})\n\n${lines.join("\n")}`);
    },
  );

  server.registerTool(
    "search_standards",
    {
      title: "Search standards",
      description:
        "Search the standards library with natural language and return the most relevant rule " +
        "sections (which standard, which heading, and a snippet). Use this before answering any " +
        "question about architecture, security, API, gRPC, compression, validation, options, " +
        "messaging, UI/UX, or MCP policy — apply the rules found here rather than from memory.",
      inputSchema: {
        query: z.string().min(2).describe("What you want the rules for, e.g. 'dapper aot oracle' or 'response compression breach'"),
        limit: z.number().int().min(1).max(20).default(6).describe("Max sections to return"),
      },
    },
    async ({ query, limit }) => {
      const hits = searchSections(query, limit);
      if (hits.length === 0) return text(`No standard section matched "${query}". Try \`list_standards\` or broader terms.`);
      const blocks = hits.map(
        (h) => `## [${h.fileId}] ${h.heading}  \n_source: ${h.slug}.md · score ${h.score}_\n\n${h.snippet}`,
      );
      return text(`# Matches for "${query}"\n\n${blocks.join("\n\n---\n\n")}\n\n> Fetch the full rule with \`get_standard\` (id "${hits[0].fileId}").`);
    },
  );

  server.registerTool(
    "get_standard",
    {
      title: "Get standard",
      description:
        "Return a full engineering standard by id (e.g. '02'), slug ('02-architecture'), or name " +
        "('architecture'). Use after search to read the complete rules and checklist.",
      inputSchema: {
        id: z.string().min(1).describe("Standard id, slug, or name — e.g. '03', '03-security', or 'security'"),
      },
    },
    async ({ id }) => {
      const file = findFile(id);
      if (!file) {
        const ids = loadStandards().map((s) => s.id).join(", ");
        return text(`No standard "${id}". Available ids: ${ids}. Use \`list_standards\`.`);
      }
      return text(file.content);
    },
  );

  server.registerTool(
    "get_checklist",
    {
      title: "Get checklist",
      description:
        "Return the compliance checklist(s). Pass a standard id/name for one, or omit for every " +
        "checklist across the library — use it as a Definition-of-Done gate before shipping.",
      inputSchema: {
        id: z.string().optional().describe("Optional standard id/name; omit for all checklists"),
      },
    },
    async ({ id }) => {
      const files = id ? [findFile(id)].filter(Boolean) : loadStandards();
      if (files.length === 0) return text(`No standard "${id}".`);
      const out: string[] = [];
      for (const f of files as NonNullable<ReturnType<typeof findFile>>[]) {
        for (const sec of f.sections) {
          if (/yoxlama siyah|checklist/i.test(sec.heading) || sec.content.includes("- [ ]")) {
            out.push(`## [${f.id}] ${f.title.replace(/^\d+\s*—\s*/, "")} — ${sec.heading}\n\n${sec.content}`);
          }
        }
      }
      return text(out.length ? out.join("\n\n---\n\n") : "No checklist sections found.");
    },
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  process.stderr.write(`standards-mcp running on stdio (${loadStandards().length} standards loaded)\n`);
}

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("index.js");
if (isMain) {
  main().catch((err) => {
    process.stderr.write(`fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  });
}

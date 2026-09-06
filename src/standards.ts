/**
 * Loads the bundled standards markdown files and indexes them by section so tools can
 * list, search, and fetch rules. Pure, offline, no dependencies beyond the filesystem.
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const STANDARDS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "standards");

export interface StandardFile {
  /** Numeric id from the filename, e.g. "02" (index file is "00"). */
  id: string;
  /** Filename without extension, e.g. "02-architecture". */
  slug: string;
  /** H1 title. */
  title: string;
  /** Full markdown content. */
  content: string;
  sections: Section[];
}

export interface Section {
  fileId: string;
  slug: string;
  /** Heading text (## or ###), or the file title for the preamble. */
  heading: string;
  level: number;
  content: string;
}

function splitSections(fileId: string, slug: string, title: string, md: string): Section[] {
  const lines = md.split("\n");
  const sections: Section[] = [];
  let heading = title;
  let level = 1;
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) sections.push({ fileId, slug, heading, level, content: text });
    buf = [];
  };
  for (const line of lines) {
    const m = /^(#{2,4})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      level = m[1].length;
      heading = m[2].replace(/[#*`]/g, "").trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

let cache: StandardFile[] | null = null;

export function loadStandards(): StandardFile[] {
  if (cache) return cache;
  const files = readdirSync(STANDARDS_DIR).filter((f) => f.endsWith(".md")).sort();
  cache = files.map((f) => {
    const content = readFileSync(join(STANDARDS_DIR, f), "utf8");
    const slug = f.replace(/\.md$/, "");
    const id = /^(\d+)/.exec(slug)?.[1] ?? slug;
    const titleMatch = /^#\s+(.*)$/m.exec(content);
    const title = titleMatch ? titleMatch[1].trim() : slug;
    return { id, slug, title, content, sections: splitSections(id, slug, title, content) };
  });
  return cache;
}

/** Find a file by numeric id ("02"), slug ("02-architecture"), or partial name ("architecture"). */
export function findFile(idOrName: string): StandardFile | undefined {
  const all = loadStandards();
  const q = idOrName.toLowerCase().trim();
  return (
    all.find((s) => s.id === q) ??
    all.find((s) => s.slug.toLowerCase() === q) ??
    all.find((s) => s.slug.toLowerCase().includes(q)) ??
    all.find((s) => s.title.toLowerCase().includes(q))
  );
}

export interface SearchHit {
  fileId: string;
  slug: string;
  heading: string;
  score: number;
  snippet: string;
}

/** Rank sections across all standards by query term frequency (heading weighted higher). */
export function searchSections(query: string, limit: number): SearchHit[] {
  const terms = query.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];
  if (terms.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const file of loadStandards()) {
    for (const sec of file.sections) {
      const headLc = sec.heading.toLowerCase();
      const bodyLc = sec.content.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (headLc.includes(t)) score += 5;
        const occ = bodyLc.split(t).length - 1;
        score += Math.min(occ, 8);
      }
      if (score > 0) {
        // snippet around the first matched term
        let idx = -1;
        for (const t of terms) {
          const i = bodyLc.indexOf(t);
          if (i >= 0 && (idx < 0 || i < idx)) idx = i;
        }
        const start = Math.max(0, idx - 120);
        const snippet = (start > 0 ? "…" : "") + sec.content.slice(start, start + 360).trim() + "…";
        hits.push({ fileId: file.id, slug: file.slug, heading: sec.heading, score, snippet });
      }
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

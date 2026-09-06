/** Smoke test: spawn the server over stdio, list/search/get standards. */
import { spawn } from "node:child_process";

const p = spawn(process.execPath, ["dist/index.js"], { stdio: ["pipe", "pipe", "ignore"] });
let buf = "";
const pend = new Map();
let id = 0;
p.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const l = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!l) continue;
    const m = JSON.parse(l);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  }
});
const rpc = (method, params) => new Promise((r) => { const my = ++id; pend.set(my, r); p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: my, method, params }) + "\n"); });
const call = async (n, a) => (await rpc("tools/call", { name: n, arguments: a })).result?.content?.[0]?.text ?? "";

const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };

await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "0" } });
p.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n");

const list = await rpc("tools/list", {});
const names = (list.result?.tools ?? []).map((t) => t.name).sort();
check("4 tools", names.length === 4, names.join(","));

const listed = await call("list_standards", {});
check("list_standards has 13", (listed.match(/^- \*\*\d/gm) ?? []).length === 13, `${(listed.match(/^- \*\*\d/gm) ?? []).length}`);

const s1 = await call("search_standards", { query: "dapper aot oracle returning", limit: 4 });
check("search finds architecture", s1.includes("02") && /RETURNING|Dapper/i.test(s1));

const s2 = await call("search_standards", { query: "response compression breach", limit: 4 });
check("search finds compression", s2.includes("09") || /BREACH/i.test(s2));

const g = await call("get_standard", { id: "security" });
check("get_standard by name", g.includes("# 03 — Təhlükəsizlik"));

const cl = await call("get_checklist", { id: "08" });
check("checklist for grpc", cl.includes("[ ]") && /gRPC|proto/i.test(cl));

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} passed`);
p.kill();
process.exit(passed === results.length ? 0 : 1);

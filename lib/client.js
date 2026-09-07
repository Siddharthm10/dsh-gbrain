window.__ModuleLoader__.load({
  id: "dsh-gbrain",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_react = __toESM(require("react"), 1);
var NS = "gbrain";
var COPY = {
  en: {
    title: "GBrian",
    subtitle: "gbrain control panel",
    refresh: "Refresh",
    refreshing: "Refreshing\u2026",
    loading: "Loading\u2026",
    loadError: "Settings unavailable: {detail}",
    // status card
    health: "Brain health",
    healthScore: "score",
    doctorStatus: "doctor",
    checksWarn: "warn",
    checksOk: "ok",
    sources: "Sources",
    srcName: "source",
    srcPages: "pages",
    srcChunks: "chunks",
    srcEmbed: "embedded",
    srcSync: "last sync",
    srcLag: "lag",
    never: "never",
    embedJob: "Embed job",
    jobIdle: "not running",
    jobRunning: "running",
    jobStop: "Stop",
    jobStarted: "started {time}",
    jobLog: "log (last lines)",
    embedServer: "Embed server",
    unreachable: "unreachable",
    reachable: "reachable",
    models: "models",
    configuredModel: "configured model",
    modelListed: "listed",
    modelMissing: "NOT listed",
    dimsCheck: "dimension probe",
    dimsMatch: "match",
    dimsMismatch: "MISMATCH",
    dimsExpected: "expected",
    noData: "no data",
    // search card
    search: "Search QC",
    searchHint: "Manual retrieval for quality checking \u2014 the raw CLI output, exactly as an agent sees it.",
    searchPh: "e.g. what did I note about the Qwen embedding setup",
    mode: "mode",
    run: "Run",
    running: "Running\u2026",
    emptyQuery: "Type a query first.",
    // model card
    model: "Embedding model",
    modelHint: "Any provider:model the brain accepts (llama-server:qwen3-embed, voyage:voyage-4, \u2026). Apply writes it into the brain and probes the server.",
    modelField: "provider:model",
    dimsField: "dimensions",
    dimsLocked: "locked (existing brain \u2014 a dims change means wipe + re-init)",
    urlField: "server base URL",
    keyField: "server API key",
    applyVerify: "Apply & verify",
    applying: "Applying\u2026",
    applyOk: "Applied and verified.",
    applyFail: "Applied with problems \u2014 see detail.",
    applyDimsFail: "Dimension mismatch \u2014 data will NOT be written; fix the model or the dimensions.",
    // ops card
    ops: "Embed operations",
    embedNow: "Embed stale now",
    starting: "Starting\u2026",
    started: "started (pid {pid})",
    alreadyRunning: "already running (pid {pid})",
    startFail: "start failed",
    device: "embed container device",
    cpu: "CPU (safe for the LLM)",
    gpu: "GPU (fast, needs VRAM)",
    recreate: "Recreate container",
    recreating: "Recreating\u2026",
    recreateOk: "container recreated ({device}).",
    recreateFail: "recreate failed \u2014 see detail.",
    // connection card
    connection: "Connection",
    connHint: "Where the brain lives and how the CLI is reached. Leave gbrainHome empty to use $GBRAIN_HOME / ~/.gbrain.",
    homeField: "brain home (GBRAIN_HOME)",
    bunField: "bun binary",
    gbrainField: "gbrain binary (empty = auto)",
    hostDirField: "model host dir",
    containerField: "container name",
    imageField: "container image",
    modelPathField: "model path (in container)",
    portField: "host port",
    save: "Save",
    saving: "Saving\u2026",
    saved: "Saved",
    conflict: "Settings changed elsewhere \u2014 reloaded, please retry.",
    notFound: "This section is not registered (server half missing?).",
    detail: "detail",
    rawOutput: "output",
    secondsAgo: "{n}s"
  },
  zh: {
    title: "GBrian",
    subtitle: "gbrain \u63A7\u5236\u9762\u677F",
    refresh: "\u5237\u65B0",
    refreshing: "\u5237\u65B0\u4E2D\u2026",
    loading: "\u52A0\u8F7D\u4E2D\u2026",
    loadError: "\u8BBE\u7F6E\u4E0D\u53EF\u7528\uFF1A{detail}",
    health: "\u5927\u8111\u5065\u5EB7",
    healthScore: "\u8BC4\u5206",
    doctorStatus: "doctor",
    checksWarn: "\u8B66\u544A",
    checksOk: "\u6B63\u5E38",
    sources: "\u6570\u636E\u6E90",
    srcName: "\u6570\u636E\u6E90",
    srcPages: "\u9875\u9762",
    srcChunks: "\u5206\u5757",
    srcEmbed: "\u5DF2\u5D4C\u5165",
    srcSync: "\u4E0A\u6B21\u540C\u6B65",
    srcLag: "\u5EF6\u8FDF",
    never: "\u4ECE\u672A",
    embedJob: "\u5D4C\u5165\u4EFB\u52A1",
    jobIdle: "\u672A\u5728\u8FD0\u884C",
    jobRunning: "\u8FD0\u884C\u4E2D",
    jobStop: "\u505C\u6B62",
    jobStarted: "\u542F\u52A8\u4E8E {time}",
    jobLog: "\u65E5\u5FD7\uFF08\u6700\u540E\u51E0\u884C\uFF09",
    embedServer: "\u5D4C\u5165\u670D\u52A1\u5668",
    unreachable: "\u4E0D\u53EF\u8FBE",
    reachable: "\u53EF\u8FBE",
    models: "\u6A21\u578B",
    configuredModel: "\u914D\u7F6E\u7684\u6A21\u578B",
    modelListed: "\u5DF2\u5217\u51FA",
    modelMissing: "\u672A\u5217\u51FA",
    dimsCheck: "\u7EF4\u5EA6\u63A2\u6D4B",
    dimsMatch: "\u4E00\u81F4",
    dimsMismatch: "\u4E0D\u4E00\u81F4",
    dimsExpected: "\u671F\u671B",
    noData: "\u65E0\u6570\u636E",
    search: "\u68C0\u7D22\u8D28\u68C0",
    searchHint: "\u624B\u52A8\u68C0\u7D22\uFF0C\u7528\u4E8E\u8D28\u68C0\u2014\u2014\u539F\u59CB CLI \u8F93\u51FA\uFF0C\u548C agent \u770B\u5230\u7684\u4E00\u6837\u3002",
    searchPh: "\u4F8B\u5982\uFF1A\u6211\u5173\u4E8E Qwen \u5D4C\u5165\u914D\u7F6E\u8BB0\u4E86\u4EC0\u4E48",
    mode: "\u6A21\u5F0F",
    run: "\u8FD0\u884C",
    running: "\u8FD0\u884C\u4E2D\u2026",
    emptyQuery: "\u5148\u8F93\u5165\u67E5\u8BE2\u3002",
    model: "\u5D4C\u5165\u6A21\u578B",
    modelHint: "\u4EFB\u4F55\u5927\u8111\u63A5\u53D7\u7684 provider:model\uFF08llama-server:qwen3-embed\u3001voyage:voyage-4 \u7B49\uFF09\u3002\u5E94\u7528\u4F1A\u5199\u5165\u5927\u8111\u5E76\u63A2\u6D4B\u670D\u52A1\u5668\u3002",
    modelField: "provider:model",
    dimsField: "\u7EF4\u5EA6",
    dimsLocked: "\u5DF2\u9501\u5B9A\uFF08\u5DF2\u6709\u5927\u8111\u2014\u2014\u6539\u7EF4\u5EA6\u610F\u5473\u7740\u6E05\u7A7A\u91CD\u5EFA\uFF09",
    urlField: "\u670D\u52A1\u5668 base URL",
    keyField: "\u670D\u52A1\u5668 API \u5BC6\u94A5",
    applyVerify: "\u5E94\u7528\u5E76\u9A8C\u8BC1",
    applying: "\u5E94\u7528\u4E2D\u2026",
    applyOk: "\u5DF2\u5E94\u7528\u5E76\u9A8C\u8BC1\u3002",
    applyFail: "\u5E94\u7528\u6709\u95EE\u9898\u2014\u2014\u89C1\u8BE6\u60C5\u3002",
    applyDimsFail: "\u7EF4\u5EA6\u4E0D\u4E00\u81F4\u2014\u2014\u4E0D\u4F1A\u5199\u5165\u6570\u636E\uFF1B\u8BF7\u4FEE\u6B63\u6A21\u578B\u6216\u7EF4\u5EA6\u3002",
    ops: "\u5D4C\u5165\u64CD\u4F5C",
    embedNow: "\u7ACB\u5373\u5D4C\u5165\u8FC7\u671F\u5185\u5BB9",
    starting: "\u542F\u52A8\u4E2D\u2026",
    started: "\u5DF2\u542F\u52A8\uFF08pid {pid}\uFF09",
    alreadyRunning: "\u5DF2\u5728\u8FD0\u884C\uFF08pid {pid}\uFF09",
    startFail: "\u542F\u52A8\u5931\u8D25",
    device: "\u5D4C\u5165\u5BB9\u5668\u8BBE\u5907",
    cpu: "CPU\uFF08\u4E0D\u5360 LLM\uFF09",
    gpu: "GPU\uFF08\u5FEB\uFF0C\u9700\u663E\u5B58\uFF09",
    recreate: "\u91CD\u5EFA\u5BB9\u5668",
    recreating: "\u91CD\u5EFA\u4E2D\u2026",
    recreateOk: "\u5BB9\u5668\u5DF2\u91CD\u5EFA\uFF08{device}\uFF09\u3002",
    recreateFail: "\u91CD\u5EFA\u5931\u8D25\u2014\u2014\u89C1\u8BE6\u60C5\u3002",
    connection: "\u8FDE\u63A5",
    connHint: "\u5927\u8111\u4F4D\u7F6E\u548C CLI \u8C03\u7528\u65B9\u5F0F\u3002gbrainHome \u7559\u7A7A\u5219\u7528 $GBRAIN_HOME / ~/.gbrain\u3002",
    homeField: "\u5927\u8111\u76EE\u5F55\uFF08GBRAIN_HOME\uFF09",
    bunField: "bun \u53EF\u6267\u884C\u6587\u4EF6",
    gbrainField: "gbrain \u53EF\u6267\u884C\u6587\u4EF6\uFF08\u7A7A=\u81EA\u52A8\uFF09",
    hostDirField: "\u6A21\u578B\u4E3B\u673A\u76EE\u5F55",
    containerField: "\u5BB9\u5668\u540D",
    imageField: "\u5BB9\u5668\u955C\u50CF",
    modelPathField: "\u6A21\u578B\u8DEF\u5F84\uFF08\u5BB9\u5668\u5185\uFF09",
    portField: "\u4E3B\u673A\u7AEF\u53E3",
    save: "\u4FDD\u5B58",
    saving: "\u4FDD\u5B58\u4E2D\u2026",
    saved: "\u5DF2\u4FDD\u5B58",
    conflict: "\u8BBE\u7F6E\u5728\u4ED6\u5904\u88AB\u4FEE\u6539\u2014\u2014\u5DF2\u91CD\u65B0\u52A0\u8F7D\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    notFound: "\u8BE5\u5206\u533A\u672A\u6CE8\u518C\uFF08\u7F3A\u5C11\u670D\u52A1\u7AEF\uFF1F\uFF09\u3002",
    detail: "\u8BE6\u60C5",
    rawOutput: "\u8F93\u51FA",
    secondsAgo: "{n}\u79D2"
  }
};
var ROOT_STYLE = { padding: "8px 4px", fontFamily: "inherit", maxWidth: 860 };
var CARD_STYLE = { border: "1px solid rgba(127,127,127,0.25)", borderRadius: 8, padding: 12, marginBottom: 12 };
var TITLE_STYLE = { fontSize: 13, fontWeight: 600, marginBottom: 8 };
var HINT_STYLE = { fontSize: 11, opacity: 0.6, marginTop: 4, marginBottom: 8, lineHeight: 1.45 };
var INPUT_STYLE = { width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(127,127,127,0.35)", background: "transparent", color: "inherit", fontFamily: "inherit" };
var SMALL_INPUT_STYLE = { ...INPUT_STYLE, width: "auto", minWidth: 90 };
var BUTTON_STYLE = { padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(127,127,127,0.4)", background: "transparent", color: "inherit", cursor: "pointer", fontFamily: "inherit" };
var PRE_STYLE = { fontSize: 11, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 260, overflowY: "auto", padding: 8, borderRadius: 6, background: "rgba(127,127,127,0.08)", border: "1px solid rgba(127,127,127,0.2)" };
var BADGE_STYLE = (on) => ({ display: "inline-block", padding: "1px 8px", borderRadius: 999, fontSize: 11, border: `1px solid ${on ? "rgba(80,200,120,0.7)" : "rgba(220,90,90,0.7)"}`, color: on ? "rgba(120,230,160,0.95)" : "rgba(240,130,130,0.95)" });
var TH_STYLE = { fontSize: 11, opacity: 0.6, textAlign: "left", padding: "2px 8px 2px 0" };
var TD_STYLE = { fontSize: 12, padding: "2px 8px 2px 0", verticalAlign: "top" };
var FIELD_LABEL = { fontSize: 11, opacity: 0.7, marginBottom: 2, display: "block" };
function api(path) {
  return new URL(path.replace(/^\/+/, ""), document.baseURI).pathname;
}
async function getJson(path) {
  const res = await fetch(api(path), { cache: "no-store" });
  let body;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { status: res.status, body };
}
async function postJson(path, payload) {
  const res = await fetch(api(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {})
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { status: res.status, body };
}
function Field({ label, children, hint }) {
  return import_react.default.createElement(
    "div",
    null,
    label ? import_react.default.createElement("label", { style: FIELD_LABEL }, label) : null,
    children,
    hint ? import_react.default.createElement("div", { style: HINT_STYLE }, hint) : null
  );
}
function Row({ children }) {
  return import_react.default.createElement(
    "div",
    { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 } },
    ...import_react.default.Children.map(children, (child) => import_react.default.createElement("div", { style: { flex: "1 1 240px", minWidth: 220 } }, child))
  );
}
function Card({ title, right, children }) {
  return import_react.default.createElement(
    "div",
    { style: CARD_STYLE },
    import_react.default.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 } },
      import_react.default.createElement("div", { style: { ...TITLE_STYLE, marginBottom: 0 } }, title),
      right || null
    ),
    children
  );
}
async function loadLive() {
  const [status, probe] = await Promise.all([getJson("/dsh-gbrain/status"), getJson("/dsh-gbrain/probe")]);
  return { status, probe };
}
function parseDoctor(statusBody) {
  const raw = statusBody?.doctor?.stdout;
  if (!raw || statusBody.doctor.exitCode !== 0) return null;
  try {
    const doc = JSON.parse(raw);
    return {
      status: doc.status ?? null,
      healthScore: doc.health_score ?? null,
      warnCount: Array.isArray(doc.checks) ? doc.checks.filter((c) => c.status === "warn").length : null,
      failCount: Array.isArray(doc.checks) ? doc.checks.filter((c) => c.status === "fail").length : null,
      warnChecks: Array.isArray(doc.checks) ? doc.checks.filter((c) => c.status === "warn").slice(0, 8) : [],
      total: Array.isArray(doc.checks) ? doc.checks.length : null
    };
  } catch {
    return null;
  }
}
function parseSources(statusBody) {
  const raw = statusBody?.sources?.stdout;
  if (!raw || statusBody.sources.exitCode !== 0) return null;
  try {
    const doc = JSON.parse(raw);
    return Array.isArray(doc.sources) ? doc.sources : null;
  } catch {
    return null;
  }
}
function GbrainSectionEntry({ useLocale, load, save }) {
  const locale = useLocale((snapshot) => snapshot?.active === "zh" ? "zh" : "en");
  const t = COPY[locale] ?? COPY.en;
  const fmt = (key, vars) => String(t[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] !== void 0 ? String(vars[k]) : m);
  const [state, setState] = import_react.default.useState({ status: "loading", error: null, view: null, draft: null, busy: false, saved: false });
  const [live, setLive] = import_react.default.useState(null);
  const [refreshing, setRefreshing] = import_react.default.useState(false);
  const [searchUi, setSearchUi] = import_react.default.useState({ query: "", mode: "search", limit: 10, busy: false, output: "", code: null, error: null });
  const [job, setJob] = import_react.default.useState(null);
  const [applyMsg, setApplyMsg] = import_react.default.useState(null);
  const [opsMsg, setOpsMsg] = import_react.default.useState(null);
  const setDraft = (patch) => setState((s) => ({ ...s, draft: s.draft === null ? s.draft : { ...s.draft, ...patch }, saved: false }));
  import_react.default.useEffect(() => {
    let cancelled = false;
    load().then((result) => {
      if (cancelled) return;
      if (result.ok) setState({ status: "ready", error: null, view: result.value, draft: { ...result.value.value }, busy: false, saved: false });
      else setState({ status: "error", error: result.error === "ns-missing" ? t.notFound : t.loadError.replace("{detail}", String(result.error ?? "")), view: null, draft: null, busy: false, saved: false });
    }).catch((error) => {
      if (!cancelled) setState({ status: "error", error: t.loadError.replace("{detail}", error instanceof Error ? error.message : String(error)), view: null, draft: null, busy: false, saved: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const refresh = import_react.default.useCallback(async () => {
    setRefreshing(true);
    try {
      const [next, jobNext] = await Promise.all([loadLive(), getJson("/dsh-gbrain/embed/status")]);
      setLive(next);
      setJob(jobNext.body);
    } catch {
    }
    setRefreshing(false);
  }, []);
  import_react.default.useEffect(() => {
    refresh();
  }, [refresh]);
  import_react.default.useEffect(() => {
    if (!job?.running) return void 0;
    const timer = setInterval(async () => {
      try {
        const res = await getJson("/dsh-gbrain/embed/status");
        setJob(res.body);
        if (!res.body?.running) {
          setJob(res.body);
          refresh();
        }
      } catch {
      }
    }, 5e3);
    return () => clearInterval(timer);
  }, [job?.running, refresh]);
  const doSave = async () => {
    const { view: view2, draft: draft2 } = state;
    if (view2 === null || draft2 === null) return;
    setState((s) => ({ ...s, busy: true }));
    try {
      const result = await save(view2, draft2);
      if (result.ok) {
        setState((s) => ({ ...s, busy: false, saved: true, view: result.value, draft: { ...result.value.value } }));
      } else {
        const fresh = await load();
        if (fresh.ok) setState({ status: "ready", error: t.conflict, view: fresh.value, draft: { ...fresh.value.value }, busy: false, saved: false });
        else setState((s) => ({ ...s, busy: false, error: String(result.error ?? result.code ?? "save failed") }));
      }
    } catch (error) {
      setState((s) => ({ ...s, busy: false, error: String(error?.message ?? error) }));
    }
  };
  const doSearch = async () => {
    const query = searchUi.query.trim();
    if (query === "") {
      setSearchUi((s) => ({ ...s, error: t.emptyQuery }));
      return;
    }
    setSearchUi((s) => ({ ...s, busy: true, error: null }));
    try {
      const res = await postJson("/dsh-gbrain/search", { query, mode: searchUi.mode, limit: Number(searchUi.limit) || 10 });
      const out = res.body?.stderr ? `exit ${res.body.exitCode}
${res.body.stderr}
--- stdout ---
${res.body.stdout ?? ""}` : res.body?.stdout ?? "";
      setSearchUi((s) => ({ ...s, busy: false, output: out, code: res.body?.exitCode ?? res.status }));
    } catch (error) {
      setSearchUi((s) => ({ ...s, busy: false, error: String(error?.message ?? error) }));
    }
  };
  const doApply = async () => {
    const draft2 = state.draft;
    if (draft2 === null) return;
    setApplyMsg(null);
    setState((s) => ({ ...s, busy: true }));
    try {
      const res = await postJson("/dsh-gbrain/config/apply", {
        embeddingModel: draft2.embeddingModel,
        embeddingDimensions: Number(draft2.embeddingDimensions),
        embedServerBaseURL: draft2.embedServerBaseURL,
        embedServerAPIKey: draft2.embedServerAPIKey
      });
      const body = res.body ?? {};
      let msg;
      if (body.ok === true) msg = t.applyOk;
      else if (body.dims && body.dims.match === false) msg = t.applyDimsFail;
      else msg = t.applyFail;
      const detailParts = [];
      for (const entry of body.failed ?? []) detailParts.push(`[exit ${entry.exitCode}] ${entry.stderr}`);
      if (body.dims && body.dims.match === false) detailParts.push(`dims ${body.dims.dims} != expected ${body.dims.expected}`);
      if (body.models && body.models.reachable && body.models.modelListed === false) detailParts.push(`${body.configuredModel} ${t.modelMissing}`);
      setApplyMsg({ ok: body.ok === true, text: msg, detail: detailParts.join("\n") });
      const result = await save(state.view, state.draft).catch(() => null);
      if (result?.ok) setState((s) => ({ ...s, view: result.value, draft: { ...result.value.value } }));
      setState((s) => ({ ...s, busy: false }));
      refresh();
    } catch (error) {
      setApplyMsg({ ok: false, text: t.applyFail, detail: String(error?.message ?? error) });
      setState((s) => ({ ...s, busy: false }));
    }
  };
  const doEmbedStart = async () => {
    setOpsMsg(null);
    const res = await postJson("/dsh-gbrain/embed/start", {});
    const body = res.body ?? {};
    if (body.started) setOpsMsg({ ok: true, text: fmt("started", { pid: body.pid }) });
    else if (body.pid) setOpsMsg({ ok: true, text: fmt("alreadyRunning", { pid: body.pid }) });
    else setOpsMsg({ ok: false, text: t.startFail, detail: body.error ?? "" });
    setJob(body);
  };
  const doEmbedStop = async () => {
    const res = await postJson("/dsh-gbrain/embed/stop", {});
    setOpsMsg({ ok: Boolean(res.body?.stopped), text: res.body?.stopped ? "SIGTERM sent" : res.body?.error ?? "stop failed" });
  };
  const doRecreate = async () => {
    const draft2 = state.draft;
    if (draft2 === null) return;
    setOpsMsg(null);
    setState((s) => ({ ...s, busy: true }));
    try {
      const res = await postJson("/dsh-gbrain/container/recreate", { device: draft2.device });
      const body = res.body ?? {};
      if (body.ok) setOpsMsg({ ok: true, text: fmt("recreateOk", { device: body.ngl === "99" ? "gpu" : "cpu" }) });
      else setOpsMsg({ ok: false, text: t.recreateFail, detail: (body.error ?? "") + (body.steps?.length ? "\n" + body.steps.map((s) => `${s.argv} -> ${s.exitCode}`).join("\n") : "") });
    } catch (error) {
      setOpsMsg({ ok: false, text: t.recreateFail, detail: String(error?.message ?? error) });
    }
    setState((s) => ({ ...s, busy: false }));
  };
  if (state.status === "loading") return import_react.default.createElement("div", { style: ROOT_STYLE }, t.loading);
  if (state.status === "error") return import_react.default.createElement("div", { style: ROOT_STYLE }, import_react.default.createElement("div", { style: { fontSize: 12, color: "rgba(240,130,130,0.95)" } }, state.error));
  const { view, draft } = state;
  const doctor = live ? parseDoctor(live.status?.body) : null;
  const sources = live ? parseSources(live.status?.body) : null;
  const probe = live?.probe?.body ?? null;
  const models = probe?.models ?? null;
  const dims = probe?.dims ?? null;
  const brainHasData = Array.isArray(sources) && sources.some((s) => (s?.total_chunks ?? 0) > 0);
  const jobRunning = Boolean(job?.running);
  return import_react.default.createElement(
    "div",
    { style: ROOT_STYLE },
    // Header
    import_react.default.createElement(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 } },
      import_react.default.createElement("h2", { style: { fontSize: 16, margin: 0 } }, t.title),
      import_react.default.createElement("span", { style: { fontSize: 11, opacity: 0.55 } }, `${t.subtitle} \u2014 ${draft?.gbrainHome || "$GBRAIN_HOME"}`),
      import_react.default.createElement(
        "div",
        { style: { marginLeft: "auto" } },
        import_react.default.createElement("button", { style: BUTTON_STYLE, disabled: refreshing, onClick: refresh }, refreshing ? t.refreshing : t.refresh)
      )
    ),
    // 1. Health
    import_react.default.createElement(
      Card,
      { title: t.health, right: doctor ? import_react.default.createElement(
        "span",
        null,
        import_react.default.createElement("span", { style: BADGE_STYLE(doctor.status === "ok") }, String(doctor.status ?? "?")),
        " ",
        import_react.default.createElement("span", { style: { fontSize: 11, opacity: 0.7 } }, `${t.healthScore} ${doctor.healthScore ?? "?"} \xB7 ${doctor.failCount ?? 0} fail / ${doctor.warnCount ?? "?"} ${t.checksWarn} / ${doctor.total ?? "?"} ${t.checksOk}`)
      ) : null },
      !live ? import_react.default.createElement("div", { style: HINT_STYLE }, t.loading) : null,
      live && !doctor ? import_react.default.createElement("div", { style: PRE_STYLE }, (live.status?.body?.doctor?.stderr || live.status?.body?.doctor?.stdout || "doctor unavailable").slice(0, 2e3)) : null,
      doctor ? import_react.default.createElement(
        "table",
        { style: { borderCollapse: "collapse" } },
        import_react.default.createElement("thead", null, import_react.default.createElement(
          "tr",
          null,
          import_react.default.createElement("th", { style: TH_STYLE }, t.srcName),
          import_react.default.createElement("th", { style: TH_STYLE }, t.srcPages),
          import_react.default.createElement("th", { style: TH_STYLE }, t.srcChunks),
          import_react.default.createElement("th", { style: TH_STYLE }, t.srcEmbed),
          import_react.default.createElement("th", { style: TH_STYLE }, t.srcSync)
        )),
        import_react.default.createElement(
          "tbody",
          null,
          (sources ?? []).map((s) => import_react.default.createElement(
            "tr",
            { key: s.source_id },
            import_react.default.createElement("td", { style: TD_STYLE }, s.name ?? s.source_id),
            import_react.default.createElement("td", { style: TD_STYLE }, String(s.total_pages ?? 0)),
            import_react.default.createElement("td", { style: TD_STYLE }, String(s.total_chunks ?? 0)),
            import_react.default.createElement("td", { style: TD_STYLE }, `${s.embedded_chunks ?? 0} (${s.embed_coverage_pct ?? 0}%)`),
            import_react.default.createElement("td", { style: TD_STYLE }, s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : t.never)
          ))
        )
      ) : null,
      doctor && doctor.warnChecks.length > 0 ? import_react.default.createElement(
        "details",
        { style: { marginTop: 8 } },
        import_react.default.createElement("summary", { style: { fontSize: 11, opacity: 0.7, cursor: "pointer" } }, `${t.checksWarn} (${doctor.warnCount})`),
        import_react.default.createElement("div", { style: PRE_STYLE }, doctor.warnChecks.map((c) => `\u2022 ${c.name}: ${c.message}`).join("\n").slice(0, 3e3))
      ) : null
    ),
    // 2. Embed server
    import_react.default.createElement(
      Card,
      { title: t.embedServer, right: models ? import_react.default.createElement("span", { style: BADGE_STYLE(models.reachable) }, models.reachable ? t.reachable : t.unreachable) : null },
      models ? import_react.default.createElement(
        "div",
        { style: { fontSize: 12, lineHeight: 1.6 } },
        import_react.default.createElement("div", null, `${t.models}: ${models.reachable ? (models.models ?? []).join(", ") || "\u2014" : models.error ?? "?"}`),
        import_react.default.createElement("div", null, `${t.configuredModel}: ${models.reachable ? models.modelListed ? `${models.configuredModel} (${t.modelListed})` : `${models.configuredModel} (${t.modelMissing})` : "\u2014"}`),
        dims ? import_react.default.createElement(
          "div",
          null,
          `${t.dimsCheck}: `,
          import_react.default.createElement("span", { style: BADGE_STYLE(dims.match === true) }, dims.ok ? `${dims.dims} ${dims.match ? t.dimsMatch : t.dimsMismatch}` : t.unreachable),
          dims.ok && !dims.match ? ` (${t.dimsExpected} ${dims.expected})` : null
        ) : null
      ) : import_react.default.createElement("div", { style: HINT_STYLE }, t.loading)
    ),
    // 3. Embed job + ops
    import_react.default.createElement(
      Card,
      { title: t.ops },
      import_react.default.createElement(
        "div",
        { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 } },
        import_react.default.createElement("button", { style: BUTTON_STYLE, disabled: state.busy, onClick: doEmbedStart }, t.embedNow),
        jobRunning ? import_react.default.createElement("button", { style: BUTTON_STYLE, onClick: doEmbedStop }, t.jobStop) : null,
        jobRunning ? import_react.default.createElement("span", { style: { fontSize: 12 } }, `${t.jobRunning} (pid ${job.pid}) \u2014 ${job.startedAt ? fmt("jobStarted", { time: new Date(Number(job.startedAt)).toLocaleString() }) : ""}`) : import_react.default.createElement("span", { style: { fontSize: 12, opacity: 0.6 } }, t.jobIdle)
      ),
      job?.logTail ? import_react.default.createElement(
        "div",
        null,
        import_react.default.createElement("div", { style: FIELD_LABEL }, t.jobLog),
        import_react.default.createElement("div", { style: PRE_STYLE }, job.logTail)
      ) : null,
      import_react.default.createElement(
        "div",
        { style: { display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" } },
        import_react.default.createElement("label", { style: FIELD_LABEL }, t.device),
        import_react.default.createElement(
          "select",
          { style: SMALL_INPUT_STYLE, value: draft?.device ?? "cpu", onChange: (e) => setDraft({ device: e.target.value }) },
          import_react.default.createElement("option", { value: "cpu" }, t.cpu),
          import_react.default.createElement("option", { value: "gpu" }, t.gpu)
        ),
        import_react.default.createElement("button", { style: BUTTON_STYLE, disabled: state.busy, onClick: doRecreate }, state.busy ? t.recreating : t.recreate)
      ),
      opsMsg ? import_react.default.createElement("div", { style: { ...HINT_STYLE, color: opsMsg.ok ? "rgba(120,230,160,0.9)" : "rgba(240,130,130,0.95)" } }, opsMsg.text + (opsMsg.detail ? `
${opsMsg.detail}` : "")) : null
    ),
    // 4. Search QC
    import_react.default.createElement(
      Card,
      { title: t.search },
      import_react.default.createElement("div", { style: HINT_STYLE }, t.searchHint),
      import_react.default.createElement(
        "div",
        { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        import_react.default.createElement("input", { style: { ...INPUT_STYLE, flex: "3 1 280px" }, placeholder: t.searchPh, value: searchUi.query, onChange: (e) => setSearchUi((s) => ({ ...s, query: e.target.value })) }),
        import_react.default.createElement(
          "select",
          { style: SMALL_INPUT_STYLE, value: searchUi.mode, onChange: (e) => setSearchUi((s) => ({ ...s, mode: e.target.value })) },
          import_react.default.createElement("option", { value: "search" }, "search (hybrid)"),
          import_react.default.createElement("option", { value: "query" }, "query (+expansion)")
        ),
        import_react.default.createElement("input", { style: { ...SMALL_INPUT_STYLE, width: 70 }, type: "number", min: 1, max: 50, value: searchUi.limit, onChange: (e) => setSearchUi((s) => ({ ...s, limit: e.target.value })) }),
        import_react.default.createElement("button", { style: BUTTON_STYLE, disabled: searchUi.busy, onClick: doSearch }, searchUi.busy ? t.running : t.run)
      ),
      searchUi.error ? import_react.default.createElement("div", { style: { ...HINT_STYLE, color: "rgba(240,130,130,0.95)" } }, searchUi.error) : null,
      searchUi.output !== "" ? import_react.default.createElement("div", { style: PRE_STYLE }, searchUi.output.slice(0, 2e4)) : null
    ),
    // 5. Embedding model
    import_react.default.createElement(
      Card,
      { title: t.model },
      import_react.default.createElement("div", { style: HINT_STYLE }, t.modelHint),
      import_react.default.createElement(
        Row,
        null,
        import_react.default.createElement(
          Field,
          { label: t.modelField },
          import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.embeddingModel ?? "", onChange: (e) => setDraft({ embeddingModel: e.target.value }) })
        ),
        import_react.default.createElement(
          Field,
          { label: t.dimsField, hint: brainHasData ? t.dimsLocked : null },
          import_react.default.createElement("input", { style: INPUT_STYLE, type: "number", disabled: brainHasData, value: draft?.embeddingDimensions ?? "", onChange: (e) => setDraft({ embeddingDimensions: e.target.value }) })
        )
      ),
      import_react.default.createElement(
        Row,
        null,
        import_react.default.createElement(
          Field,
          { label: t.urlField },
          import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.embedServerBaseURL ?? "", onChange: (e) => setDraft({ embedServerBaseURL: e.target.value }) })
        ),
        import_react.default.createElement(
          Field,
          { label: t.keyField },
          import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.embedServerAPIKey ?? "", onChange: (e) => setDraft({ embedServerAPIKey: e.target.value }) })
        )
      ),
      import_react.default.createElement(
        "div",
        { style: { display: "flex", gap: 10, alignItems: "center" } },
        import_react.default.createElement("button", { style: BUTTON_STYLE, disabled: state.busy, onClick: doApply }, state.busy ? t.applying : t.applyVerify),
        applyMsg ? import_react.default.createElement("span", { style: { fontSize: 12, whiteSpace: "pre-wrap", color: applyMsg.ok ? "rgba(120,230,160,0.9)" : "rgba(240,130,130,0.95)" } }, applyMsg.text + (applyMsg.detail ? `
${applyMsg.detail}` : "")) : null
      )
    ),
    // 6. Connection
    import_react.default.createElement(
      Card,
      { title: t.connection },
      import_react.default.createElement("div", { style: HINT_STYLE }, t.connHint),
      import_react.default.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 8 } },
        import_react.default.createElement(
          Field,
          { label: t.homeField },
          import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.gbrainHome ?? "", onChange: (e) => setDraft({ gbrainHome: e.target.value }) })
        ),
        import_react.default.createElement(
          Row,
          null,
          import_react.default.createElement(
            Field,
            { label: t.bunField },
            import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.bunBin ?? "", onChange: (e) => setDraft({ bunBin: e.target.value }) })
          ),
          import_react.default.createElement(
            Field,
            { label: t.gbrainField },
            import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.gbrainBin ?? "", onChange: (e) => setDraft({ gbrainBin: e.target.value }) })
          )
        ),
        import_react.default.createElement(
          Row,
          null,
          import_react.default.createElement(
            Field,
            { label: t.hostDirField },
            import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.modelHostDir ?? "", onChange: (e) => setDraft({ modelHostDir: e.target.value }) })
          ),
          import_react.default.createElement(
            Field,
            { label: t.portField },
            import_react.default.createElement("input", { style: INPUT_STYLE, type: "number", value: draft?.containerHostPort ?? "", onChange: (e) => setDraft({ containerHostPort: e.target.value }) })
          )
        ),
        import_react.default.createElement(
          Row,
          null,
          import_react.default.createElement(
            Field,
            { label: t.containerField },
            import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.containerName ?? "", onChange: (e) => setDraft({ containerName: e.target.value }) })
          ),
          import_react.default.createElement(
            Field,
            { label: t.imageField },
            import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.containerImage ?? "", onChange: (e) => setDraft({ containerImage: e.target.value }) })
          )
        ),
        import_react.default.createElement(
          Field,
          { label: t.modelPathField },
          import_react.default.createElement("input", { style: INPUT_STYLE, value: draft?.containerModelPath ?? "", onChange: (e) => setDraft({ containerModelPath: e.target.value }) })
        )
      ),
      import_react.default.createElement(
        "div",
        { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 8 } },
        import_react.default.createElement("button", { style: BUTTON_STYLE, disabled: state.busy, onClick: doSave }, state.busy ? t.saving : t.save),
        state.saved ? import_react.default.createElement("span", { style: { fontSize: 12, opacity: 0.7 } }, t.saved) : null,
        view ? import_react.default.createElement("span", { style: { fontSize: 11, opacity: 0.5 } }, `r${view.revision}`) : null
      )
    )
  );
}
function apply(ctx) {
  const locale = () => ctx.locale?.getSnapshot?.()?.active === "zh" ? "zh" : "en";
  ctx.slots.inject("settings.section", () => ctx.slots.register(
    {
      name: "settings.section",
      id: "gbrain",
      order: 45,
      label: () => locale() === "en" ? "GBrian" : "GBrian",
      inject: () => ({
        hooks: { locale: ctx.locale },
        load: async () => {
          const response = await ctx.remote.settings.describe();
          if (response.ok !== true) return { ok: false, error: response.error.message };
          const view = response.value.namespaces.find((entry) => entry.ns === NS);
          if (view === void 0) return { ok: false, error: "ns-missing" };
          return { ok: true, value: view };
        },
        save: async (view, patch) => {
          const response = await ctx.remote.settings.update(NS, patch, view.revision);
          if (response.ok !== true) return { ok: false, code: response.error.code, error: response.error.message };
          return { ok: true, value: response.value };
        }
      })
    },
    GbrainSectionEntry
  ));
}
var name = "gbrain";
var inject = ["slots", "locale", "remote", "remote.settings"];

    return module.exports;
  },
});

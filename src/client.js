/**
 * dsh-gbrain — the browser half: the "GBrian" section of the Settings tab.
 *
 * One settings page, four jobs:
 *   1. STATUS  — the brain's own doctor score, per-source sync/embed
 *      coverage, and the embed-server health + 1024-dim contract, auto-loaded
 *      and refreshable (the panel never re-derives any of this itself; it
 *      shows exactly what `gbrain doctor` / `gbrain sources status` say).
 *   2. QC      — a manual search/query box: run a retrieval the same way an
 *      agent would and read the raw CLI output to quality-check it.
 *   3. MODEL   — the configurable embedding model (any provider:model,
 *      base URL, key). "Apply & verify" writes it into the brain via
 *      `gbrain config set` + the brain .env, then probes /models and does a
 *      one-token dimension check BEFORE any data flows.
 *   4. OPS     — embed-now (detached `gbrain embed --stale` with a live log
 *      tail), stop, and the CPU/GPU container toggle (docker stop/rm/run).
 *
 * No JSX: the DSH client module is a plain bundle, so the UI is built with
 * React.createElement. The loader id is the PACKAGE name (`dsh-gbrain`),
 * not the `name` export.
 *
 * @module dsh-gbrain/client
 */
import React from 'react'

/** The settings namespace this tab edits (mirrors the host's `NS`). */
const NS = 'gbrain'

// ---------------------------------------------------------------------------
// Copy (en + zh). Keep keys stable; translations stay short.
// ---------------------------------------------------------------------------
const COPY = {
  en: {
    title: 'GBrian',
    subtitle: 'gbrain control panel',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    loading: 'Loading…',
    loadError: 'Settings unavailable: {detail}',
    // status card
    health: 'Brain health',
    healthScore: 'score',
    doctorStatus: 'doctor',
    checksWarn: 'warn',
    checksOk: 'ok',
    sources: 'Sources',
    srcName: 'source',
    srcPages: 'pages',
    srcChunks: 'chunks',
    srcEmbed: 'embedded',
    srcSync: 'last sync',
    srcLag: 'lag',
    never: 'never',
    embedJob: 'Embed job',
    jobIdle: 'not running',
    jobRunning: 'running',
    jobStop: 'Stop',
    jobStarted: 'started {time}',
    jobLog: 'log (last lines)',
    embedServer: 'Embed server',
    unreachable: 'unreachable',
    reachable: 'reachable',
    models: 'models',
    configuredModel: 'configured model',
    modelListed: 'listed',
    modelMissing: 'NOT listed',
    dimsCheck: 'dimension probe',
    dimsMatch: 'match',
    dimsMismatch: 'MISMATCH',
    dimsExpected: 'expected',
    noData: 'no data',
    // search card
    search: 'Search QC',
    searchHint: 'Manual retrieval for quality checking — the raw CLI output, exactly as an agent sees it.',
    searchPh: 'e.g. what did I note about the Qwen embedding setup',
    mode: 'mode',
    run: 'Run',
    running: 'Running…',
    emptyQuery: 'Type a query first.',
    // model card
    model: 'Embedding model',
    modelHint: 'Any provider:model the brain accepts (llama-server:qwen3-embed, voyage:voyage-4, …). Apply writes it into the brain and probes the server.',
    modelField: 'provider:model',
    dimsField: 'dimensions',
    dimsLocked: 'locked (existing brain — a dims change means wipe + re-init)',
    urlField: 'server base URL',
    keyField: 'server API key',
    applyVerify: 'Apply & verify',
    applying: 'Applying…',
    applyOk: 'Applied and verified.',
    applyFail: 'Applied with problems — see detail.',
    applyDimsFail: 'Dimension mismatch — data will NOT be written; fix the model or the dimensions.',
    // ops card
    ops: 'Embed operations',
    embedNow: 'Embed stale now',
    starting: 'Starting…',
    started: 'started (pid {pid})',
    alreadyRunning: 'already running (pid {pid})',
    startFail: 'start failed',
    device: 'embed container device',
    cpu: 'CPU (safe for the LLM)',
    gpu: 'GPU (fast, needs VRAM)',
    recreate: 'Recreate container',
    recreating: 'Recreating…',
    recreateOk: 'container recreated ({device}).',
    recreateFail: 'recreate failed — see detail.',
    // connection card
    connection: 'Connection',
    connHint: 'Where the brain lives and how the CLI is reached. Leave gbrainHome empty to use $GBRAIN_HOME / ~/.gbrain.',
    homeField: 'brain home (GBRAIN_HOME)',
    bunField: 'bun binary',
    gbrainField: 'gbrain binary (empty = auto)',
    hostDirField: 'model host dir',
    containerField: 'container name',
    imageField: 'container image',
    modelPathField: 'model path (in container)',
    portField: 'host port',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved',
    conflict: 'Settings changed elsewhere — reloaded, please retry.',
    notFound: 'This section is not registered (server half missing?).',
    detail: 'detail',
    rawOutput: 'output',
    secondsAgo: '{n}s',
  },
  zh: {
    title: 'GBrian',
    subtitle: 'gbrain 控制面板',
    refresh: '刷新',
    refreshing: '刷新中…',
    loading: '加载中…',
    loadError: '设置不可用：{detail}',
    health: '大脑健康',
    healthScore: '评分',
    doctorStatus: 'doctor',
    checksWarn: '警告',
    checksOk: '正常',
    sources: '数据源',
    srcName: '数据源',
    srcPages: '页面',
    srcChunks: '分块',
    srcEmbed: '已嵌入',
    srcSync: '上次同步',
    srcLag: '延迟',
    never: '从未',
    embedJob: '嵌入任务',
    jobIdle: '未在运行',
    jobRunning: '运行中',
    jobStop: '停止',
    jobStarted: '启动于 {time}',
    jobLog: '日志（最后几行）',
    embedServer: '嵌入服务器',
    unreachable: '不可达',
    reachable: '可达',
    models: '模型',
    configuredModel: '配置的模型',
    modelListed: '已列出',
    modelMissing: '未列出',
    dimsCheck: '维度探测',
    dimsMatch: '一致',
    dimsMismatch: '不一致',
    dimsExpected: '期望',
    noData: '无数据',
    search: '检索质检',
    searchHint: '手动检索，用于质检——原始 CLI 输出，和 agent 看到的一样。',
    searchPh: '例如：我关于 Qwen 嵌入配置记了什么',
    mode: '模式',
    run: '运行',
    running: '运行中…',
    emptyQuery: '先输入查询。',
    model: '嵌入模型',
    modelHint: '任何大脑接受的 provider:model（llama-server:qwen3-embed、voyage:voyage-4 等）。应用会写入大脑并探测服务器。',
    modelField: 'provider:model',
    dimsField: '维度',
    dimsLocked: '已锁定（已有大脑——改维度意味着清空重建）',
    urlField: '服务器 base URL',
    keyField: '服务器 API 密钥',
    applyVerify: '应用并验证',
    applying: '应用中…',
    applyOk: '已应用并验证。',
    applyFail: '应用有问题——见详情。',
    applyDimsFail: '维度不一致——不会写入数据；请修正模型或维度。',
    ops: '嵌入操作',
    embedNow: '立即嵌入过期内容',
    starting: '启动中…',
    started: '已启动（pid {pid}）',
    alreadyRunning: '已在运行（pid {pid}）',
    startFail: '启动失败',
    device: '嵌入容器设备',
    cpu: 'CPU（不占 LLM）',
    gpu: 'GPU（快，需显存）',
    recreate: '重建容器',
    recreating: '重建中…',
    recreateOk: '容器已重建（{device}）。',
    recreateFail: '重建失败——见详情。',
    connection: '连接',
    connHint: '大脑位置和 CLI 调用方式。gbrainHome 留空则用 $GBRAIN_HOME / ~/.gbrain。',
    homeField: '大脑目录（GBRAIN_HOME）',
    bunField: 'bun 可执行文件',
    gbrainField: 'gbrain 可执行文件（空=自动）',
    hostDirField: '模型主机目录',
    containerField: '容器名',
    imageField: '容器镜像',
    modelPathField: '模型路径（容器内）',
    portField: '主机端口',
    save: '保存',
    saving: '保存中…',
    saved: '已保存',
    conflict: '设置在他处被修改——已重新加载，请重试。',
    notFound: '该分区未注册（缺少服务端？）。',
    detail: '详情',
    rawOutput: '输出',
    secondsAgo: '{n}秒',
  },
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------
const ROOT_STYLE = { padding: '8px 4px', fontFamily: 'inherit', maxWidth: 860 }
const CARD_STYLE = { border: '1px solid rgba(127,127,127,0.25)', borderRadius: 8, padding: 12, marginBottom: 12 }
const TITLE_STYLE = { fontSize: 13, fontWeight: 600, marginBottom: 8 }
const HINT_STYLE = { fontSize: 11, opacity: 0.6, marginTop: 4, marginBottom: 8, lineHeight: 1.45 }
const INPUT_STYLE = { width: '100%', boxSizing: 'border-box', padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid rgba(127,127,127,0.35)', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }
const SMALL_INPUT_STYLE = { ...INPUT_STYLE, width: 'auto', minWidth: 90 }
const BUTTON_STYLE = { padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid rgba(127,127,127,0.4)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }
const PRE_STYLE = { fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 260, overflowY: 'auto', padding: 8, borderRadius: 6, background: 'rgba(127,127,127,0.08)', border: '1px solid rgba(127,127,127,0.2)' }
const BADGE_STYLE = (on) => ({ display: 'inline-block', padding: '1px 8px', borderRadius: 999, fontSize: 11, border: `1px solid ${on ? 'rgba(80,200,120,0.7)' : 'rgba(220,90,90,0.7)'}`, color: on ? 'rgba(120,230,160,0.95)' : 'rgba(240,130,130,0.95)' })
const TH_STYLE = { fontSize: 11, opacity: 0.6, textAlign: 'left', padding: '2px 8px 2px 0' }
const TD_STYLE = { fontSize: 12, padding: '2px 8px 2px 0', verticalAlign: 'top' }
const FIELD_LABEL = { fontSize: 11, opacity: 0.7, marginBottom: 2, display: 'block' }

/** Anchor on the page base URI (reverse-proxy safe), pathname only. */
function api(path) {
  return new URL(path.replace(/^\/+/, ''), document.baseURI).pathname
}
async function getJson(path) {
  const res = await fetch(api(path), { cache: 'no-store' })
  let body
  try { body = await res.json() } catch { body = {} }
  return { status: res.status, body }
}
async function postJson(path, payload) {
  const res = await fetch(api(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
  let body
  try { body = await res.json() } catch { body = {} }
  return { status: res.status, body }
}

/** A labeled input row. */
function Field({ label, children, hint }) {
  return React.createElement('div', null,
    label ? React.createElement('label', { style: FIELD_LABEL }, label) : null,
    children,
    hint ? React.createElement('div', { style: HINT_STYLE }, hint) : null,
  )
}
/** A two-column responsive row. */
function Row({ children }) {
  return React.createElement('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 } },
    ...React.Children.map(children, (child) => React.createElement('div', { style: { flex: '1 1 240px', minWidth: 220 } }, child)))
}
/** Card with a title row. */
function Card({ title, right, children }) {
  return React.createElement('div', { style: CARD_STYLE },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 } },
      React.createElement('div', { style: { ...TITLE_STYLE, marginBottom: 0 } }, title),
      right || null,
    ),
    children,
  )
}

// ---------------------------------------------------------------------------
// Live-data hooks
// ---------------------------------------------------------------------------
async function loadLive() {
  const [status, probe] = await Promise.all([getJson('/dsh-gbrain/status'), getJson('/dsh-gbrain/probe')])
  return { status, probe }
}

/** Parse the doctor JSON out of the status payload; tolerant of shape drift. */
function parseDoctor(statusBody) {
  const raw = statusBody?.doctor?.stdout
  if (!raw || statusBody.doctor.exitCode !== 0) return null
  try {
    const doc = JSON.parse(raw)
    return {
      status: doc.status ?? null,
      healthScore: doc.health_score ?? null,
      warnCount: Array.isArray(doc.checks) ? doc.checks.filter((c) => c.status === 'warn').length : null,
      failCount: Array.isArray(doc.checks) ? doc.checks.filter((c) => c.status === 'fail').length : null,
      warnChecks: Array.isArray(doc.checks) ? doc.checks.filter((c) => c.status === 'warn').slice(0, 8) : [],
      total: Array.isArray(doc.checks) ? doc.checks.length : null,
    }
  } catch {
    return null
  }
}
/** Parse the sources-status JSON; tolerant of shape drift. */
function parseSources(statusBody) {
  const raw = statusBody?.sources?.stdout
  if (!raw || statusBody.sources.exitCode !== 0) return null
  try {
    const doc = JSON.parse(raw)
    return Array.isArray(doc.sources) ? doc.sources : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// The section component
// ---------------------------------------------------------------------------
function GbrainSectionEntry({ useLocale, load, save }) {
  const locale = useLocale((snapshot) => (snapshot?.active === 'zh' ? 'zh' : 'en'))
  const t = COPY[locale] ?? COPY.en
  const fmt = (key, vars) => String(t[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? String(vars[k]) : m))

  const [state, setState] = React.useState({ status: 'loading', error: null, view: null, draft: null, busy: false, saved: false })
  const [live, setLive] = React.useState(null)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchUi, setSearchUi] = React.useState({ query: '', mode: 'search', limit: 10, busy: false, output: '', code: null, error: null })
  const [job, setJob] = React.useState(null)
  const [applyMsg, setApplyMsg] = React.useState(null)
  const [opsMsg, setOpsMsg] = React.useState(null)

  const setDraft = (patch) => setState((s) => ({ ...s, draft: s.draft === null ? s.draft : { ...s.draft, ...patch }, saved: false }))

  // Initial settings load.
  React.useEffect(() => {
    let cancelled = false
    load().then((result) => {
      if (cancelled) return
      if (result.ok) setState({ status: 'ready', error: null, view: result.value, draft: { ...result.value.value }, busy: false, saved: false })
      else setState({ status: 'error', error: result.error === 'ns-missing' ? t.notFound : t.loadError.replace('{detail}', String(result.error ?? '')), view: null, draft: null, busy: false, saved: false })
    }).catch((error) => {
      if (!cancelled) setState({ status: 'error', error: t.loadError.replace('{detail}', error instanceof Error ? error.message : String(error)), view: null, draft: null, busy: false, saved: false })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initial + on-demand live load.
  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const [next, jobNext] = await Promise.all([loadLive(), getJson('/dsh-gbrain/embed/status')])
      setLive(next)
      setJob(jobNext.body)
    } catch { /* keep previous */ }
    setRefreshing(false)
  }, [])
  React.useEffect(() => { refresh() }, [refresh])

  // Poll the embed job while it is running.
  React.useEffect(() => {
    if (!job?.running) return undefined
    const timer = setInterval(async () => {
      try {
        const res = await getJson('/dsh-gbrain/embed/status')
        setJob(res.body)
        if (!res.body?.running) {
          setJob(res.body)
          refresh()
        }
      } catch { /* transient */ }
    }, 5000)
    return () => clearInterval(timer)
  }, [job?.running, refresh])

  // -- actions ---------------------------------------------------------------
  const doSave = async () => {
    const { view, draft } = state
    if (view === null || draft === null) return
    setState((s) => ({ ...s, busy: true }))
    try {
      const result = await save(view, draft)
      if (result.ok) {
        setState((s) => ({ ...s, busy: false, saved: true, view: result.value, draft: { ...result.value.value } }))
      } else {
        const fresh = await load()
        if (fresh.ok) setState({ status: 'ready', error: t.conflict, view: fresh.value, draft: { ...fresh.value.value }, busy: false, saved: false })
        else setState((s) => ({ ...s, busy: false, error: String(result.error ?? result.code ?? 'save failed') }))
      }
    } catch (error) {
      setState((s) => ({ ...s, busy: false, error: String(error?.message ?? error) }))
    }
  }

  const doSearch = async () => {
    const query = searchUi.query.trim()
    if (query === '') { setSearchUi((s) => ({ ...s, error: t.emptyQuery })); return }
    setSearchUi((s) => ({ ...s, busy: true, error: null }))
    try {
      const res = await postJson('/dsh-gbrain/search', { query, mode: searchUi.mode, limit: Number(searchUi.limit) || 10 })
      const out = res.body?.stderr ? `exit ${res.body.exitCode}\n${res.body.stderr}\n--- stdout ---\n${res.body.stdout ?? ''}` : (res.body?.stdout ?? '')
      setSearchUi((s) => ({ ...s, busy: false, output: out, code: res.body?.exitCode ?? res.status }))
    } catch (error) {
      setSearchUi((s) => ({ ...s, busy: false, error: String(error?.message ?? error) }))
    }
  }

  const doApply = async () => {
    const draft = state.draft
    if (draft === null) return
    setApplyMsg(null)
    setState((s) => ({ ...s, busy: true }))
    try {
      const res = await postJson('/dsh-gbrain/config/apply', {
        embeddingModel: draft.embeddingModel,
        embeddingDimensions: Number(draft.embeddingDimensions),
        embedServerBaseURL: draft.embedServerBaseURL,
        embedServerAPIKey: draft.embedServerAPIKey,
      })
      const body = res.body ?? {}
      let msg
      if (body.ok === true) msg = t.applyOk
      else if (body.dims && body.dims.match === false) msg = t.applyDimsFail
      else msg = t.applyFail
      const detailParts = []
      for (const entry of body.failed ?? []) detailParts.push(`[exit ${entry.exitCode}] ${entry.stderr}`)
      if (body.dims && body.dims.match === false) detailParts.push(`dims ${body.dims.dims} != expected ${body.dims.expected}`)
      if (body.models && body.models.reachable && body.models.modelListed === false) detailParts.push(`${body.configuredModel} ${t.modelMissing}`)
      setApplyMsg({ ok: body.ok === true, text: msg, detail: detailParts.join('\n') })
      // Persist the model fields to the settings ns as well (best effort).
      const result = await save(state.view, state.draft).catch(() => null)
      if (result?.ok) setState((s) => ({ ...s, view: result.value, draft: { ...result.value.value } }))
      setState((s) => ({ ...s, busy: false }))
      refresh()
    } catch (error) {
      setApplyMsg({ ok: false, text: t.applyFail, detail: String(error?.message ?? error) })
      setState((s) => ({ ...s, busy: false }))
    }
  }

  const doEmbedStart = async () => {
    setOpsMsg(null)
    const res = await postJson('/dsh-gbrain/embed/start', {})
    const body = res.body ?? {}
    if (body.started) setOpsMsg({ ok: true, text: fmt('started', { pid: body.pid }) })
    else if (body.pid) setOpsMsg({ ok: true, text: fmt('alreadyRunning', { pid: body.pid }) })
    else setOpsMsg({ ok: false, text: t.startFail, detail: body.error ?? '' })
    setJob(body)
  }
  const doEmbedStop = async () => {
    const res = await postJson('/dsh-gbrain/embed/stop', {})
    setOpsMsg({ ok: Boolean(res.body?.stopped), text: res.body?.stopped ? 'SIGTERM sent' : (res.body?.error ?? 'stop failed') })
  }
  const doRecreate = async () => {
    const draft = state.draft
    if (draft === null) return
    setOpsMsg(null)
    setState((s) => ({ ...s, busy: true }))
    try {
      const res = await postJson('/dsh-gbrain/container/recreate', { device: draft.device })
      const body = res.body ?? {}
      if (body.ok) setOpsMsg({ ok: true, text: fmt('recreateOk', { device: body.ngl === '99' ? 'gpu' : 'cpu' }) })
      else setOpsMsg({ ok: false, text: t.recreateFail, detail: (body.error ?? '') + (body.steps?.length ? '\n' + body.steps.map((s) => `${s.argv} -> ${s.exitCode}`).join('\n') : '') })
    } catch (error) {
      setOpsMsg({ ok: false, text: t.recreateFail, detail: String(error?.message ?? error) })
    }
    setState((s) => ({ ...s, busy: false }))
  }

  // -- render ----------------------------------------------------------------
  if (state.status === 'loading') return React.createElement('div', { style: ROOT_STYLE }, t.loading)
  if (state.status === 'error') return React.createElement('div', { style: ROOT_STYLE }, React.createElement('div', { style: { fontSize: 12, color: 'rgba(240,130,130,0.95)' } }, state.error))

  const { view, draft } = state
  const doctor = live ? parseDoctor(live.status?.body) : null
  const sources = live ? parseSources(live.status?.body) : null
  const probe = live?.probe?.body ?? null
  const models = probe?.models ?? null
  const dims = probe?.dims ?? null
  const brainHasData = Array.isArray(sources) && sources.some((s) => (s?.total_chunks ?? 0) > 0)
  const jobRunning = Boolean(job?.running)

  return React.createElement('div', { style: ROOT_STYLE },
    // Header
    React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 } },
      React.createElement('h2', { style: { fontSize: 16, margin: 0 } }, t.title),
      React.createElement('span', { style: { fontSize: 11, opacity: 0.55 } }, `${t.subtitle} — ${draft?.gbrainHome || '$GBRAIN_HOME'}`),
      React.createElement('div', { style: { marginLeft: 'auto' } },
        React.createElement('button', { style: BUTTON_STYLE, disabled: refreshing, onClick: refresh }, refreshing ? t.refreshing : t.refresh),
      ),
    ),

    // 1. Health
    React.createElement(Card, { title: t.health, right: doctor ? React.createElement('span', null,
      React.createElement('span', { style: BADGE_STYLE(doctor.status === 'ok') }, String(doctor.status ?? '?')),
      ' ',
      React.createElement('span', { style: { fontSize: 11, opacity: 0.7 } }, `${t.healthScore} ${doctor.healthScore ?? '?'} · ${doctor.failCount ?? 0} fail / ${doctor.warnCount ?? '?'} ${t.checksWarn} / ${doctor.total ?? '?'} ${t.checksOk}`),
    ) : null },
      !live ? React.createElement('div', { style: HINT_STYLE }, t.loading) : null,
      live && !doctor ? React.createElement('div', { style: PRE_STYLE }, (live.status?.body?.doctor?.stderr || live.status?.body?.doctor?.stdout || 'doctor unavailable').slice(0, 2000)) : null,
      doctor ? React.createElement('table', { style: { borderCollapse: 'collapse' } },
        React.createElement('thead', null, React.createElement('tr', null,
          React.createElement('th', { style: TH_STYLE }, t.srcName),
          React.createElement('th', { style: TH_STYLE }, t.srcPages),
          React.createElement('th', { style: TH_STYLE }, t.srcChunks),
          React.createElement('th', { style: TH_STYLE }, t.srcEmbed),
          React.createElement('th', { style: TH_STYLE }, t.srcSync),
        )),
        React.createElement('tbody', null,
          (sources ?? []).map((s) => React.createElement('tr', { key: s.source_id },
            React.createElement('td', { style: TD_STYLE }, s.name ?? s.source_id),
            React.createElement('td', { style: TD_STYLE }, String(s.total_pages ?? 0)),
            React.createElement('td', { style: TD_STYLE }, String(s.total_chunks ?? 0)),
            React.createElement('td', { style: TD_STYLE }, `${s.embedded_chunks ?? 0} (${s.embed_coverage_pct ?? 0}%)`),
            React.createElement('td', { style: TD_STYLE }, s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : t.never),
          )),
        ),
      ) : null,
      doctor && doctor.warnChecks.length > 0 ? React.createElement('details', { style: { marginTop: 8 } },
        React.createElement('summary', { style: { fontSize: 11, opacity: 0.7, cursor: 'pointer' } }, `${t.checksWarn} (${doctor.warnCount})`),
        React.createElement('div', { style: PRE_STYLE }, doctor.warnChecks.map((c) => `• ${c.name}: ${c.message}`).join('\n').slice(0, 3000)),
      ) : null,
    ),

    // 2. Embed server
    React.createElement(Card, { title: t.embedServer, right: models ? React.createElement('span', { style: BADGE_STYLE(models.reachable) }, models.reachable ? t.reachable : t.unreachable) : null },
      models ? React.createElement('div', { style: { fontSize: 12, lineHeight: 1.6 } },
        React.createElement('div', null, `${t.models}: ${models.reachable ? (models.models ?? []).join(', ') || '—' : (models.error ?? '?')}`),
        React.createElement('div', null, `${t.configuredModel}: ${models.reachable ? (models.modelListed ? `${models.configuredModel} (${t.modelListed})` : `${models.configuredModel} (${t.modelMissing})`) : '—'}`),
        dims ? React.createElement('div', null,
          `${t.dimsCheck}: `,
          React.createElement('span', { style: BADGE_STYLE(dims.match === true) }, dims.ok ? `${dims.dims} ${dims.match ? t.dimsMatch : t.dimsMismatch}` : t.unreachable),
          dims.ok && !dims.match ? ` (${t.dimsExpected} ${dims.expected})` : null,
        ) : null,
      ) : React.createElement('div', { style: HINT_STYLE }, t.loading),
    ),

    // 3. Embed job + ops
    React.createElement(Card, { title: t.ops },
      React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 } },
        React.createElement('button', { style: BUTTON_STYLE, disabled: state.busy, onClick: doEmbedStart }, t.embedNow),
        jobRunning ? React.createElement('button', { style: BUTTON_STYLE, onClick: doEmbedStop }, t.jobStop) : null,
        jobRunning
          ? React.createElement('span', { style: { fontSize: 12 } }, `${t.jobRunning} (pid ${job.pid}) — ${job.startedAt ? fmt('jobStarted', { time: new Date(Number(job.startedAt)).toLocaleString() }) : ''}`)
          : React.createElement('span', { style: { fontSize: 12, opacity: 0.6 } }, t.jobIdle),
      ),
      job?.logTail ? React.createElement('div', null,
        React.createElement('div', { style: FIELD_LABEL }, t.jobLog),
        React.createElement('div', { style: PRE_STYLE }, job.logTail),
      ) : null,
      React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' } },
        React.createElement('label', { style: FIELD_LABEL }, t.device),
        React.createElement('select', { style: SMALL_INPUT_STYLE, value: draft?.device ?? 'cpu', onChange: (e) => setDraft({ device: e.target.value }) },
          React.createElement('option', { value: 'cpu' }, t.cpu),
          React.createElement('option', { value: 'gpu' }, t.gpu),
        ),
        React.createElement('button', { style: BUTTON_STYLE, disabled: state.busy, onClick: doRecreate }, state.busy ? t.recreating : t.recreate),
      ),
      opsMsg ? React.createElement('div', { style: { ...HINT_STYLE, color: opsMsg.ok ? 'rgba(120,230,160,0.9)' : 'rgba(240,130,130,0.95)' } }, opsMsg.text + (opsMsg.detail ? `\n${opsMsg.detail}` : '')) : null,
    ),

    // 4. Search QC
    React.createElement(Card, { title: t.search },
      React.createElement('div', { style: HINT_STYLE }, t.searchHint),
      React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        React.createElement('input', { style: { ...INPUT_STYLE, flex: '3 1 280px' }, placeholder: t.searchPh, value: searchUi.query, onChange: (e) => setSearchUi((s) => ({ ...s, query: e.target.value })) }),
        React.createElement('select', { style: SMALL_INPUT_STYLE, value: searchUi.mode, onChange: (e) => setSearchUi((s) => ({ ...s, mode: e.target.value })) },
          React.createElement('option', { value: 'search' }, 'search (hybrid)'),
          React.createElement('option', { value: 'query' }, 'query (+expansion)'),
        ),
        React.createElement('input', { style: { ...SMALL_INPUT_STYLE, width: 70 }, type: 'number', min: 1, max: 50, value: searchUi.limit, onChange: (e) => setSearchUi((s) => ({ ...s, limit: e.target.value })) }),
        React.createElement('button', { style: BUTTON_STYLE, disabled: searchUi.busy, onClick: doSearch }, searchUi.busy ? t.running : t.run),
      ),
      searchUi.error ? React.createElement('div', { style: { ...HINT_STYLE, color: 'rgba(240,130,130,0.95)' } }, searchUi.error) : null,
      searchUi.output !== '' ? React.createElement('div', { style: PRE_STYLE }, searchUi.output.slice(0, 20000)) : null,
    ),

    // 5. Embedding model
    React.createElement(Card, { title: t.model },
      React.createElement('div', { style: HINT_STYLE }, t.modelHint),
      React.createElement(Row, null,
        React.createElement(Field, { label: t.modelField },
          React.createElement('input', { style: INPUT_STYLE, value: draft?.embeddingModel ?? '', onChange: (e) => setDraft({ embeddingModel: e.target.value }) })),
        React.createElement(Field, { label: t.dimsField, hint: brainHasData ? t.dimsLocked : null },
          React.createElement('input', { style: INPUT_STYLE, type: 'number', disabled: brainHasData, value: draft?.embeddingDimensions ?? '', onChange: (e) => setDraft({ embeddingDimensions: e.target.value }) })),
      ),
      React.createElement(Row, null,
        React.createElement(Field, { label: t.urlField },
          React.createElement('input', { style: INPUT_STYLE, value: draft?.embedServerBaseURL ?? '', onChange: (e) => setDraft({ embedServerBaseURL: e.target.value }) })),
        React.createElement(Field, { label: t.keyField },
          React.createElement('input', { style: INPUT_STYLE, value: draft?.embedServerAPIKey ?? '', onChange: (e) => setDraft({ embedServerAPIKey: e.target.value }) })),
      ),
      React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center' } },
        React.createElement('button', { style: BUTTON_STYLE, disabled: state.busy, onClick: doApply }, state.busy ? t.applying : t.applyVerify),
        applyMsg ? React.createElement('span', { style: { fontSize: 12, whiteSpace: 'pre-wrap', color: applyMsg.ok ? 'rgba(120,230,160,0.9)' : 'rgba(240,130,130,0.95)' } }, applyMsg.text + (applyMsg.detail ? `\n${applyMsg.detail}` : '')) : null,
      ),
    ),

    // 6. Connection
    React.createElement(Card, { title: t.connection },
      React.createElement('div', { style: HINT_STYLE }, t.connHint),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        React.createElement(Field, { label: t.homeField },
          React.createElement('input', { style: INPUT_STYLE, value: draft?.gbrainHome ?? '', onChange: (e) => setDraft({ gbrainHome: e.target.value }) })),
        React.createElement(Row, null,
          React.createElement(Field, { label: t.bunField },
            React.createElement('input', { style: INPUT_STYLE, value: draft?.bunBin ?? '', onChange: (e) => setDraft({ bunBin: e.target.value }) })),
          React.createElement(Field, { label: t.gbrainField },
            React.createElement('input', { style: INPUT_STYLE, value: draft?.gbrainBin ?? '', onChange: (e) => setDraft({ gbrainBin: e.target.value }) })),
        ),
        React.createElement(Row, null,
          React.createElement(Field, { label: t.hostDirField },
            React.createElement('input', { style: INPUT_STYLE, value: draft?.modelHostDir ?? '', onChange: (e) => setDraft({ modelHostDir: e.target.value }) })),
          React.createElement(Field, { label: t.portField },
            React.createElement('input', { style: INPUT_STYLE, type: 'number', value: draft?.containerHostPort ?? '', onChange: (e) => setDraft({ containerHostPort: e.target.value }) })),
        ),
        React.createElement(Row, null,
          React.createElement(Field, { label: t.containerField },
            React.createElement('input', { style: INPUT_STYLE, value: draft?.containerName ?? '', onChange: (e) => setDraft({ containerName: e.target.value }) })),
          React.createElement(Field, { label: t.imageField },
            React.createElement('input', { style: INPUT_STYLE, value: draft?.containerImage ?? '', onChange: (e) => setDraft({ containerImage: e.target.value }) })),
        ),
        React.createElement(Field, { label: t.modelPathField },
          React.createElement('input', { style: INPUT_STYLE, value: draft?.containerModelPath ?? '', onChange: (e) => setDraft({ containerModelPath: e.target.value }) })),
      ),
      React.createElement('div', { style: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 } },
        React.createElement('button', { style: BUTTON_STYLE, disabled: state.busy, onClick: doSave }, state.busy ? t.saving : t.save),
        state.saved ? React.createElement('span', { style: { fontSize: 12, opacity: 0.7 } }, t.saved) : null,
        view ? React.createElement('span', { style: { fontSize: 11, opacity: 0.5 } }, `r${view.revision}`) : null,
      ),
    ),
  )
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
/**
 * Register the settings page.
 * @param ctx - the client root context (slots, locale, settings Remotes).
 */
export function apply(ctx) {
  const locale = () => (ctx.locale?.getSnapshot?.()?.active === 'zh' ? 'zh' : 'en')
  ctx.slots.inject('settings.section', () => ctx.slots.register(
    {
      name: 'settings.section',
      id: 'gbrain',
      order: 45,
      label: () => (locale() === 'en' ? 'GBrian' : 'GBrian'),
      inject: () => ({
        hooks: { locale: ctx.locale },
        load: async () => {
          const response = await ctx.remote.settings.describe()
          if (response.ok !== true) return { ok: false, error: response.error.message }
          const view = response.value.namespaces.find((entry) => entry.ns === NS)
          if (view === undefined) return { ok: false, error: 'ns-missing' }
          return { ok: true, value: view }
        },
        save: async (view, patch) => {
          const response = await ctx.remote.settings.update(NS, patch, view.revision)
          if (response.ok !== true) return { ok: false, code: response.error.code, error: response.error.message }
          return { ok: true, value: response.value }
        },
      }),
    },
    GbrainSectionEntry,
  ))
}

/** Plugin name (mirrors the host half; the loader id is the package name). */
export const name = 'gbrain'

/** Hard client dependencies. */
export const inject = ['slots', 'locale', 'remote', 'remote.settings']

# pi-sdk

`pi-sdk` 现在定位为一个 **Pi-native interactive autopilot package with a shared headless driver**。

固定产品表达：

- **primary UX** = 当前 Pi session 内的 interactive autopilot
- **secondary UX** = CLI / headless / batch driver
- **truth / eval / learning** = 继续由 `BB` substrate 负责
- **Pi core** = 不做 patch

这意味着 `pi-sdk` 不再把“CLI orchestrator + optional extension”当作长期目标，而是把：

> **shared autopilot core + Pi interactive driver + CLI/headless driver**

作为当前正确形态。

## 当前能力

### 1. Pi-native interactive autopilot

安装为 Pi package 后，当前 session 内可直接使用：

- `/autopilot-run <goal>`
- `/autopilot-resume [goal]`
- `/autopilot-pause`
- `/autopilot-stop`
- `/autopilot-status`
- `/autopilot-status overlay`（bounded operator inspector overlay）
- `autopilot_report` tool

Interactive driver 当前已具备：

- 同一 Pi session 内 phase dispatch
- repo-local active control plane 读取
- `autopilot_report` 驱动的自动续跑
- active-slice-aware report validation
- deterministic `README / STATUS / WORKSET` writeback
- pause / resume / stop 语义
- session-branch aware runtime-state reconstruction
- local mode 下的 control-plane-aware dirty-repo initial-run guard
- footer/widget 状态展示
- operator-facing degraded-mode / warning summary
- BB-backed benchmark / promotion-readiness projection（当 server-owned status 可达时）
- BB-backed decision-authority / dry-run reconcile projection（当 server-owned authority surfaces 可达时）
- bounded status overlay inspector
- `bb` substrate 模式下的 risky tool governance preflight

### 2. Shared autopilot core

`src/autopilot/**` 现已承载共享协议面：

- protocol vocabulary / report schema
- phase prompt builder
- headless workflow engine
- interactive runtime state model + reconstruction
- closeout summary helper

### 3. CLI / headless driver

`src/sdk/orchestrator.ts` 仍保留，但现在定位为 **secondary driver**：

- CLI argv parsing
- session bootstrap
- bounded headless loop
- stdout / stderr closeout summary

### 4. Substrate seam

`src/substrate/**` 继续提供：

- `local` / `bb` substrate mode
- memory / governance / workspace ports
- repo-local control-plane read / write seams
- BB HTTP MCP adapter
- hydration / raw evidence writeback helpers

当前 local substrate 已不再是纯 no-op。
一句话：local substrate includes repo-local control-plane read/write and local git workspace scanning。

## 项目结构

```text
src/
  autopilot/
    protocol.ts          # shared protocol / commands / report schema
    phase-prompt.ts      # shared phase prompt builder
    engine.ts            # shared headless workflow engine
    state.ts             # interactive runtime state + reconstruction
    closeout.ts          # shared closeout summary formatting
  extension/
    index.ts             # Pi interactive driver
  sdk/
    orchestrator.ts      # CLI/headless driver
  shared/
    *.ts                 # compatibility re-exports into shared core
  substrate/
    index.ts             # substrate config + factory
    bb.ts                # BB HTTP MCP adapter
    local.ts             # local substrate: repo-local control plane + git workspace scan
    control-plane.ts     # repo-local active-pack parser / next-slice resolver / writeback
    hydration.ts         # pre-phase hydration + raw evidence helpers
    governance.ts        # risky tool classification helpers
    http-mcp-client.ts   # streamable HTTP MCP client
test/
  *.test.ts              # targeted TDD coverage
```

## 安装与验证

```bash
cd /home/peng/dt-git/github/pi-sdk
npm install
npm test
npm run typecheck
npm run build
```

注意：

- `build` 现在会先执行 `clean`
- `src/**` 是唯一开发真相
- `dist/**` 只是 clean build output，不再允许靠 stale dist 文件“假装”存在旧能力面
- v1 release/readiness acceptance gate 现在固定为 `npm run release:check`
- post-v1 maintenance 现已增加 clean-room packaged install smoke：`npm run smoke:packaged-install`
- final completion proof route 现已增加 `pi` startup autoload smoke：`npm run smoke:pi-autoload`
- auto-loaded command-surface smoke 现已增加：`npm run smoke:pi-commands`
- deterministic BB-backed residual smoke 现已增加：`npm run smoke:pi-bb-backed`
- operator install / upgrade / diagnostics / recovery runbook 见：`docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`

## 作为 Pi package 使用

`package.json` 已声明：

```json
{
  "pi": {
    "extensions": ["./src/extension/index.ts"]
  }
}
```

所以可以直接：

```bash
pi install /home/peng/dt-git/github/pi-sdk
```

安装后在当前 Pi session 内使用：

```text
/autopilot-run <goal>
/autopilot-resume [goal]
/autopilot-pause
/autopilot-stop
/autopilot-status
```

### Interactive 行为要点

- 当前 session 就是执行现场
- extension 使用 `sendUserMessage()` 在同一 session 内推进 phase
- 不再把 interactive path 建立在隐藏第二个 `AgentSession` 上
- `autopilot_report` 仍是 machine-consumable phase contract
- runtime state 会通过 `pi.appendEntry("autopilot-runtime-state", ...)` 持久化，供 reload / tree navigation / resume 重建
- status/widget 会显式暴露 substrate mode、degraded yes/no、warning summary
- 当 `bb` substrate 的 `memory_autopilot_status` 可达时，status/widget/overlay 会投影 objective key 与 promotion-readiness summary
- 当 `bb` substrate 的 decision-authority current/detail resources 与 reconcile-plan tool 可达时，status/overlay/closeout/hydration 会进一步投影 bounded decision-authority summary 与 `dry_run manual_reconcile` visibility
- 当 `bb` substrate 的 recent canary / strategy report resources 可达时，status/overlay/closeout/hydration 会进一步投影 bounded history-summary
- `/autopilot-status overlay` 会在当前 Pi UI 内打开 bounded inspector overlay，而不是新建第二个 UI/runtime

## 作为 CLI / headless driver 使用

确保本机 Pi 已可用，并且已有模型认证（例如 `~/.pi/agent/auth.json`）。

### Local substrate（默认）

```bash
node dist/sdk/orchestrator.js \
  --goal "Build the first usable version of feature X in this repo" \
  --cwd /path/to/target/repo \
  --max-waves 4 \
  --max-cycles 3 \
  --thinking high
```

### BB substrate

```bash
node dist/sdk/orchestrator.js \
  --goal "Implement the BB-backed slice" \
  --cwd /path/to/target/repo \
  --substrate bb
```

也可以直接开发模式运行：

```bash
npm run dev -- \
  --goal "Implement the MVP" \
  --cwd /path/to/target/repo \
  --substrate bb
```

### CLI 参数

Run mode：

- `--goal <text>`：必填，总目标
- `--cwd <path>`：目标仓库路径，默认当前目录
- `--model <provider/id>`：可选模型
- `--thinking <level>`：`off|minimal|low|medium|high|xhigh`
- `--max-waves <n>`：最大 wave 数
- `--max-cycles <n>`：每个 wave 最大 execute/review 循环数
- `--substrate <mode>`：`local|bb`，默认 `local`
- `--plan-docs <path>`：覆盖 `docs/plan` 路径
- `--bb-memory-url <url>`：覆盖 BB memory MCP 地址
- `--bb-govern-url <url>`：覆盖 BB govern MCP 地址
- `--bb-tools-url <url>`：覆盖 BB tools MCP 地址
- `--agent-dir <path>`：可选 Pi agent 目录覆盖
- `--ephemeral`：使用内存 session
- `--quiet`：不把 assistant 文本实时流到 stdout

Readiness / packaging mode：

- `--version`：输出当前 package version
- `--print-manifest`：输出 v1 release/readiness manifest JSON
- `--doctor`：执行 bounded packaging/readiness diagnostics（repo checkout 与 installed package 都保持诚实边界）
- `--help`：输出 CLI 帮助

## 协议核心

所有 driver 仍共用同一 phase protocol：

- `master_plan`
- `wave_plan`
- `execute`
- `review`
- `replan`
- `closeout`

每个 phase 结束前必须 **恰好调用一次** `autopilot_report`，并回传：

- `phase`
- `status`
- `summary`
- `nextAction`
- `evidence[]`
- `artifacts[]`
- `risks[]`

这仍然是 `pi-sdk` 的核心 machine-consumable contract。

## Substrate 行为边界

### `local`

- 不做外部 `BB` memory / govern / autopilot truth 调用
- 会读取 repo-local `docs/plan` control plane
- 会在 local mode 下执行 deterministic `README / STATUS / WORKSET` writeback
- 会做本地 git workspace scan，用于 control-plane-aware dirty-repo guard（允许 control-plane-only dirty，阻断 foreign dirty）
- interactive 与 CLI/headless 都可继续最小可运行

### `bb`

通过 BB HTTP MCP servers 接入：

- memory: `memory_recall` / `memory_store` / `memory_autopilot_status`
- decision authority: `memory_autopilot_decision_authority` / `memory_autopilot_decision_intent` / `memory_autopilot_decision_reconcile_plan`
- resources: `memory://autopilot/decision-authority/current/{objective_key}` / `memory://autopilot/decision-authority/recent` / `memory://autopilot/decision-authority/{authority_id}`
- history resources: `memory://autopilot/canary/reports/recent` / `memory://autopilot/strategy-feedback/reports/recent`（用于 bounded operator history inspection）
- govern: `govern_policy` / `govern_evaluate`
- workspace: `workspace_scan` / `plan_sync`

当前固定约束：

- `pi-sdk` 继续做 workflow shell
- benchmark / promotion / canonical truth / eval / learning 继续在 `BB`
- repo-local objective key 只用于查询 server-owned status / authority truth，不代表本地拥有 benchmark or decision truth
- 若 live BB endpoint 落后于源码，必须显式降级，而不是在 `pi-sdk` 本地偷偷发明第二套 truth path

## 关键设计约束

1. **official Pi docs / examples first**
2. **no hidden second session as the primary interactive path**
3. **no Pi core patch**
4. **BB remains the truth / eval / learning substrate**
5. **CLI stays supported, but is secondary**

## Release / Readiness Quick Commands

```bash
node dist/sdk/orchestrator.js --version
node dist/sdk/orchestrator.js --print-manifest
node dist/sdk/orchestrator.js --doctor
npm run smoke:pi-autoload
npm run smoke:pi-commands
npm run smoke:pi-bb-backed
npm run smoke:packaged-install
npm run release:check
npm pack --dry-run
```

## 相关文档

- `docs/architecture.md`
- `docs/pi-sdk-bb-integration-architecture.md`
- `docs/pi-native-interactive-autopilot-design-2026-04-16.md`
- `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
- `docs/plan/README.md`

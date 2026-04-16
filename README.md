# pi-sdk

`pi-sdk` 是一个面向 **Pi coding agent** 的 autopilot SDK：

- 一个 **Pi extension**，提供 `autopilot_report` 工具、轻量状态展示，以及 execution-phase governance preflight hook
- 一个 **Pi SDK orchestrator**，按 `master_plan -> wave_plan -> execute -> review -> replan -> closeout` 驱动任务推进
- 一组 **substrate ports**，让 `pi-sdk` 以 `local` / `bb` 两种模式接入 memory / governance / workspace substrate

项目目标不是一开始就做“万能全自动程序员”，而是把一条 **可运行、可验证、可继续外接 BB substrate** 的自动推进主路径落成薄壳。

## 当前能力

- 生成大推进纲领（master plan）
- 把工作拆成 waves
- 对每个 wave 做：
  - 计划
  - 执行
  - review
  - replan
- wave 完成后做 roadmap recalibration
- 最后做 closeout
- 通过 `autopilot_report` 把每一阶段的结构化状态回传给外层 orchestrator
- 通过 substrate ports 接入：
  - `MemoryPort`
  - `GovernPort`
  - `WorkspacePort`
- 在 `bb` 模式下：
  - pre-phase 最小 hydration
  - post-phase raw evidence writeback
  - execution 高风险动作 governance preflight

## 项目结构

```text
src/
  extension/
    index.ts              # Pi extension: autopilot_report + status UI + governance preflight
  sdk/
    orchestrator.ts       # Headless SDK runner / CLI
  shared/
    prompts.ts            # Phase prompts
    state-machine.ts      # Outer-loop decision logic
    types.ts              # Shared protocol/types
  substrate/
    index.ts              # substrate config + factory
    bb.ts                 # BB HTTP MCP adapter
    local.ts              # local/no-op substrate
    hydration.ts          # pre-phase hydration + raw evidence helpers
    governance.ts         # risky tool classification helpers
    http-mcp-client.ts    # streamable HTTP MCP client
test/
  *.test.ts               # targeted TDD coverage for substrate/config/governance
```

## 安装

```bash
cd /home/peng/dt-git/github/pi-sdk
npm install
npm test
npm run build
```

## 作为 SDK CLI 运行

确保你本机 Pi 已经可用，并且有可用模型认证（例如 `~/.pi/agent/auth.json` 或环境变量 API key）。

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

也可以直接用开发模式：

```bash
npm run dev -- \
  --goal "Implement the MVP" \
  --cwd /path/to/target/repo \
  --substrate bb
```

### CLI 参数

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

### BB endpoint 环境变量

如不显式传 CLI 参数，`bb` 模式会读取：

- `PI_SDK_SUBSTRATE=bb`
- `PI_SDK_BB_MEMORY_URL`（默认 `http://127.0.0.1:3100/mcp`）
- `PI_SDK_BB_GOVERN_URL`（默认 `http://127.0.0.1:3101/mcp`）
- `PI_SDK_BB_TOOLS_URL`（默认 `http://127.0.0.1:3102/mcp`）

## 作为 Pi extension 使用

### 直接加载本地 extension

```bash
pi -e /home/peng/dt-git/github/pi-sdk/src/extension/index.ts
```

### 作为本地 Pi package 安装

因为 `package.json` 里带了：

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

安装后，extension 会提供：

- `autopilot_report` 工具
- `/autopilot-status` 命令
- `bb` substrate 模式下的 high-risk tool governance preflight

## 协议核心：autopilot_report

外层 orchestrator 不直接靠自由文本猜状态，而是要求模型在每个 phase 结束前 **恰好调用一次**：

- `phase`: `master_plan | wave_plan | execute | review | replan | closeout`
- `status`: `continue | completed | needs_replan | blocked | failed | done`
- `summary`: 当前阶段结果摘要
- `nextAction`: 建议 orchestrator 下一步做什么
- `evidence / artifacts / risks`: 结构化补充信息

## Substrate 行为边界

### `local`

- 不做外部 memory/govern/workspace 调用
- phase loop 继续保持最小可运行 CLI 行为
- 所有 substrate port 都是显式 no-op

### `bb`

通过 BB HTTP MCP servers 接入：

- memory: `memory_recall` / `memory_store`
- govern: `govern_policy` / `govern_evaluate`
- workspace: `workspace_scan` / `plan_sync`

当前设计约束：

- recall / workspace / policy 失败时 **显式告警并 fail-open**，不让最小 CLI 直接崩掉
- post-phase writeback 只写 **raw phase evidence**，不伪装成 canonical run/workset head
- governance preflight 只针对高风险 execution 动作做最小 hook

## 当前限制

这是 **V1 foundation**，故意保持薄：

- 还没有 canonical run/workset head
- 还没有 replay / eval / canary 主循环
- 还没有 subagent fan-out
- 还没有 git checkpoint / rollback 自动化
- governance preflight 当前只覆盖高风险 tool call gate，不是完整审批系统

## 开发命令

```bash
npm test
npm run typecheck
npm run build
```

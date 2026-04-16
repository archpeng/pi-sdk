# pi-sdk

`pi-sdk` 是一个面向 **Pi coding agent** 的最小化自动推进 MVP：

- 一个 **Pi extension**，提供 `autopilot_report` 工具和轻量状态展示
- 一个 **Pi SDK orchestrator**，按 `master_plan -> wave_plan -> execute -> review -> replan -> closeout` 的循环驱动任务前进

它的目标不是一开始就做“万能全自动程序员”，而是先把你要的这条主路径落成一个可运行、可继续扩展的骨架。

## MVP 能力

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

## 项目结构

```text
src/
  extension/
    index.ts            # Pi extension: autopilot_report + status command/widget
  sdk/
    orchestrator.ts     # Headless SDK runner / CLI
  shared/
    prompts.ts          # Phase prompts
    state-machine.ts    # Outer-loop decision logic
    types.ts            # Shared protocol/types
```

## 安装

```bash
cd /home/peng/dt-git/github/pi-sdk
npm install
npm run build
```

## 作为 SDK CLI 运行

确保你本机 Pi 已经可用，并且有可用模型认证（例如 `~/.pi/agent/auth.json` 或环境变量 API key）。

```bash
node dist/sdk/orchestrator.js \
  --goal "Build the first usable version of feature X in this repo" \
  --cwd /path/to/target/repo \
  --max-waves 4 \
  --max-cycles 3 \
  --thinking high
```

也可以直接用开发模式：

```bash
npm run dev -- \
  --goal "Implement the MVP" \
  --cwd /path/to/target/repo
```

### CLI 参数

- `--goal <text>`：必填，总目标
- `--cwd <path>`：目标仓库路径，默认当前目录
- `--model <provider/id>`：可选模型
- `--thinking <level>`：`off|minimal|low|medium|high|xhigh`
- `--max-waves <n>`：最大 wave 数
- `--max-cycles <n>`：每个 wave 最大 execute/review 循环数
- `--agent-dir <path>`：可选 Pi agent 目录覆盖
- `--ephemeral`：使用内存 session
- `--quiet`：不把 assistant 文本实时流到 stdout

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

## 协议核心：autopilot_report

外层 orchestrator 不直接靠自由文本猜状态，而是要求模型在每个 phase 结束前 **恰好调用一次**：

- `phase`: `master_plan | wave_plan | execute | review | replan | closeout`
- `status`: `continue | completed | needs_replan | blocked | failed | done`
- `summary`: 当前阶段结果摘要
- `nextAction`: 建议 orchestrator 下一步做什么
- `evidence / artifacts / risks`: 结构化补充信息

## 当前限制

这是 **第一版 MVP**，故意保持简单：

- 没有真正的多 sub-agent fan-out
- 没有预算管理 / 成本上限治理
- 没有 checkpoint / rollback / git closeout 自动化
- 还没有任务级持久化 workset / plan docs
- 目前假设模型会遵守“每个 phase 恰好一次 `autopilot_report`”协议

## 下一步建议

如果你继续推进第二版，优先加这些：

1. **budget guard**：最大 token / cost / turn 限制
2. **git checkpointing**：每 wave 自动 checkpoint
3. **resume protocol**：把 run config 和 latest wave state 持久化
4. **subagent planner/reviewer**：把 planning / review 拆给独立 agent
5. **closeout artifacts**：生成 plan/status/workset 或 closeout markdown

## 开发命令

```bash
npm run typecheck
npm run build
```

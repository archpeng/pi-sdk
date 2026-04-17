# PI SDK Autopilot Endgame Roadmap 2026-04-17

> type: roadmap / successor-pack map
> status: proposed
> scope: post-`P9` endgame packs for `pi-sdk × BB`
> owner: `pi-sdk`
> storage: `docs/roadmap/`
> active-control-plane rule: **this file does not create 4 simultaneous active packs**; it defines the next 4 successor packs, of which only **one at a time** should later be materialized into `docs/plan/` and handed to `execute-plan`

---

## 1. Long-Term Endgame Target

`pi-sdk` 的终局目标不是继续变厚，而是稳定收敛到：

> **Pi-first, session-native interactive autopilot shell + shared headless driver, with BB owning truth / benchmark / promotion / eval / learning.**

固定表达：

- **primary UX** = 当前 Pi session 内的 interactive autopilot
- **secondary UX** = CLI / headless / batch driver
- **truth / benchmark / promotion / eval / learning** = `BB`
- **pi-sdk** = thin workflow shell + projection + operator UX
- **Pi core** = no patch

---

## 2. What Is Already In Place

| Capability family | Current state | Primary evidence |
|---|---|---|
| Pi-native same-session interactive autopilot | `DONE` | `P7` closed out |
| Shared autopilot core + secondary headless driver | `DONE` | `P7` closed out |
| BB substrate seam for memory / govern / workspace | `DONE` | substrate foundation + later packs closed out |
| Server-owned autopilot truth surfaces reachable from `pi-sdk` | `DONE` | `P8` live smoke |
| Degraded-mode / operator visibility / overlay hardening | `DONE` | `P8` closed out |
| Benchmark / promotion-readiness projection of BB-owned status | `DONE` | `P9` closed out |
| Dormant `P6` benchmark queue superseded as active control plane | `DONE` | `P9` closed out |

### Stable baseline after `P9`

1. `pi-sdk` 已经是 **Pi-first interactive shell**，不是 CLI-first wrapper。
2. runtime reconstruction / pause / resume / stop / overlay/operator status 已经 landed。
3. `pi-sdk` 已经能消费 `BB` 的 `memory_autopilot_status` 并做 bounded projection。
4. benchmark / promotion readiness truth **没有** 被拉回本地。
5. 当前剩余工作已不再是“把壳搭起来”，而是补齐 **BB-owned benchmark / promotion / learning endgame loop**。

---

## 3. What Is Still Missing

| Missing family | Why it still matters | Why current state is not enough |
|---|---|---|
| BB-owned benchmark history + operator inspection | operator needs historical and comparative truth, not just one aggregate snapshot | current `P9` 只完成 aggregate readiness projection |
| Promotion / rollback workflow governance | candidate/baseline decisions need durable lifecycle and auditable rules | current state can observe readiness, but not yet run a full governed promotion workflow |
| First narrow learned-component loop | the system is not “learning” until one bounded component can be evaluated and promoted/rolled back | current state freezes allowed learned surfaces, but has not landed one end-to-end |
| Productization / release / runbook finish | “architecturally closed” is not the same as “operationally deliverable” | current state still lacks final release/readiness envelope |

---

## 4. Recommended Successor Pack Order

## Start first: `P10`

Why `P10` must start first:

1. `P10` turns current aggregate readiness into **historical / inspectable benchmark truth**.
2. `P11` promotion governance should not be built on top of only a thin snapshot surface.
3. `P12` learned-component work should not start until history + inspection + decision substrate are clearer.
4. `P13` productization should close a system that already has its benchmark / promotion / learning loop shape frozen.

### Roadmap table

| Order | Proposed pack id | Proposed pack name | Scope shape | Core goal | Should start now? |
|---|---|---|---|---|---|
| 1 | `P10` | `pi-sdk-bb-benchmark-history-and-operator-inspection` | likely cross-repo (`pi-sdk × BB`) | add BB-owned benchmark history / inspection truth and bounded operator projection | **YES** |
| 2 | `P11` | `pi-sdk-bb-promotion-rollout-and-decision-governance` | likely cross-repo (`pi-sdk × BB`) | add governed promote / hold / rollback lifecycle over BB-owned decision truth | after `P10` |
| 3 | `P12` | `pi-sdk-bb-first-learned-component-eval-and-promotion-loop` | likely cross-repo, tightly bounded | land exactly one narrow learned component with replay/eval/promotion loop | after `P11` |
| 4 | `P13` | `pi-sdk-autopilot-productization-and-v1-release-readiness` | mostly repo-local, maybe light cross-repo docs/runbooks | close release/runbook/smoke/readiness envelope for v1 | after `P12` |

---

## 5. Successor Pack Definitions

## `P10` — `pi-sdk-bb-benchmark-history-and-operator-inspection`

### Pack goal

把当前 `P9` 已完成的 aggregate readiness projection，推进成：

- **BB-owned benchmark history truth**
- operator-inspectable historical / comparative surfaces
- repo-local bounded projection only

### Why this pack exists

当前系统已经能回答“现在的 readiness 是什么”，但还不能稳定回答：

- 过去几次 objective / wave / candidate 的 benchmark 变化是什么
- operator 应如何比较历史 canary / strategy / replay 结果
- 哪些 benchmark family 已经足够稳定，哪些只是短时信号

### Proposed slice ladder

1. `P10.S1` — benchmark-history-and-inspection owner-boundary freeze
2. `P10.S2` — BB-owned benchmark-history contract and vocabulary freeze
3. `P10.S3` — bounded operator inspection projection MVP in `pi-sdk`
4. `P10.S4` — live benchmark-history smoke or stop-handoff
5. `P10.S5` — closeout and promotion-governance handoff

### Pack-level stop boundary

- stop if `pi-sdk` needs to invent local benchmark history storage
- stop if operator inspection cannot stay projection-only
- stop if BB-owned history truth path is not yet ready and would need local compensation

---

## `P11` — `pi-sdk-bb-promotion-rollout-and-decision-governance`

### Pack goal

在 `P10` 提供的历史 / inspection 基础上，补齐：

- baseline / candidate lifecycle
- promote / hold / rollback decision governance
- server-owned evidence-backed decision truth
- repo-local operator control / projection surface

### Why this pack exists

当前系统已经能投影 readiness，但还不是真正能 governed promotion 的系统。需要把：

- canary signal
- strategy feedback
- benchmark delta
- rollback trigger

收敛成可审计 decision workflow。

### Proposed slice ladder

1. `P11.S1` — promotion-rollout-lifecycle-and-owner-boundary freeze
2. `P11.S2` — BB-owned decision-ledger / resource / tool contract freeze
3. `P11.S3` — bounded operator projection/control surface in `pi-sdk`
4. `P11.S4` — live promote-hold-rollback smoke or stop-handoff
5. `P11.S5` — closeout and first-learned-component handoff

### Pack-level stop boundary

- stop if decision truth would fall back to local state
- stop if rollout governance requires Pi core/runtime patch
- stop if BB cannot own the durable decision ledger

---

## `P12` — `pi-sdk-bb-first-learned-component-eval-and-promotion-loop`

### Pack goal

从已冻结的 narrow learned surfaces 中，选 **exactly one** first component，完成：

- bounded training/eval contract
- replay/eval/canary path
- candidate vs baseline comparison
- promote / rollback discipline

### Recommended first component priority

1. `artifact summarizer`
2. `review verdict classifier`
3. `next-step route classifier`
4. `repair strategy ranker`
5. `retrieval reranker`

推荐先从 `artifact summarizer` 或 `review verdict classifier` 开始，因为：

- 更容易 bounded evaluation
- 风险更低
- 不容易把 `pi-sdk` 重新拖回 heuristic brain

### Proposed slice ladder

1. `P12.S1` — first-learned-component selection and benchmark freeze
2. `P12.S2` — eval input/output contract and replay harness boundary freeze
3. `P12.S3` — bounded candidate integration behind BB-owned eval truth
4. `P12.S4` — promote/hold/rollback loop for the first learned component
5. `P12.S5` — closeout and scale-or-defer decision

### Pack-level stop boundary

- stop if more than one learned component is being mixed into the first pack
- stop if replay/eval truth must move into local repo-owned storage
- stop if the component cannot be benchmarked with auditable evidence

---

## `P13` — `pi-sdk-autopilot-productization-and-v1-release-readiness`

### Pack goal

在 `P10` + `P11` + `P12` 已闭合后，做 final productization closeout：

- release discipline
- packaging / installation / upgrade truth
- operator runbook
- production-like smoke / regression gate
- v1 readiness closeout

### Why this pack exists

长期目标的终局不只是“架构上能闭环”，还要做到：

- operator 能装、用、诊断、恢复
- release boundary 清楚
- v1 readiness 有明确 gate

### Proposed slice ladder

1. `P13.S1` — v1-release-readiness boundary freeze
2. `P13.S2` — packaging/versioning/install-upgrade discipline
3. `P13.S3` — operator runbook and recovery/diagnostics bundle
4. `P13.S4` — production-like smoke/regression/acceptance gate
5. `P13.S5` — v1 closeout and post-v1 roadmap handoff

### Pack-level stop boundary

- stop if release readiness would require reopening core architecture decisions
- stop if productization starts inventing a second truth path outside BB
- stop if acceptance can only be demonstrated through ad hoc undocumented steps

---

## 6. Endgame Completion Rule

可以把“长期目标在 v1 意义上真正完成”定义为：

1. `P10` closed: benchmark history / inspection truth exists and is operator-visible
2. `P11` closed: promote / hold / rollback governance exists over BB-owned truth
3. `P12` closed: at least one narrow learned component can be benchmarked and promoted/rolled back honestly
4. `P13` closed: productization / release / runbook / smoke envelope is synchronized and evidence-backed

### Practical interpretation

- **architectural shell completeness**: already high after `P7`/`P8`/`P9`
- **true endgame completeness**: requires `P10` + `P11` + `P12`
- **deliverable v1 completeness**: requires `P10` + `P11` + `P12` + `P13`

---

## 7. Immediate Recommendation

### If starting the next pack now

Start with:

> **`P10 — pi-sdk-bb-benchmark-history-and-operator-inspection`**

### Why not skip directly to `P11` or `P12`

- skipping to `P11` risks building decision governance without enough historical inspection truth
- skipping to `P12` risks premature learned-component work before benchmark history and promotion workflow are mature enough
- skipping straight to `P13` would harden release surfaces before the real benchmark/promotion/learning endgame loop exists

---

## 8. Proposed Future Pack Roots

These are **proposed future pack roots** only. They are not active yet.

| Pack | Suggested future `docs/plan` root |
|---|---|
| `P10` | `pi-sdk-bb-benchmark-history-and-operator-inspection-2026-04-17` |
| `P11` | `pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17` |
| `P12` | `pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17` |
| `P13` | `pi-sdk-autopilot-productization-and-v1-release-readiness-2026-04-17` |

Activation rule:

- create only the **next** pack in `docs/plan/`
- keep the remaining packs in this roadmap until they become the next active successor

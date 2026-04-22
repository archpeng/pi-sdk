---
name: execution-reality-audit
description: 用于某个实现 slice、wave、fix 或 family 执行后做 evidence-driven reality audit：先锚定 current truth，对照文档/issue/spec 声明与代码、测试、contract、probe、运行时现实，遇到不确定点优先补最小 proof-carrying test 或 probe；当前 scope 内可闭合的小缺口直接修，跨边界问题转 residual / handoff。用户说“执行后 review”、“对照文档和代码确认实现度”、“不确定就补测试”、“closeout 前做 reality audit”时触发。
compatibility: Best in pi with read, edit, write, and bash available. When this skill is routed by extension autopilot for `review`, `autopilot_report` must also be available.
allowed-tools: read edit write bash
metadata:
  gene_schema: pi-skill-gene/v1
  gene_profile:
    summary: Audit implementation claims against code, tests, contracts, and runtime reality.
    signals:
      - review after execution
      - compare spec and code for implementation truth
      - add proof when uncertain
      - audit before closeout
    strategy:
      - anchor current truth first
      - compare claims against code, tests, and runtime evidence
      - turn uncertainty into proof
      - repair local gaps or route residuals
      - keep review-vs-closeout ownership truthful
      - issue an honest evidence-backed verdict
    avoid:
      - broad architecture wandering without a concrete claim
      - fake closure without evidence
      - blind cross-boundary patching
      - review before current truth is anchored
      - inventing a separate global closeout skill when the routed runtime uses a repo-local closeout prompt surface
    validation:
      - findings are evidence-backed
      - new proof or reused proof is named
      - direct fixes and residuals are separated
      - final verdict and next handoff are explicit
      - routed autopilot sessions end with one compatible autopilot_report when that protocol is in scope
---

# Execution Reality Audit

在一个实现看起来“做完了”之后，用这个 skill 判断：**claim 是否真的被 reality 支撑**。

优先 evidence，次优先 prose。

## Routed Autopilot Review Contract

Apply this section only when the repo is running under the extension-driven autopilot runtime.
Do **not** imply that every repo or every manual review turn has these runtime surfaces.

- deterministic routed ownership here is `review`
- `execute` routes back to `execute-plan` when more implementation is needed
- `master_plan`, `wave_plan`, and `replan` route to `plan-creator`
- `closeout` routes to the repo-local closeout prompt surface, not a separate global closeout skill
- skill-backed phases require `selectedTools` that still include `read` and `autopilot_report`
- end the phase with exactly one `autopilot_report`
- when the prompt provides an active slice, set `stepId` to that slice ID
- do not ask whether to continue unless there is a real external blocker or approval boundary
- translate the review verdict into `autopilot_report.status`: use `completed` when the wave passes review, `continue` for more execution in the same wave, `needs_replan` when the plan must change, `done` only when the overall objective is actually complete, and `blocked` / `failed` for unsafe stops
- if review accepts and the objective is not yet complete, hand off to `execute-plan` or `plan-creator`; if the objective is complete, hand off to the repo-local closeout prompt surface

## Trigger Signals

Use this skill when the user wants to:

- review an implementation slice, wave, fix, or family after execution
- compare docs / issue / spec claims against code and tests
- add the smallest proof when the implementation status is still uncertain
- run a reality audit before closeout or handoff

## Core Strategy

1. **Anchor current truth first.** Start from the active plan / status / workset, repo rules, contracts, or stronger control-plane truth before broad repo scanning.
2. **Define the review root.** Identify the smallest real surface: current claim, governing docs, relevant code paths, tests, contracts, and any paired dependency or runtime signal.
3. **Compare claim vs reality.** Classify findings as `confirmed`, `drift`, or `uncertain` by comparing docs/specs with code, tests, contracts, probes, and runtime evidence.
4. **Turn uncertainty into proof.** Prefer the smallest proof-carrying test or probe. Reuse existing gates and artifacts before creating new ones.
5. **Repair or route.** Fix gaps that close within the current scope, owner boundary, and validation ladder. Route cross-boundary or unsafe gaps into residuals / handoff instead of patching blindly.
6. **Keep review vs closeout truthful.** Accept or reject the reviewed claim here, but do not blur review into a fake closeout surface. If the next route is closeout, make that handoff explicit and repo-local.
7. **Issue an honest verdict.** Close only when claims are supported by evidence. Separate what is confirmed, what was fixed now, and what must move to successor work.

## AVOID

- AVOID using this skill before implementation work or before current truth is known.
- AVOID broad architecture roaming when there is no concrete execution claim.
- AVOID fake closure without evidence.
- AVOID creating tests just to look rigorous when existing proof surfaces already answer the question.
- AVOID blind repairs across owner or repo boundaries.
- AVOID routing closeout through a made-up global closeout skill when the runtime uses a repo-local closeout prompt surface.

## Validation / Output Contract

Default output should include:

- `findings`
- `evidence added`
- `fixes landed`
- `successor residuals`
- `verdict` (`accept`, `accept_with_residuals`, `blocked-closeout`, or `successor-required`)
- optional `next handoff` (`plan-creator`, `execute-plan`, repo-local closeout prompt surface, or `none`)

When routed by extension autopilot, keep the same audit substance but express the final decision through exactly one `autopilot_report`, with:

- `summary` for the short review verdict
- `evidence` for confirmed proof
- `artifacts` for touched files / tests / probes
- `risks` for residuals and blockers
- `stepId` aligned to the active slice when present
- `nextAction` pointing at `execute-plan`, `plan-creator`, or the repo-local closeout prompt surface

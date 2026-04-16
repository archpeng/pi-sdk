# PI SDK BB Substrate Integration 2026-04-16 Workset

## Active Slice Queue

- [x] `P1.S1` substrate-port-and-config-freeze
- [x] `P1.S2` bb-adapter-mvp
- [x] `P1.S3` phase-hydration-and-writeback
- [x] `P1.S4` governance-hook-and-closeout-docs

## Active Slice

### `none — pack completed`

- owner: `execute-plan`
- state: `DONE`
- priority: `closed`
- goal:
  1. V1 substrate foundation 已全部落地
  2. 当前 pack 不再有待执行 slice
  3. 后续工作应切换到新 pack，而不是继续扩写本 workset

## Files / Surfaces Closed In This Pack

1. `src/sdk/orchestrator.ts`
2. `src/extension/index.ts`
3. `src/shared/types.ts`
4. `src/shared/prompts.ts`
5. `src/substrate/index.ts`
6. `src/substrate/bb.ts`
7. `src/substrate/local.ts`
8. `src/substrate/http-mcp-client.ts`
9. `src/substrate/hydration.ts`
10. `src/substrate/governance.ts`
11. `src/substrate/runtime.ts`
12. `src/index.ts`
13. `README.md`
14. `docs/architecture.md`
15. `docs/pi-sdk-bb-integration-architecture.md`
16. `test/*.test.ts`

## Deliverable Outcome

1. 主循环现在通过 substrate seam 接入 future BB dependency
2. `MemoryPort / GovernPort / WorkspacePort` 已定义并被主循环消费
3. `bb` adapter 已能接通 recall/store/policy/evaluate/workspace/plan surfaces
4. pre-phase hydration + post-phase raw evidence writeback 已落地
5. execute-phase 高风险动作已有 governance preflight hook
6. docs 与验证证据已同步

## Verification Achieved

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. `node dist/sdk/orchestrator.js --help`
5. live BB smoke on `memory_recall / memory_store / govern_policy / govern_evaluate / workspace_scan / plan_sync`

## Done-When Boundary

1. [x] ports 与 config seam 已存在并被主循环消费
2. [x] orchestrator 不再承担未来 BB substrate 的 concrete wiring 散落细节
3. [x] 当前 CLI 帮助、构建、类型检查不退化
4. [x] BB adapter / hydration / governance hook / docs closeout 全部完成

## Stop Boundary

1. 本 pack 到此停止，不继续扩写 canonical run/workset head
2. 本 pack 到此停止，不继续扩写 replay/eval/canary
3. 本 pack 到此停止，不继续扩写 full approval workflow
4. 下一阶段必须另起 plan pack

## Next Slices (Locked Order)

| Slice | State | Owner | Primary outcome | Expected verification |
|---|---|---|---|---|
| `P1.S1-substrate-port-and-config-freeze` | DONE | `execute-plan` | freeze adapter seam + config entry | PASS |
| `P1.S2-bb-adapter-mvp` | DONE | `execute-plan` | land BB-backed memory/govern/workspace adapter | PASS |
| `P1.S3-phase-hydration-and-writeback` | DONE | `execute-plan` | phase pre-hydration + raw evidence writeback | PASS |
| `P1.S4-governance-hook-and-closeout-docs` | DONE | `execute-plan` | governance preflight hook + docs sync | PASS |

## Handoff Target

- immediate_next_target: `none`
- reason: current pack closed; next work should start from a new plan creator / execute-plan pack

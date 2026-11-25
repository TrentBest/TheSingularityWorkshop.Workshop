import test from "node:test";
import assert from "node:assert/strict";
import "../hermit-core.js";

const { createShell, observe, propose, approve, authorizeInvocation, createCancellationToken, createBudget } = globalThis.HermitCore;
let now = 1000;
const clock = () => now;

function fixture() {
  const shell = createShell({
    id: "handling-floor",
    revision: 7,
    capabilities: [{ id: "physics.assess-load", version: "1", approvalRequired: true }]
  });
  const proposal = propose(shell, {
    id: "proposal-" + Math.random().toString(36).slice(2),
    capabilityId: "physics.assess-load",
    target: "crate-18kg",
    parameters: { mass: 18, unit: "kg" },
    clock
  });
  return { shell, proposal };
}

test("shell rejects duplicate capability identities", () => {
  assert.throws(() => createShell({
    id: "x",
    capabilities: [{ id: "a" }, { id: "a" }]
  }), /Duplicate capability/);
});

test("proposal cannot reference an undeclared capability", () => {
  const { shell } = fixture();
  assert.throws(() => propose(shell, {
    id: "bad", capabilityId: "motor.move", target: "crate"
  }), /not declared/);
});

test("approval is bound to the exact proposal and revision", () => {
  const { shell, proposal } = fixture();
  const receipt = approve(shell, proposal, "creator-1", { clock, ttlMs: 500 });
  assert.equal(authorizeInvocation(shell, proposal, receipt, { clock }).allowed, true);
});

test("capability version changes invalidate a proposal", () => {
  const { shell, proposal } = fixture();
  const receipt = approve(shell, proposal, "creator-1", { clock });
  const changed = createShell({
    id: shell.id, revision: shell.revision,
    capabilities: [{ id: "physics.assess-load", version: "2", approvalRequired: true }]
  });
  assert.throws(() => authorizeInvocation(changed, proposal, receipt, { clock }), /version changed/);
});

test("approval policy cannot be downgraded after proposal creation", () => {
  const { shell, proposal } = fixture();
  const changed = createShell({
    id: shell.id, revision: shell.revision,
    capabilities: [{ id: "physics.assess-load", version: "1", approvalRequired: false }]
  });
  assert.throws(() => authorizeInvocation(changed, proposal, null, { clock }), /approval policy changed/);
});

test("missing approval is denied", () => {
  const { shell, proposal } = fixture();
  assert.throws(() => authorizeInvocation(shell, proposal, null, { clock }), /required/);
});

test("approval is single-use", () => {
  const { shell, proposal } = fixture();
  const receipt = approve(shell, proposal, "creator-1", { clock });
  authorizeInvocation(shell, proposal, receipt, { clock });
  assert.throws(() => authorizeInvocation(shell, proposal, receipt, { clock }), /consumed/);
});

test("approval cannot be replayed for a different action", () => {
  const { shell, proposal } = fixture();
  const receipt = approve(shell, proposal, "creator-1", { clock });
  const other = propose(shell, {
    id: "other", capabilityId: "physics.assess-load",
    target: "different-crate", parameters: { mass: 18 }, clock
  });
  assert.throws(() => authorizeInvocation(shell, other, receipt, { clock }), /does not match/);
});

test("expired approval is denied", () => {
  const { shell, proposal } = fixture();
  const receipt = approve(shell, proposal, "creator-1", { clock, ttlMs: 500 });
  now = 1600;
  assert.throws(() => authorizeInvocation(shell, proposal, receipt, { clock }), /expired/);
  now = 1000;
});

test("stale shell revision is denied", () => {
  const { shell, proposal } = fixture();
  const receipt = approve(shell, proposal, "creator-1", { clock });
  const changed = createShell({
    id: shell.id, revision: 8, capabilities: shell.capabilities
  });
  assert.throws(() => authorizeInvocation(changed, proposal, receipt, { clock }), /Stale/);
});

test("observations carry shell revision and provenance", () => {
  const { shell } = fixture();
  const observation = observe(shell, {
    kind: "mass", value: 18, unit: "kg", provenance: "fixture:crate-18kg"
  }, clock);
  assert.equal(observation.shellRevision, 7);
  assert.equal(observation.provenance, "fixture:crate-18kg");
  assert.equal(observation.observedAt, 1000);
});

test("cancellation token stops subsequent work", () => {
  const token = createCancellationToken();
  token.cancel("host stop");
  assert.equal(token.cancelled, true);
  assert.throws(() => token.throwIfCancelled(), { name: "AbortError", message: "host stop" });
});

test("resource budget rejects over-consumption", () => {
  const budget = createBudget({ units: 3 });
  budget.consume(2);
  assert.equal(budget.remaining, 1);
  assert.throws(() => budget.consume(2), /exhausted/);
});

test("resource budget rejects invalid costs", () => {
  assert.throws(() => createBudget({ units: 2 }).consume(-1), /non-negative/);
});

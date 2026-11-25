(function (root) {
  "use strict";

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(key => deepFreeze(value[key]));
    return Object.freeze(value);
  }

  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value && typeof value === "object") {
      return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function requireText(value, label) {
    if (typeof value !== "string" || !value.trim()) throw new TypeError(label + " is required.");
    return value.trim();
  }

  const issuedShells = new WeakSet();
  const issuedProposals = new WeakSet();
  const issuedReceipts = new WeakSet();
  const consumedReceipts = new WeakSet();

  function createShell(input) {
    if (!input || !Array.isArray(input.capabilities)) throw new TypeError("A shell requires a capability catalogue.");
    const ids = new Set();
    const capabilities = input.capabilities.map(cap => {
      const id = requireText(cap.id, "Capability id");
      if (ids.has(id)) throw new TypeError("Duplicate capability: " + id);
      ids.add(id);
      return Object.freeze({ id, version: requireText(cap.version === undefined ? "1" : cap.version, "Capability version"), approvalRequired: cap.approvalRequired !== false });
    });
    const shell = Object.freeze({
      id: requireText(input.id, "Shell id"),
      revision: Number.isSafeInteger(input.revision) && input.revision >= 0 ? input.revision : 0,
      capabilities: Object.freeze(capabilities),
      observations: deepFreeze(clone(input.observations || [])),
      limits: deepFreeze(clone(input.limits || {}))
    });
    issuedShells.add(shell);
    return shell;
  }

  function observe(shell, observation, clock) {
    if (!shell || !observation) throw new TypeError("Shell and observation are required.");
    return Object.freeze({
      shellId: shell.id,
      shellRevision: shell.revision,
      observedAt: (clock || Date.now)(),
      kind: requireText(observation.kind, "Observation kind"),
      value: deepFreeze(clone(observation.value)),
      unit: observation.unit || null,
      provenance: requireText(observation.provenance, "Observation provenance"),
      confidence: Number.isFinite(observation.confidence) ? observation.confidence : null
    });
  }

  function propose(shell, input) {
    if (!shell || !input) throw new TypeError("Shell and proposal are required.");
    const capabilityId = requireText(input.capabilityId, "Capability id");
    const capability = shell.capabilities.find(item => item.id === capabilityId);
    if (!capability) throw new Error("Capability is not declared by this shell: " + capabilityId);
    const action = Object.freeze({
      capabilityId,
      capabilityVersion: capability.version,
      target: requireText(input.target, "Action target"),
      parameters: deepFreeze(clone(input.parameters || {}))
    });
    const proposal = Object.freeze({
      id: requireText(input.id, "Proposal id"),
      shellId: shell.id,
      shellRevision: shell.revision,
      action,
      actionFingerprint: canonical(action),
      approvalRequired: capability.approvalRequired,
      createdAt: (input.clock || Date.now)()
    });
    issuedProposals.add(proposal);
    return proposal;
  }

  function approve(shell, proposal, creatorId, options) {
    options = options || {};
    const now = (options.clock || Date.now)();
    const ttlMs = Number.isFinite(options.ttlMs) && options.ttlMs > 0 ? options.ttlMs : 60000;
    assertCurrent(shell, proposal);
    if (!proposal.approvalRequired) throw new Error("This proposal does not require creator approval.");
    const receipt = Object.freeze({
      proposalId: proposal.id,
      shellId: shell.id,
      shellRevision: shell.revision,
      actionFingerprint: proposal.actionFingerprint,
      creatorId: requireText(creatorId, "Creator identity"),
      approvedAt: now,
      expiresAt: now + ttlMs,
    });
    if (!Number.isFinite(receipt.expiresAt)) throw new TypeError("Approval expiry must be finite.");
    issuedReceipts.add(receipt);
    return receipt;
  }

  function assertCurrent(shell, proposal) {
    if (!shell || !issuedShells.has(shell)) throw new Error("Shell was not issued by this Hermit core.");
    if (!proposal || !issuedProposals.has(proposal)) throw new Error("Proposal was not issued by this Hermit core.");
    if (shell.id !== proposal.shellId) throw new Error("Proposal belongs to a different shell.");
    if (shell.revision !== proposal.shellRevision) throw new Error("Stale proposal: shell revision changed.");
    if (canonical(proposal.action) !== proposal.actionFingerprint) throw new Error("Proposal action was modified.");
  }

  function authorizeInvocation(shell, proposal, receipt, options) {
    options = options || {};
    assertCurrent(shell, proposal);
    const capability = shell.capabilities.find(item => item.id === proposal.action.capabilityId);
    if (!capability) throw new Error("Capability is no longer declared.");
    if (capability.version !== proposal.action.capabilityVersion) throw new Error("Capability version changed after proposal.");
    if (capability.approvalRequired !== proposal.approvalRequired) throw new Error("Capability approval policy changed after proposal.");
    if (!proposal.approvalRequired) return Object.freeze({ allowed: true, reason: "capability-policy", proposalId: proposal.id });
    if (!receipt) throw new Error("Creator approval is required.");
    if (typeof receipt !== "object" || !issuedReceipts.has(receipt)) throw new Error("Approval receipt was not issued by this Hermit core.");
    const now = (options.clock || Date.now)();
    if (receipt.proposalId !== proposal.id || receipt.shellId !== shell.id ||
        receipt.shellRevision !== shell.revision ||
        receipt.actionFingerprint !== proposal.actionFingerprint) {
      throw new Error("Approval does not match this exact action and shell revision.");
    }
    if (!Number.isFinite(receipt.expiresAt) || now >= receipt.expiresAt) throw new Error("Approval has expired.");
    if (consumedReceipts.has(receipt)) throw new Error("Approval has already been consumed.");
    consumedReceipts.add(receipt);
    return Object.freeze({ allowed: true, reason: "creator-approved", proposalId: proposal.id, actionFingerprint: proposal.actionFingerprint });
  }

  function createCancellationToken() {
    let cancelled = false;
    let reason = null;
    return Object.freeze({
      cancel(message) { cancelled = true; reason = message || "Cancelled by host."; },
      get cancelled() { return cancelled; },
      get reason() { return reason; },
      throwIfCancelled() { if (cancelled) { const error = new Error(reason); error.name = "AbortError"; throw error; } }
    });
  }

  function createBudget(options) {
    options = options || {};
    let remaining = Number.isSafeInteger(options.units) && options.units >= 0 ? options.units : 0;
    return Object.freeze({
      get remaining() { return remaining; },
      consume(units) {
        if (!Number.isSafeInteger(units) || units < 0) throw new TypeError("Budget cost must be a non-negative integer.");
        if (units > remaining) throw new Error("Resource budget exhausted.");
        remaining -= units;
        return remaining;
      }
    });
  }

  root.HermitCore = Object.freeze({ createShell, observe, propose, approve, authorizeInvocation, createCancellationToken, createBudget });
})(typeof globalThis !== "undefined" ? globalThis : this);

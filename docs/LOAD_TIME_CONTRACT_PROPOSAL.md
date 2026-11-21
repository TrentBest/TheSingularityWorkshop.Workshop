# Load-Time Dependency Discovery and Arbitration Contract Proposal

**Status:** Workshop integration proposal for discussion; not an implemented MicroBundleDomain API.

**Source baseline:** MicroBundleDomain `development` at `568197b95181cafbc2bbea0424b58bc87d29a211`, inspected 2026-11-21.

## Why this proposal exists

Workshop's editor-time composition requires more than a static dependency list. A MicroBundle may discover during its one-time load that it needs another capability, ask the host to resolve it, and then use that capability's domain operations to prepare candidate definitions. Later, every participating bundle arbitrates in the deterministic sequence declared by the resolved Experience composition.

The current MicroBundleDomain surface is intentionally smaller:

- `IMicroBundle.Dependencies` declares dependencies before loading.
- `Load(IMicroBundleLoadContext)` is a synchronous, one-time `void` method.
- `IMicroBundleLoadContext` exposes runtime identity and configuration lookup only.
- `Arbitrate(IMicroBundleArbitrationContext, int)` exposes the participating bundle list and opaque Experience context.
- Arbitration returns a Boolean indicating whether another round is required.

This proposal preserves those ownership boundaries. It does not introduce Workshop-owned replacement interfaces or direct repository access from bundles.

## Required lifecycle semantics

The host/domain contract should make these phases explicit:

1. **Resolve roots:** read manifest entries, exact versions, and declared dependencies.
2. **Load-time discovery/preparation:** each bundle is initialized exactly once for a composition instance. During this logical phase it may request additional exact-version capabilities through the host, and after resolution it can use explicitly granted typed capability operations to prepare candidate definitions.
3. **Close dependency graph:** the host validates identities, versions, trust policy, duplicate requests, cycles, and deterministic ordering. It never silently substitutes a version.
4. **Arbitrate:** visit all participants in the effective manifest/dependency order. Repeat bounded rounds only when composition changes require another pass.
5. **Finalize:** freeze the accepted composition and export deterministic prepared state with provenance.

"Load once" means the host must not invoke a bundle's existing `Load` method a second time merely because a dependency was discovered. The contract must also distinguish a one-time method invocation from a logical load operation that may await host-mediated dependency fulfillment.

## Dynamic dependency request: design options

The current synchronous `void Load` signature cannot safely express "request a new bundle, wait until it is loaded, then call its domain operations" without adding a contract seam.

### Option A — synchronous host fulfillment

A request operation resolves and loads the requested dependency before returning a capability handle.

**Advantages:** simple caller flow; the bundle can use the capability immediately.

**Risks:** nested/reentrant loading; difficult cycle detection; deep dependency chains; unclear behavior if a dependency's own load discovers another dependency. The host must guarantee deterministic reentrancy and fail closed on cycles.

### Option B — staged load continuation

A bundle's one-time load operation can suspend at a host-mediated dependency request. The host resolves and loads the requested dependency closure, then resumes the same logical load continuation with a typed capability handle. The bundle's `Load` entry point is not invoked again.

**Advantages:** preserves the natural "request, then use" authoring model while keeping repository resolution and graph ownership in the host. It can support nested discovery if the host owns a deterministic request queue and detects cycles before waiting indefinitely.

**Costs:** requires an asynchronous or continuation-capable contract and careful cancellation/failure semantics. The exact shape (async load context, request token, or staged result) belongs to MicroBundleDomain and its host implementers.

### Option C — explicit discovery then preparation callbacks

The bundle declares or discovers requirements in one phase; the host resolves the complete closure; a separate preparation callback runs once with the resolved typed capabilities.

**Advantages:** easiest phase separation and deterministic graph construction.

**Costs:** less natural if discovery depends on inspecting already available domain state; it changes the mental model from a single logical load operation into distinct discovery/preparation callbacks.

### Recommendation for contract discussion

Prefer **Option B** if dynamic discovery during load is a core requirement. It most directly preserves the creator's intended experience: Magic asks the host for Elements, waits, then uses Elements' operations to create the fictional element definitions, all within one logical load and without calling Magic's Load entry point twice.

Do not finalize the exact API until the host owners have tested cycle behavior, reentrancy, cancellation, and compatibility with current synchronous implementations. If asynchronous continuation proves too costly, Option C is the safer fallback. Option A should be accepted only with explicit proof that reentrancy and cycles are bounded and deterministic.

Regardless of option:

- Requests carry portable identity/ontology, version range or exact version, and required/optional intent.
- The host pins the resolved exact version in the composition plan.
- The host owns trust, authorization, retrieval, duplicate coalescing, cycle detection, and ordering.
- A bundle receives a typed capability contract, not an arbitrary object cast or hidden global lookup.
- Missing required capabilities, incompatible versions, cycles, or untrusted artifacts fail closed.
- Optional requests may be declined with an explicit diagnostic.
- No MicroBundle directly downloads, installs, or publishes another MicroBundle.

## Arbitration must be a negotiation protocol

The existing Boolean `Arbitrate` result can tell the host that a composition changed, but it does not express who proposed a change, who owns the affected domain, or whether that owner accepted it.

The next additive contract should model a proposal lifecycle:

1. A contributor submits a proposal against a stable target identity and revision.
2. The host routes it to the affected domain owner or its declared policy.
3. The owner accepts, rejects, constrains, or supersedes it.
4. The host records the decision and resulting revision with provenance.
5. The next arbitration round sees only the accepted effective candidate state.

A rejection is a valid, observable outcome. A proposal must never silently overwrite another bundle's authored baseline. Conflicting proposals need a deterministic policy and explicit diagnostic; manifest order alone is not consent.

Proposal identity should be stable within a composition revision so the same contribution is idempotent. The host should bound rounds, detect repeated/no-progress states, and fail with an inspectable non-convergence diagnostic. Arbitration must not perform external side effects such as publication, network mutation, payments, or live-server changes.

## Worked lifecycle: Magic requests Elements

Given an Experience containing Weapons, then a creator adds Magic:

1. Workshop resolves the manifest roots and exact versions.
2. Magic begins its one-time logical load.
3. Magic requests the Elements capability through the host-mediated request contract.
4. The host validates trust and version policy, resolves Elements, and loads it once.
5. The host resumes Magic's pending load operation with the typed Elements capability.
6. Magic uses Elements' own domain operations to prepare Water, Air, Earth, Fire, Spirit, and Darkness as fictional element definitions. Familiar elements remain intact.
7. Magic inspects the available weapon definitions and stages flaming, ice, and stone sword candidates.
8. Load-time preparation completes. The host runs arbitration in manifest order. Elements may arbitrate before Magic while still seeing Magic's prepared candidate definitions.
9. Weapons may contribute its own optional singing-sword behavior. Physics may contribute material behavior based on explicit material/model evidence. Each affected owner can accept or decline proposals.
10. The host serializes the accepted result and provenance beside the manifest for fast runtime restoration.

The Experience creator writes no bespoke Magic-to-Weapons or Weapons-to-Physics integration.

## Prepared composition and configuration

The manifest pins root MicroBundle identities and versions in explicit sequence. The host records the resolved dependency closure and effective deterministic load/arbitration order.

Configuration remains sparse: an Experience stores only overrides addressed by stable author-assigned parameter IDs. Unspecified values inherit the defaults from the exact pinned MicroBundle version. A prepared artifact records the resolved effective state needed to avoid repeating editor-time arbitration at runtime; it must not replace the manifest or conceal which versions produced it.

The prepared artifact should include source identities/versions and hashes, dependency closure, order, schema/model versions, accepted decisions, resulting revisions, and integrity metadata. FSM_Serialization owns efficient stream serialization; its byte stream should target memory, files, or transport streams without embedding repository, HTTP, or storage policy into domain contracts.

## Compatibility and migration constraints

- Keep existing synchronous `IMicroBundle.Load` implementations valid unless and until a deliberate versioned contract migration is approved.
- Prefer additive optional interfaces or a new versioned lifecycle contract over silently changing the meaning of existing methods.
- Do not add Workshop-specific types to MicroBundleDomain.
- Do not let MicroBundleDomain own dependency retrieval, repository authentication, Experience policy, or runtime scheduling.
- FSM_COS remains the composition host/arbitrator; MicroBundleDomain supplies neutral identity, dependency, capability, and proposal vocabulary.
- Foundry remains execution-focused and consumes the finalized composition; it does not arbitrate editor-time domain meaning.

## Questions for the contract owners

1. Is dynamic dependency discovery during a one-time load a supported first-class requirement, or should all dependencies be declared before loading?
2. If dynamic discovery is supported, which lifecycle model (A, B, or C) best fits FSM_COS host behavior and compatibility?
3. What is the minimal typed capability access contract, and how is capability ownership/version checked?
4. Should arbitration proposals be first-class domain contracts, or should FSM_COS own a host-level proposal protocol over existing domain operations?
5. What deterministic rules govern optional requests, version conflicts, cycles, proposal conflicts, round bounds, and non-convergence?
6. Which contract changes require a major version, and how can existing synchronous bundles continue to load?

## Acceptance tests to require before implementation is considered complete

- A bundle's load entry point is invoked exactly once per composition instance.
- A dynamic required request is resolved to the pinned version and the requesting load operation resumes with a typed capability.
- A missing or untrusted required dependency fails closed; an optional request produces an explicit declined diagnostic.
- Duplicate requests coalesce deterministically; version conflicts and dependency cycles produce bounded diagnostics, not hangs.
- Dependency and arbitration ordering is identical across repeated runs for the same manifest and artifacts.
- A dependency can be used to prepare candidate definitions before the first arbitration round.
- A proposal can be accepted, rejected, constrained, or superseded by the affected owner.
- Rejection leaves the owner's authored baseline unchanged.
- Repeated identical proposals are idempotent; non-convergent arbitration stops at a defined bound with provenance.
- Prepared state can be restored without re-running editor-time arbitration and is rejected if hashes/schema versions are incompatible.


## 10. Source-backed integration with current FSM_COS

A follow-up inspection of the current `development` implementations in FSM_COS and MicroBundleDomain sharpens the lifecycle boundary.

### What the host does today

1. `FsmCos.Execute` resolves requested roots through `IMicroBundleCatalog`.
2. Before invoking any bundle's `Load`, it traverses each resolved bundle's `Dependencies` property and resolves the complete declared dependency graph.
3. It validates identity, versions where pinned, dependency cycles, limits, and any supplied schedule.
4. It creates one `MicroBundleLoadContext` containing the runtime ID and configuration lookup.
5. It loads the dependency graph in dependency-first order. Each bundle receives the same load context and its `Load` entry point is invoked once.
6. Only after all loads succeed does FSM_COS create an `ArbitrationContext` and run bounded, manifest/composition-order arbitration rounds.
7. On success, `RuntimeAssembly` exposes typed bundle lookup (`TryGetBundle<TBundle>`) to the consumer. That lookup is a post-composition facility, not a capability lookup available during `Load`.

The current domain `IMicroBundleLoadContext` still exposes only `RuntimeId` and `TryGetConfiguration`. The current dependency request carries an exact version and configuration, but it is still declared through the bundle's pre-load `Dependencies` property. It does not provide a dynamic request operation from inside `Load`.

### Consequence for the proposed lifecycle

The host already has a graph-discovery boundary before the one-time installation callback. This makes **discovery then preparation (Option C)** a particularly natural compatibility path: an additive discovery surface can contribute requests, FSM_COS can close and validate the graph, and a preparation/load callback can then receive typed capability handles for the resolved participants. Existing synchronous `Load(context)` remains valid.

Option B (suspending and resuming one logical load operation) remains viable if the authoring model requires imperative request-then-use flow inside a single logical operation. It is a larger change: it must define continuation ownership, cancellation, reentrancy, request ordering, and how already-started participants are compensated if later discovery fails. It should not be introduced merely to imitate an imperative API when a deterministic discovery/preparation boundary can express the same dependency graph.

**Updated recommendation:** prototype and validate Option C against the current FSM_COS graph resolver first. Keep Option B as an alternative only if real MicroBundle authoring scenarios cannot be expressed cleanly through discovery followed by preparation. Do not add a dynamic resolver call to the existing synchronous `Load` context without first defining the resulting lifecycle and rollback semantics.

### Ownership and visibility boundary

- MicroBundleDomain should own neutral dependency request and typed capability contract vocabulary.
- FSM_COS should own graph closure, version conflict detection, dependency ordering, bounded preparation, and the resulting effective composition.
- A bundle's typed capability access during preparation must be scoped to the resolved composition and declared capability contract; it must not become arbitrary catalog access.
- `RuntimeAssembly.TryGetBundle<TBundle>` remains useful after composition but does not solve the preparation-time access requirement.
- Arbitration remains a separate phase. The current Boolean convergence signal still does not provide proposal ownership, accept/reject decisions, or durable atomic-change provenance.

This is a source-derived integration analysis, not a public API decision or a change to MicroBundleDomain/FSM_COS.

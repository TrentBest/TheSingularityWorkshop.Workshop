# Editor-Time MicroBundle Arbitration

**Status:** Workshop architecture direction; implementation and contract gaps are called out explicitly below.

## The central idea

A MicroBundle is more than a library that contributes a panel to an editor. It is a participant in constructing, interpreting, and negotiating the domain environment in which an Experience is authored.

Workshop is the authoritative Experience Trent intends to build. It is the canonical meta-authoring environment for this ecosystem. The ecosystem remains open: other developers may create their own Experiences, authoring environments, MicroBundles, and tools. Their freedom to create does not make those Experiences instances of Workshop or give them authority over Workshop-controlled content and hosting.

The distinctive Workshop capability is **pre-arbitration**: before an authored Experience is launched, its participating MicroBundles can be brought together in an editor-time composition process. They discover one another, prepare candidate domain contributions, inspect the wider composition, and negotiate compatible interactions. The result is prepared data that can accompany the Experience manifest so application startup does not need to rediscover and recompute the entire authoring process.

This is not simply an editor feature. It is a way for independently authored capabilities to become more expressive through composition, without every Experience creator having to write bespoke integration code between them.

## Two distinct lifecycle moments

Do not collapse loading and arbitration into one operation. They solve different problems.

### 1. Load-time preparation

The host resolves and materializes the participating MicroBundles, then invokes each bundle's `Load` lifecycle method once for that loaded composition instance.

The load phase establishes the editor-time environment and prepares candidate contributions. A bundle may need other capabilities to be present before it can do useful work. It can declare dependencies, receive their configuration, and use the supported domain operations exposed by the participating capabilities to prepare candidate definitions.

The intended Workshop experience also calls for a bundle to discover that it needs an additional capability while loading, request that capability through the host, and continue once the host has resolved and loaded it. It also needs a supported way for the loading bundle to access the already loaded dependency's domain operations. These are **host-mediated dynamic dependency/discovery and capability-access requirements**, not permission for a MicroBundle to reach directly into a repository, download arbitrary code, or mutate the host's composition behind its back.

**Current contract boundary:** the inspected MicroBundleDomain development contract exposes `IMicroBundle.Dependencies` as a declared request list. `IMicroBundle.Load(IMicroBundleLoadContext)` receives runtime identity and configuration lookup only. The current load context does not expose the participating bundle collection, a dynamic dependency-request operation, or a way to obtain a loaded dependency's capability interface. Therefore, dynamic dependency discovery and dependency capability access during `Load` are target capabilities that require additive host/domain contracts; they must not be described as already implemented.

Load-time preparation can use already resolved capabilities to create candidate domain definitions. It must not silently overwrite another bundle's authored baseline. Candidate changes remain attributable and reviewable.

### 2. Editor-time arbitration

After the required MicroBundles are present and load-time preparation has produced the candidate composition, the host runs arbitration.

The host invokes each participating bundle's `Arbitrate` method in the deterministic order defined by the resolved manifest/composition plan. Each bundle can inspect the participating composition and offer domain-relevant interactions with it.

The current `IMicroBundle.Arbitrate(IMicroBundleArbitrationContext, int roundIndex)` contract provides the participating bundle list and an arbitration round index. Its Boolean result indicates whether the bundle changed the composition such that another round is required. The host owns the loop and termination decision.

This order is meaningful. It must be stable, recorded, and reproducible. A pass is not an unordered broadcast and must not depend on incidental dictionary, filesystem, network, or thread scheduling order.

A key consequence of the two-phase design: a bundle that appears later in the arbitration sequence can prepare candidate definitions during loading, and an earlier bundle can then observe those definitions when the first arbitration round begins. For example, Elements can arbitrate before Magic while still seeing the magical elements Magic prepared during its Load phase.

## Worked example: weapons, magic, elements, and physics

Imagine an Experience whose manifest includes Weapons and the creator later adds Magic from the Workshop repository browser.

### Load and prepare

1. The editor loads the selected Magic artifact at an exact version.
2. The composition host resolves the required dependency closure. Magic requests the Elements capability through the supported dependency mechanism. If that request is dynamic, the host-mediated extension described above is required.
3. Elements is loaded into the editor composition.
4. Magic uses the Elements bundle's own domain operations to prepare Water, Air, Earth, Fire, Spirit, and Darkness as fictional element definitions.
5. Those definitions extend the candidate element set. They do not erase or redefine the familiar elements unless an explicit, accepted operation says so.
6. Magic inspects the available composition through supported contracts and recognizes compatible weapon definitions such as swords or scimitars.
7. Magic proposes derived weapon candidates: a flaming sword, an ice sword, and a stone sword. The stone effect is a game/domain rule—for example, temporarily petrifying a target until the wielder reaches 100% mastery—not a claim about ordinary physical stone.
8. The load phase completes. The bundles are present, and their candidate definitions are ready for arbitration.

### First arbitration round

The host visits the resolved MicroBundles in the manifest's defined sequence.

- **Elements** runs first. It sees the candidate magical elements already prepared by Magic and can offer its own interpretation, validation, relationships, or derived element behavior.
- **Weapons** sees the magical weapon candidates. Its creator may contribute a playful interaction—for example, deriving a singing sword when a compatible Magic bundle is present.
- **Magic** can inspect the wider composition and refine or withdraw its proposed enchantments in response to what other capabilities expose.
- **Physics** can inspect weapons, meshes, material assignments, and recognized nomenclature. It may identify a leather hilt, copper blade, bronze blade, or steel blade, then contribute material properties and interaction rules.

The result is compositional behavior. The Experience creator did not need to hard-code a special-case bridge between Magic, Weapons, Elements, and Physics.

### Material and physical reasoning

A Physics bundle might recognize that a hilt is leather and that a blade is copper, bronze, or steel. In a crafting Experience, this can connect the object to its provenance and construction: animal hide, tanning, leatherworking, smelting, alloying, forging, and assembly.

It can also contribute physical comparisons. A steel blade may shear through a bronze blade under a particular modeled collision and material configuration. That result should come from the Physics domain's declared material model, geometry, and assumptions—not from a universal hard-coded rule based only on the word "steel".

Names, mesh metadata, and material labels are useful evidence, but not always proof. When recognition is ambiguous, the bundle should report confidence/evidence or ask the creator to confirm a mapping rather than silently asserting a material identity.

The same principle applies to the singing sword and magical effects: bundles contribute their own domain semantics, and the host coordinates their interaction.

## Arbitration is negotiation, not uncontrolled mutation

The intended rule is that a bundle may offer a change to another bundle's domain, and the affected owner can accept or decline it. A bundle saying "no thanks" must be able to protect its invariants.

The eventual contract should make this explicit:

- Contributions are proposals or staged candidate operations, not invisible writes into another bundle's authored baseline.
- The affected domain owner can accept, reject, constrain, or supersede a proposal according to its declared policy.
- The host records the proposal, decision, responsible bundle/version, affected artifact, and resulting candidate revision.
- Rejection is a valid outcome, not an arbitration failure.
- Conflicting proposals have deterministic resolution rules; manifest order alone must not silently authorize destructive overwrite.
- Arbitration is bounded and convergent. A bundle must be able to recognize that it has already applied a contribution and avoid endlessly proposing the same change.
- A round that reports no composition change permits the host to stop. The host also needs a defined maximum-round/failure policy for non-convergent compositions.
- External side effects—publishing, sending network messages, charging, or changing a live server—are not editor-time arbitration operations.

**Current contract boundary:** the inspected arbitration context exposes the participating bundles and an opaque experience context. It does not yet define a first-class proposal/accept/reject protocol, ownership policy, or conflict-resolution record. Those are requirements for the next contract evolution, not features Workshop should pretend it already has.

## Manifest order and deterministic composition

The Experience manifest defines the participating MicroBundles and their exact versions, with an explicit sequence. The resolved dependency closure must also be recorded, including exact versions and a deterministic placement rule for dependencies that are not explicit manifest entries.

The composition plan must preserve enough information to reproduce the same editor-time result:

- root MicroBundle identities and exact versions;
- dependency identities and exact versions;
- the effective deterministic load/arbitration sequence;
- configuration inputs and schema versions;
- arbitration round numbers;
- proposals, accept/reject decisions, and contributing bundle versions;
- domain/model versions used to derive results;
- hashes of source artifacts and the resulting prepared composition.

If a required artifact or version cannot be resolved, or if the composition cannot satisfy its declared compatibility rules, the host fails closed rather than silently substituting a different bundle.

## Defaults and sparse configuration overrides

A MicroBundle owns its safe defaults. An Experience should not need to serialize every default value for every participating bundle.

The intended configuration model is sparse:

- The bundle version supplies its default configuration.
- The Experience stores only values that intentionally differ from those defaults.
- Overrides address fields by stable author-assigned parameter identity, never by display name, array index, or nesting path.
- Missing overrides mean "use the default for this exact bundle version".
- Configuration schema/version compatibility is checked before applying overrides.
- Unknown, invalid, or incompatible overrides are reported; they are not silently reinterpreted.
- A change to defaults in a new MicroBundle version does not silently change the meaning of an already pinned Experience. The manifest's exact version determines the default baseline.

This keeps authored configuration compact while retaining predictable behavior. Defaults are not guessed by Workshop; they belong to the MicroBundle author and the exact version selected.

## Prepared composition beside the manifest

After editor-time arbitration reaches a stable result, Workshop can serialize the prepared composition as a compact artifact alongside the Experience manifest.

The manifest remains the declaration of which MicroBundles and versions participate, and in what sequence. The prepared artifact is the reproducible result of editor-time composition: resolved dependency closure, sparse configuration overrides, accepted derived definitions, arbitration decisions, and the data needed to start the Experience without repeating authoring-time discovery and negotiation.

Keep the authored inputs and derived result distinguishable:

- The manifest and sparse overrides are the authored composition inputs.
- The prepared composition is a derived, versioned build artifact.
- Provenance links every derived result back to its exact inputs and arbitration decisions.
- A change to a bundle version, sequence, configuration, or relevant source invalidates the prepared artifact and requires recomposition.

The prepared artifact should be treated as a cache/build product that can be verified and regenerated—not as an opaque replacement for the manifest or the source MicroBundles.

## Serialization and compact runtime startup

FSM_Serialization and its ByteStream/stream abstractions are the intended efficient binary boundary. The same serialization path should be able to write to memory buffers, files, or transport streams without embedding storage or HTTP assumptions into the domain model.

The design goal is a compact, validated runtime payload:

1. Serialize stable identities and exact versions, not repeated descriptive labels.
2. Store sparse overrides, not copies of every default.
3. Store only the prepared data needed by the runtime, with provenance and compatibility metadata sufficient to validate it.
4. Use deterministic encoding and explicit schema/version markers.
5. Compress where measurement shows a net benefit; do not assume compression always improves size or startup time.
6. Validate lengths, bounds, identities, versions, hashes, and integrity before trusting the payload.
7. Fail closed on corrupt, unsupported, or incompatible prepared data; rebuild from source when the editor has the required inputs.

The performance target is not an unsubstantiated claim of the smallest possible byte count. It is measured compactness, low allocation, fast loading, and reproducible semantics.

## Responsibilities

| Participant | Responsibility |
|---|---|
| Workshop | Authoring environment, repository browsing experience, composition review, orchestration of editor-time preparation/arbitration, provenance, and prepared-artifact generation |
| MicroBundle | Its own domain definitions, safe defaults, declared dependencies, load behavior, arbitration contributions, and domain invariants |
| FSM_COS | Composition and dependency orchestration, lifecycle sequencing, and runtime assembly |
| FSM_Foundry | Execution of the assembled runtime |
| MicroBundleRepository | Discovery and delivery of versioned artifacts; it does not decide whether a composition proposal is semantically acceptable |
| FSM_Serialization | Efficient binary encoding/decoding through stream abstractions; it does not own application persistence semantics |
| Experience manifest | Exact participating identities/versions and explicit sequence |
| Prepared composition artifact | Reproducible result of editor-time arbitration, with compatibility and provenance data |

## Contract gaps and implementation gates

The current MicroBundleDomain development contract already provides:

- `IMicroBundle.Dependencies` for declared dependency requests;
- `Load(IMicroBundleLoadContext)` as the installation lifecycle;
- `Arbitrate(IMicroBundleArbitrationContext, int roundIndex)` as host-driven, repeatable composition arbitration;
- a participating bundle list in the arbitration context;
- a Boolean arbitration result indicating whether another round is required.

The following are not established by those interfaces as currently inspected and must be designed additively before claiming the full Workshop vision is implemented:

1. Host-mediated dynamic dependency/discovery requests during Load.
2. A supported Load-time capability-access seam for invoking already loaded dependency operations; the current load context exposes configuration bytes only.
3. Load-time inspection of the already resolved composition, if required.
4. Explicit staged proposals and accept/reject/veto semantics for cross-bundle changes.
5. Deterministic conflict policy and bounded convergence/failure behavior.
6. A versioned Experience manifest/composition-plan contract carrying explicit sequence and exact dependency closure.
7. A versioned prepared-composition format with sparse stable-ID overrides, provenance, integrity checks, and FSM_Serialization integration.

Do not duplicate MicroBundleDomain types inside Workshop or make a competing lifecycle. Evolve the shared contracts with the domain owner, preserve host neutrality, and keep FSM_COS as the composition orchestrator.

## Acceptance criteria

- A bundle's Load lifecycle runs once per loaded composition instance; arbitration may run for multiple rounds.
- All required dependencies are resolved at exact versions before a bundle is asked to use them.
- Dynamic requests, if supported, are host-mediated and cannot bypass repository, trust, or version policy.
- The arbitration sequence is deterministic and recorded.
- A bundle can inspect the participating composition during arbitration.
- A bundle can propose a cross-domain contribution without silently mutating another owner's baseline.
- The affected owner can decline a contribution and preserve its invariants.
- Repeated arbitration converges or fails with an explicit diagnostic within a bounded policy.
- Sparse overrides use stable parameter IDs and inherit defaults from the exact pinned bundle version.
- A prepared composition is invalidated when any relevant input changes.
- The prepared artifact can be validated and loaded without repeating editor-only discovery.
- Tests cover dependency ordering, idempotence, conflict rejection, opt-out behavior, deterministic replay, invalidation, corrupt payloads, and startup performance.

This is the intended power of Workshop: independently authored MicroBundles can recognize, enrich, and negotiate with one another before an Experience is run. The creator composes capabilities; the capabilities contribute the domain knowledge that makes the composition greater than the sum of its parts.

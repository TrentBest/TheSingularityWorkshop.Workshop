# Workshop Foundation

## 1. The central abstraction

Workshop is an Experience whose environment hosts authoring tools. It is the authoritative meta-authoring Experience Trent intends to build. It is not a monolithic editor. It discovers tools contributed by MicroBundles and composes them into workspaces.

The ecosystem remains open: other developers may create their own Experiences, MicroBundles, and editor Experiences. Workshop's canonical role does not grant it ownership over every Experience, nor does another Experience's existence diminish Workshop's authority over its own composition and controlled content.

A tool has a domain contract first and one or more presentations second:

- **Domain contract:** objects, operations, constraints, events, and results.
- **Presentation:** 2D facade, spatial/VR facade, textual renderer, or another modality.
- **Session:** a user's active interaction with a tool and authored target.
- **Preview:** an isolated executable or visual projection of a candidate.
- **Revision:** an intentional, attributable change to authored content.

A tool must not require a particular display medium to define its semantics.

## 2. Workspace composition

A workspace contains discoverable tool stations, domain-specific inventories and manipulable objects, work surfaces and inspectors, live previews, experiments, revision/adoption controls, and Hermit assistance.

A MicroBundle may contribute a specialized station or generic editor surface. Workshop discovers the contribution through a versioned tool-definition contract, checks declared capabilities, and chooses an available presentation. Unknown or unsupported capabilities fail closed.

## 3. Editor-time MicroBundle pre-arbitration

MicroBundles do not merely supply panels or libraries. They participate in constructing and negotiating the domain environment before the Experience is launched.

The lifecycle has two distinct moments:

1. **Load-time preparation.** The composition host resolves and materializes the required MicroBundles, then invokes each bundle's `Load` lifecycle once for that composition instance. Bundles establish their editor-time capabilities and prepare candidate definitions using supported domain operations. The target Workshop experience also allows a bundle to request additional capabilities through the host while loading; this must be host-mediated, version-pinned, and governed by repository/trust policy.
2. **Editor-time arbitration.** Once the candidate composition is prepared, the host invokes each bundle's `Arbitrate` method in the explicit deterministic sequence defined by the resolved composition plan. Each bundle inspects the participating composition and contributes domain-specific interactions. The host repeats rounds while changes require further arbitration, subject to convergence and safety limits.

The distinction matters. A bundle can prepare candidate definitions during Load, and an earlier bundle in the arbitration sequence can see those definitions in the first arbitration round. Thus Elements can arbitrate before Magic and still recognize magical elements that Magic prepared during loading.

### Example: Magic, Elements, Weapons, and Physics

When a creator adds Magic to an Experience that already contains Weapons:

- Magic ensures the Elements capability is present and uses Elements' own operations to prepare Water, Air, Earth, Fire, Spirit, and Darkness as fictional element definitions, preserving the familiar element set.
- Magic recognizes compatible weapon definitions such as swords or scimitars and offers derived candidates: flaming, ice, and stone swords. A stone effect can carry a game rule such as temporary petrification until the wielder reaches full mastery.
- Elements sees the prepared magical definitions during arbitration and can contribute its own semantics.
- Weapons can recognize the Magic composition and contribute its own optional behavior—for example, its creator's singing-sword interaction.
- Physics can inspect mesh/material evidence and contribute material semantics: leather, copper, bronze, steel, and their modeled interactions. It may determine, under its declared physical model, that a steel blade shears through a bronze blade without the Experience creator writing a bespoke Weapons-to-Physics integration.

Recognition must be evidence-based. Names and material labels are clues, not infallible truth. Ambiguous identification should expose evidence or request creator confirmation. Domain bundles own their rules and may decline proposed changes that violate their invariants.

### Arbitration is negotiated and repeatable

Cross-bundle contributions must be staged proposals, not invisible writes into another bundle's authored baseline. The affected domain owner must be able to accept, reject, constrain, or supersede a proposal. The host records outcomes and provenance. Rejection is a valid result.

Arbitration must be deterministic, idempotent, bounded, and convergent. A bundle must not reapply the same contribution forever. The host must diagnose conflicts and stop safely when a composition does not converge.

### Current contract boundary

The inspected MicroBundleDomain development contract provides declared dependency requests, `Load(IMicroBundleLoadContext)`, and `Arbitrate(IMicroBundleArbitrationContext, int roundIndex)`. The arbitration context exposes participating bundles, and the Boolean arbitration result indicates whether another round is required.

The current load context does not expose the bundle collection or a dynamic dependency-request operation. The current arbitration context does not define a first-class proposal/accept/reject protocol or conflict-resolution record. Those are explicit contract-evolution requirements, not implemented Workshop features. Workshop must not duplicate MicroBundleDomain types or invent a competing lifecycle.

See [Editor-time MicroBundle Arbitration](EDITOR_TIME_ARBITRATION.md) for the full lifecycle, worked example, contract gaps, manifest sequence, configuration, prepared artifact, and acceptance criteria.

## 4. Cosmos Studio

### Inventory and system canvas

Inventory entries represent typed celestial bodies: stars, planets, moons, asteroids, black holes, and future body types. A body definition carries physical parameters and provenance; it is not merely a model asset.

The suspended system visualization is a live projection of the current candidate. Dragging a body from inventory, replacing a star, or changing an orbit invokes domain operations and recalculates dependent results.

The visualization must distinguish physical values and units; display scale from physical scale; measured values from assumptions; and stable results from uncertain analysis.

### Habitability

A habitable region is not a universal green ring. It is a computed result with explicit assumptions and model versions. Analysis should account for stellar luminosity and spectrum, orbital distance and eccentricity, atmospheric assumptions, tidal effects where relevant, and the selected definition of habitability.

Planetary moons are first-class candidate worlds. Assessment may include host-planet illumination, eclipses, tidal heating, orbital stability, and radiation environment. Results are ranges and evidence, not an unconditional promise that life exists.

### Planetary worktables

A selected planet or moon can be taken to a worktable. Maps, globes, and specialized editors are domain tools contributed by appropriate MicroBundles. Editing creates a candidate revision; the baseline remains available until adoption.

## 5. The Forge

FSMs are authored through tangible, typed components.

- **State ingot:** defines a state identity and associated state data/behavior.
- **Transition ingot:** defines a directed relationship between source and destination states, with optional guards, triggers, and actions.
- **Slots:** typed ports declaring what must be supplied. A slot may accept text, a reference to another ingot, a typed value, or a domain-contributed object.

The slot contract describes type, cardinality, validation rules, and whether it is required. A visual connection is valid only when underlying contracts are compatible.

The Forge maintains an explicit graph of ingots and connections. It reports missing required slots, invalid references, unreachable states, ambiguous transitions, and diagnostics supplied by the FSM domain. Incomplete or invalid constructions must never appear as verified executable systems.

### Holodeck

The holodeck is an execution-oriented projection of an assembled FSM. It lets a creator enter the running model, observe the active state, inspect available transitions, select relevant aspects, and understand why a transition did or did not fire.

The holodeck is not authoritative for FSM semantics. The FSM runtime remains authoritative; the holodeck visualizes and interacts through its supported inspection/control contract.

## 6. Hermit and experiments

Hermit amplifies exploration without taking ownership away from the creator.

An experiment captures the exact baseline revision and configuration, creates an isolated candidate, applies a bounded parameter change or sweep, records inputs/seed/tool/model versions/resource use/outputs, supports cancellation and comparison, and can be discarded or deliberately adopted as a new revision.

Experiments must not mutate the baseline. Adoption is an explicit creator action.

## 7. Authoring and security

The ecosystem is open to authoring. Developers may create Experiences, MicroBundles, and domain-specific editor Experiences. A dungeon editor, for example, may edit dungeon content under the content owner's permissions.

Capabilities must be separated: author Experience; author MicroBundle; create or edit owned/authorized content; execute or preview; export artifact; publish to a particular server/target.

Publishing to Workshop-controlled or user-controlled servers is a distinct, server-owner-controlled authorization. No authoring, editing, execution, or export capability implies publication permission. Grants should be scoped, revocable, attributable, and checked at the publication boundary.

## 8. 2D and VR parity

The first implementation is 2D, but it preserves domain interaction semantics:

| Domain action | 2D manifestation | Future spatial manifestation |
|---|---|---|
| Acquire object | Drag from inventory bin | Reach into physical bin |
| Place or connect | Drop onto canvas/port | Place or connect by hand |
| Inspect | Inspector/worktable | Examine object or station |
| Preview | Embedded simulation | Enter the environment |
| Compare | Side-by-side candidate views | Move between candidate projections |
| Adopt | Explicit revision action | Explicit diegetic confirmation |

VR can change scale, reach, spatial arrangement, and embodiment without changing the meaning of the underlying operation.

## 9. CiAi integration

Workshop should expose a versioned structured engineering stream to CiAi, not screenshots or UI automation. Events should carry stable IDs, sequence numbers, correlation IDs, schema versions, provenance, and source/revision references. Reconnect/resume must not silently lose events.

The stream can describe intent, workspace/tool sessions, artifact revisions, experiments, verification evidence, and review decisions. CiAi remains the development and orchestration system. Verification and human approval remain distinct gates; neither implies merge, publication, deployment, or release.

## 10. Persistence and prepared composition

Workshop's logical state is domain-owned. DataWarehouse may provide the internal storage substrate; FSM_Serialization remains a binary boundary (`IBinaryStream`, `IBinaryPackable.Pack`, `IBinaryUnpackable.Unpack`), not a general object-graph serializer or application persistence framework.

The Experience manifest declares participating MicroBundles, exact versions, and explicit sequence. Each MicroBundle supplies safe defaults for its pinned version. Experience configuration stores only sparse overrides, addressed by stable author-assigned parameter IDs. Missing overrides inherit the exact version's defaults; they do not mean "guess" or "use whatever the latest version says".

After arbitration converges, Workshop can serialize a compact prepared-composition artifact beside the manifest. It records the validated derived result and sufficient version/provenance/integrity data to load it without repeating editor-only discovery and arbitration. It is a derived build artifact, not a replacement for the manifest or source MicroBundles. Any relevant input change invalidates it.

FSM_Serialization's ByteStream/stream abstractions should allow efficient writing to memory buffers, files, or transport streams without storage/HTTP assumptions in the domain model. Use deterministic encodings, explicit schema versions, bounds/integrity validation, and compression only where benchmarks show a net benefit. Corrupt or incompatible payloads fail closed.

A durable workspace design should also distinguish coherent versioned snapshots, append-only events, immutable artifact revisions, experiment records, explicit authorization/decision records, and CiAi evidence tied to exact source and artifact revisions.

## 11. First implementation vertical slice

1. A 2D Workshop shell with discoverable studio stations.
2. A tool-definition contract independent of rendering.
3. A Cosmos Studio inventory and live candidate-system projection.
4. A Forge with typed state/transition ingots and slot validation.
5. An FSM holodeck projection driven by runtime/inspection contracts.
6. Isolated preview/experiment and explicit revision adoption.
7. Tests for capability boundaries, invalid slot connections, baseline immutability, and publication authorization.
8. A versioned editor-time composition plan and a minimal deterministic arbitration vertical slice, including proposal rejection and prepared-artifact invalidation.

This is an architectural foundation, not a claim that downstream physics, astronomy, FSM runtime, dynamic dependency loading, proposal negotiation, or security contracts have already been implemented.

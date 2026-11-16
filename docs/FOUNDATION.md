# Workshop Foundation

## 1. The central abstraction

Workshop is an Experience whose environment hosts authoring tools. It is not a monolithic editor. It discovers tools contributed by MicroBundles and composes them into workspaces.

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

## 3. Cosmos Studio

### Inventory and system canvas

Inventory entries represent typed celestial bodies: stars, planets, moons, asteroids, black holes, and future body types. A body definition carries physical parameters and provenance; it is not merely a model asset.

The suspended system visualization is a live projection of the current candidate. Dragging a body from inventory, replacing a star, or changing an orbit invokes domain operations and recalculates dependent results.

The visualization must distinguish physical values and units; display scale from physical scale; measured values from assumptions; and stable results from uncertain analysis.

### Habitability

A habitable region is not a universal green ring. It is a computed result with explicit assumptions and model versions. Analysis should account for stellar luminosity and spectrum, orbital distance and eccentricity, atmospheric assumptions, tidal effects where relevant, and the selected definition of habitability.

Planetary moons are first-class candidate worlds. Assessment may include host-planet illumination, eclipses, tidal heating, orbital stability, and radiation environment. Results are ranges and evidence, not an unconditional promise that life exists.

### Planetary worktables

A selected planet or moon can be taken to a worktable. Maps, globes, and specialized editors are domain tools contributed by appropriate MicroBundles. Editing creates a candidate revision; the baseline remains available until adoption.

## 4. The Forge

FSMs are authored through tangible, typed components.

- **State ingot:** defines a state identity and associated state data/behavior.
- **Transition ingot:** defines a directed relationship between source and destination states, with optional guards, triggers, and actions.
- **Slots:** typed ports declaring what must be supplied. A slot may accept text, a reference to another ingot, a typed value, or a domain-contributed object.

The slot contract describes type, cardinality, validation rules, and whether it is required. A visual connection is valid only when underlying contracts are compatible.

The Forge maintains an explicit graph of ingots and connections. It reports missing required slots, invalid references, unreachable states, ambiguous transitions, and diagnostics supplied by the FSM domain. Incomplete or invalid constructions must never appear as verified executable systems.

### Holodeck

The holodeck is an execution-oriented projection of an assembled FSM. It lets a creator enter the running model, observe the active state, inspect available transitions, select relevant aspects, and understand why a transition did or did not fire.

The holodeck is not authoritative for FSM semantics. The FSM runtime remains authoritative; the holodeck visualizes and interacts through its supported inspection/control contract.

## 5. Hermit and experiments

Hermit amplifies exploration without taking ownership away from the creator.

An experiment captures the exact baseline revision and configuration, creates an isolated candidate, applies a bounded parameter change or sweep, records inputs/seed/tool/model versions/resource use/outputs, supports cancellation and comparison, and can be discarded or deliberately adopted as a new revision.

Experiments must not mutate the baseline. Adoption is an explicit creator action.

## 6. Authoring and security

The ecosystem is open to authoring. Developers may create Experiences, MicroBundles, and domain-specific editor Experiences. A dungeon editor, for example, may edit dungeon content under the content owner's permissions.

Capabilities must be separated: author Experience; author MicroBundle; create or edit owned/authorized content; execute or preview; export artifact; publish to a particular server/target.

Publishing to Workshop-controlled or user-controlled servers is a distinct, server-owner-controlled authorization. No authoring, editing, execution, or export capability implies publication permission. Grants should be scoped, revocable, attributable, and checked at the publication boundary.

## 7. 2D and VR parity

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

## 8. CiAi integration

Workshop should expose a versioned structured engineering stream to CiAi, not screenshots or UI automation. Events should carry stable IDs, sequence numbers, correlation IDs, schema versions, provenance, and source/revision references. Reconnect/resume must not silently lose events.

The stream can describe intent, workspace/tool sessions, artifact revisions, experiments, verification evidence, and review decisions. CiAi remains the development and orchestration system. Verification and human approval remain distinct gates; neither implies merge, publication, deployment, or release.

## 9. Persistence boundary

Workshop's logical state is domain-owned. DataWarehouse may provide the internal storage substrate; FSM_Serialization remains a binary boundary (IBinaryStream, IBinaryPackable.Pack, IBinaryUnpackable.Unpack), not a general object-graph serializer or application persistence framework.

A durable workspace design should distinguish coherent versioned snapshots, append-only events, immutable artifact revisions, experiment records, explicit authorization/decision records, and CiAi evidence tied to exact source and artifact revisions.

Restoration should validate versions and integrity and fail closed for unsupported or corrupt state.

## 10. First implementation vertical slice

1. A 2D Workshop shell with discoverable studio stations.
2. A tool-definition contract independent of rendering.
3. A Cosmos Studio inventory and live candidate-system projection.
4. A Forge with typed state/transition ingots and slot validation.
5. An FSM holodeck projection driven by runtime/inspection contracts.
6. Isolated preview/experiment and explicit revision adoption.
7. Tests for capability boundaries, invalid slot connections, baseline immutability, and publication authorization.

This is an architectural foundation, not a claim that downstream physics, astronomy, FSM runtime, or security contracts have already been implemented.

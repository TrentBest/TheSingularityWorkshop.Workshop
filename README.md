# TheSingularityWorkshop.Workshop

**Workshop is the authoritative Experience Trent intends to build: an Experience for creating Experiences and MicroBundles.**

It is a persistent, extensible authoring environment: tools are discovered from the capabilities they represent, presented first through 2D facades, and eventually embodied as diegetic spatial tools in VR.

> Workshop is not a menu of editors. It is a place where domain concepts become things you can handle, arrange, inspect, test, negotiate, and enter.

## First manifestation

The initial 2D workbench demonstrates two domain studios:

- **Cosmos Studio** — celestial-body bins, a live orbital system, stellar replacement, planetary worktables, and habitability analysis.
- **The Forge** — state and transition ingots, typed slots, assembled finite-state machines, and a holodeck for entering and inspecting behavior.

Open [the Workshop prototype](index.html) or explore the [Hermit handling-floor prototype](hermit.html).

## Core principles

1. **Domain-first tools.** A tool's meaning and operations are independent of whether it is rendered on desktop, in a 2D panel, or in VR.
2. **Diegetic interaction.** Objects, bins, tables, ingots, slots, instruments, and environments are meaningful representations—not decorative skins over unrelated forms.
3. **Discoverable tooling.** MicroBundles may contribute generic or specialized tools. Workshop discovers and hosts them through explicit contracts.
4. **Workshop as the canonical Experience.** Workshop is the authoritative meta-authoring Experience in this ecosystem. The ecosystem remains open: others may create their own Experiences, authoring environments, MicroBundles, and tools. They do not thereby become Workshop or gain authority over Workshop-controlled content.
5. **Pre-arbitration.** MicroBundles are loaded into an editor composition, prepare candidate definitions, then participate in ordered editor-time arbitration. Their interactions can enrich the Experience before runtime, without bespoke integration code between every pair of bundles.
6. **Separate publication authority.** Creating, editing, executing, and exporting artifacts do not grant permission to publish to someone else's servers. Server publication is separately scoped and controlled by the server owner.
7. **Reversible exploration.** Experiments operate on isolated candidates. Authored state remains intact until a creator deliberately adopts a result.
8. **Inspectable execution.** Previewing an authored system should let its creator enter, observe, select, and inspect the running domain.

## Architecture direction

- Workshop is itself an Experience, composed through the Experience/MicroBundle ecosystem.
- A tool is defined by domain operations and data contracts, not by its presentation medium.
- MicroBundles can contribute tool definitions, domain objects, inspectors, preview capabilities, and editor-time arbitration behavior.
- Workshop supplies discovery, workspace composition, authoring sessions, pre-arbitration, review surfaces, experiment isolation, revision/adoption, and prepared-composition generation.
- Domain systems own their semantics. Cosmos Studio owns celestial-system concepts; the Forge owns FSM authoring concepts; Physics owns physical/material reasoning.
- The Experience manifest pins participating MicroBundle identities and versions in an explicit sequence. A validated prepared-composition artifact records the result of editor-time arbitration and can accompany the manifest.
- FSM_COS composes MicroBundles; FSM_Foundry executes them.
- Renderer and Visualize are consumed as MicroBundles, not NuGet packages.

## Domain studios

### Cosmos Studio

A physical inventory of stars, planets, moons, asteroids, black holes, and other bodies feeds a live, scaled visualization. Replacing a star is a real system edit: the system recalculates affected orbits, energy, stability, and candidate habitable regions. Planetary worktables expose maps, globes, and domain-specific editing tools. A moon orbiting a planet is evaluated as its own candidate world, including the planet's influence.

The displayed scale is a visualization choice, not a claim that every astronomical distance can be represented literally in the room. The studio must communicate scale, units, and model assumptions.

### The Forge

FSMs are assembled from state and transition ingots. Slots represent typed requirements: text, references to other parts, conditions, actions, or domain-defined values. The assembled graph is inspectable, and the holodeck provides an execution-oriented view in which users can enter and observe states and transitions.

## Creator's Floor

Explore the [diegetic creator workspace prototype](creator-workspace.html), the [IDiegeticGUI composition contract](docs/DIEGETIC_GUI_COMPOSITION.md), and the [host-side composition reference core](diegetic-composition.js) with its [acceptance tests](diegetic-composition.tests.html). The reference core validates resolved provider declarations, typed ports, trust, creator-approved connections, provenance, stale proposals, and unload cleanup. It is a JavaScript contract/test surface—not a compiled MicroBundleDomain/FSM_COS adapter—and the floor still uses local fixtures.

## Hermit

Hermit is Workshop's creative assistant: it enters bounded environments through host-provided shells, observes available capabilities, proposes inspectable experiments, and explains outcomes without silently changing the creator's baseline.

- [Hermit architecture and safety contract](docs/HERMIT.md)
- [Hermit integration map](docs/HERMIT_INTEGRATION.md)
- [Handling-floor prototype](hermit.html)
- [Deterministic core acceptance tests](hermit-core.tests.html)

The browser core is a reference implementation and test surface—not a trusted security boundary. Production authorization, cancellation, quotas, and invocation must be enforced by the host. Physics and Gestures adapters are not yet connected.

## Security boundary

Authoring and server publication are distinct capabilities. A developer may create an editor Experience that edits their own dungeon, terrain, or simulation content. That does not confer publication rights to Workshop-controlled hosting infrastructure. Publication requires explicit, scoped authorization from the relevant server owner.

## Development

The development branch is the active source branch. The first milestone is to turn the 2D design slice into domain-backed MicroBundle tooling while keeping interaction semantics portable to VR.

- [Architectural foundation](docs/FOUNDATION.md)
- [MicroBundle tooling integration study](docs/CONTRACT_INTEGRATION.md)
- [Editor-time MicroBundle arbitration](docs/EDITOR_TIME_ARBITRATION.md)

# Diegetic GUI composition in Workshop

**Status:** Workshop architecture and interaction prototype. `IDiegeticGUI` is the proposed provider seam described here; it is not yet an interface found in the current MicroBundleDomain, FSM_COS, or GUI repositories. The prototype does not load executable MicroBundles.

## The creator's Workshop

Workshop is the canonical creator environment: an Experience whose purpose is to create other Experiences and MicroBundles. It is not a collection of unrelated editor windows. It is a diegetic workspace in which domain tools become stations, instruments, objects, work surfaces, previews, and connected systems.

Workshop itself is composed from MicroBundles. Its built-in creator environment provides the host, the composition floor, the trust boundary, the authoring session, and the publication boundary. Domain-specific tooling is contributed by loaded MicroBundles.

## The proposed provider flow

1. The creator loads a MicroBundle into the current Workshop composition.
2. The composition host resolves the exact MicroBundle identity and version, dependencies, trust policy, and declared providers.
3. Workshop inspects the provider catalogue for the `IDiegeticGUI` contract.
4. When present, Workshop resolves the provider through the host's typed provider mechanism. Provider IDs remain opaque identifiers; Workshop must not guess from names or reflect over arbitrary types.
5. The provider describes one or more diegetic tool contributions: stable identity, title/meaning, domain contract, supported operations, input/output ports, configuration schema, and required capabilities.
6. Workshop validates the contribution and places its stations, tools, and ports into the creator's workspace.
7. The creator can connect compatible contributions. Connections are explicit, typed, inspectable, version-pinned, and reversible.
8. The creator authors either a MicroBundle or an Experience. Workshop validates and prepares the resulting composition; it does not silently publish it.

The provider contributes tools; it does not own the Workshop host. Workshop retains authority over discovery, lifecycle, placement, input routing, capability grants, session state, persistence, and unload.

## Separate the four concerns

| Concern | Owner |
|---|---|
| Domain meaning, operations, constraints, and results | Contributing domain MicroBundle |
| Tool contribution description and ports | Proposed `IDiegeticGUI` provider contract |
| 2D, spatial, VR, textual, and accessibility manifestation | GUI / presentation host |
| Composition, workspace, connections, sessions, approval, revision, and adoption | Workshop |

A diegetic tool must not bake its domain semantics into a particular 2D panel or VR prop. The same contribution should be manifestable through different presentations while preserving operation identity and typed ports.

## Creator identity and tool-to-tool connections

Every contribution is attributed to its source MicroBundle, exact version, provider identity, and creator/publisher identity. A workspace connection records both endpoint identities and versions, port identities and schemas, mapping/transformation identity, and the creator's decision to connect them.

Workshop may offer convenient composition among tools belonging to the same creator, but matching creator identity is not permission to connect automatically. The creator still sees and approves the proposed connection. Cross-creator connections require explicit compatibility and trust policy; a provider cannot claim another creator's ports or mutate another contribution's authored baseline.

Connections are staged candidates. They can be inspected, tested in isolation, rejected, revised, or adopted. A visual wire is not proof of semantic compatibility: the domain contracts and host validators decide whether the connection is valid.

## Provider and lifecycle requirements

The eventual contract should be additive to the existing MicroBundleDomain contracts and should not duplicate their identity, dependency, provider, or lifecycle types.

A provider contribution needs, at minimum:

- stable contribution and provider identities;
- exact source MicroBundle identity and version;
- human-readable description plus domain contract identity/version;
- typed operations and input/output ports;
- configuration fields addressed by author-assigned stable parameter IDs;
- declared required capabilities and trust requirements;
- supported presentation hints, not presentation-owned semantics;
- deterministic validation and diagnostics;
- lifecycle hooks or host-managed sessions with cancellation and bounded resource use;
- explicit disposal/unload behavior;
- provenance for every authored or derived change.

Provider discovery is not execution authorization. A provider being present does not grant it access to the creator's workspace, another bundle's state, external services, publication, or arbitrary host APIs. Workshop resolves capabilities and enforces scoped grants at the host boundary.

Do not execute provider-supplied HTML/JavaScript as an implicit UI contract. Providers describe typed tools and operations; the host renders them. Any future extension mechanism for custom presentation code must be separately sandboxed, permissioned, versioned, and audited.

## How this relates to current composition contracts

The current Workshop integration study records the verified MicroBundleDomain surfaces: descriptor/provider identity, `IMicroBundle`, load context, arbitration context, definitions, fields, and stable parameter IDs. Provider IDs are opaque. Current Workshop has no compiled .NET adapter, and the existing HTML is a prototype.

FSM_COS resolves and loads the declared dependency graph, invokes each bundle's load entry point once, runs bounded editor-time arbitration, and exposes typed bundle lookup after composition. The current load context does not provide dynamic dependency requests or typed access to another bundle during `Load`. Workshop must consume these contracts and coordinate any required additive evolution with their owners; it must not invent a competing MicroBundle lifecycle.

The practical integration sequence is:

1. Define the minimal typed `IDiegeticGUI` contribution contract with MicroBundleDomain/host owners.
2. Confirm how the provider is declared and resolved through the existing descriptor and runtime assembly.
3. Build a Workshop adapter that discovers providers only after the composition host has resolved the exact bundle graph.
4. Validate and mount contributions into an isolated workspace session.
5. Add typed port compatibility and explicit creator-approved connections.
6. Persist workspace layout and connection choices as Workshop-owned authored state, not as mutation of the source MicroBundles.
7. Generate either a MicroBundle or Experience composition from the validated candidate.
8. Test missing providers, incompatible versions, duplicate identities, untrusted bundles, malformed schemas, denied capabilities, cancellation, unload, and baseline preservation.

## Hermit and the workforce

Hermit resides in Workshop as the creator's persistent, full-size embodied assistant. Hermit helps interpret goals, inspect the workspace, propose experiments, and explain evidence. The creator remains the author and decision-maker.

Mini Hermits and Titan Hermits are manifestations of actual bounded work, not separate creator identities:

- **Mini Hermits** are one-third Hermit's size. They dramatize large coordinated construction workloads—such as many small tasks involved in assembling or preparing loaded MicroBundles.
- **Titan Hermits** are three times Hermit's size. They dramatize rare heavy operations and large-scale transformations.
- **One personal full-size Hermit per developer** remains the rule. Mini and Titan forms do not create a crowd of competing full-size assistants.

The visual workforce must be tied to real task records, progress, and evidence. It should never claim a MicroBundle was built, validated, or loaded merely because an animation played. GOAP is a suitable direction for routine task choreography; LLM reasoning should be reserved for ambiguity, planning, and explanations where it adds value.

## Prototype boundary

[`creator-workspace.html`](../creator-workspace.html) is an interaction study. It uses local fixture metadata to demonstrate loading a bundle card, discovering a declared diegetic GUI contribution, mounting a tool station, connecting compatible ports, and choosing an output target. It does not load a real MicroBundle, call FSM_COS, instantiate `IDiegeticGUI`, execute domain operations, persist a composition, or publish artifacts.

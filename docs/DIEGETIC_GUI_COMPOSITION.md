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

## Diegetic unload and departure choreography

Package unload is a real host lifecycle transition first and a presentation opportunity second. The host must not leave a package executable merely so Hermit can finish a scene.

The intended sequence is:

1. **Quiesce:** the host marks the exact package identity/version as unloading, rejects new invocations, and detaches its input routes.
2. **Revoke and drain:** the host revokes package-scoped capabilities, cancels outstanding work, and waits for or terminates in-flight operations according to the package's bounded shutdown contract.
3. **Capture a presentation proxy:** before disposing the provider, the host captures only the approved, non-executable visual description needed for a departure vignette—such as the diegetic GUI's silhouette, scale, theme, and safe interaction bounds. This proxy is not a live provider and exposes no package capabilities.
4. **Dispose:** the host disposes provider sessions and unloads the package through the actual FSM_COS lifecycle. Resource release and unload success are determined by the host, never by animation.
5. **Stage the departure:** Hermit may choose a permitted vignette from the host's presentation catalogue. The titan may stomp a detached menu proxy; minis may rig and tow it through a pocket doorway; or a deliberately over-the-top cartoon demolition effect may clear it away. The scene is presentation-only and cannot call back into the unloaded package.
6. **Reconcile:** the host records the actual unload result independently of the vignette result. If presentation fails, is skipped, or is cancelled, package unload remains complete and the visual proxy is simply discarded.

Hermit's freedom belongs in **selection and choreography**, not lifecycle authority. The host supplies the available presentation actors/effects, spatial bounds, time/resource budget, cancellation, and policy constraints. Hermit can compose those ingredients creatively, including choosing a quiet exit or no scene at all. A creator preference may tune tone, intensity, and duration; it must not silently grant new package permissions.

The C4-style gag is a cartoon VFX treatment of a disposable interface proxy—not a physical explosive simulation, a real-world instruction, or destruction of the package's data. Any actual data retention/deletion, filesystem changes, capability revocation, and runtime disposal remain explicit host operations with their own audit evidence.

This keeps the diegetic world expressive without making an animation the source of truth: a package is already unavailable before its farewell begins, and the host can prove whether it was actually unloaded.

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

## Prototype and reference-core boundary

[`creator-workspace.html`](../creator-workspace.html) is an interaction study. It uses local fixture metadata to demonstrate loading a bundle card, discovering a declared diegetic GUI contribution, mounting a tool station, connecting ports, and choosing an output target. It does not load a real MicroBundle, call FSM_COS, instantiate `IDiegeticGUI`, execute domain operations, persist a composition, or publish artifacts.

[`diegetic-composition.js`](../diegetic-composition.js) is a host-side JavaScript reference core. It accepts already-resolved bundle descriptors and a host-supplied provider resolver; it does not fetch bundles, execute provider-supplied UI code, or implement the missing .NET provider contract. It validates opaque provider identity/version, publisher trust, required host capability grants, stable tool/port identities, typed port schema compatibility, cross-creator trust, exact creator approval, revision-bound proposals, provenance, and unload cleanup. Its deterministic browser acceptance suite is [`diegetic-composition.tests.html`](../diegetic-composition.tests.html).

This is executable reference behavior and a testable contract shape, not a production security boundary. A production host must enforce trust, capability grants, isolation, quotas, cancellation, and lifecycle in its own trusted process. The next implementation boundary is the real MicroBundleDomain provider declaration/resolution seam and FSM_COS preparation-time capability access. Those changes require coordinated work in their repositories; Workshop now has a runnable host-side reference target against which that integration can be built and tested.

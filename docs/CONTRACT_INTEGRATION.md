# MicroBundle Tooling Integration

**Status:** Integration contract study  
**Scope:** Workshop authoring and tool discovery  
**Authority:** The current MicroBundleDomain contracts are authoritative. This document does not introduce replacement runtime or editor contracts.

## 1. Verified contract surfaces

The current MicroBundleDomain development branch exposes two complementary surfaces:

| Surface | Existing contract | Workshop use |
|---|---|---|
| Runtime identity and capability | `MicroBundleDescriptor` | Identify a capability and inspect its declared dependencies and providers |
| Executable lifecycle | `IMicroBundle` | Understand the load and arbitration boundary; Workshop does not replace the composition host |
| Editor description | `MicroBundleDefinition` | Inspect a capability's configurable structure without executing it |
| Editable fields | `MicroBundleField` | Inspect semantic field kinds: String, Integer, Float, Boolean, Object |
| Stable parameter identity | `MicroBundleField.ParameterId` | Address an authored parameter independently of its display name or nesting path |
| Field authoring | `MicroBundleFieldBuilder` | Construct fields with explicit IDs, defaults, numeric ranges, and nested children |

The descriptor's provider IDs are intentionally opaque. MicroBundleDomain does not decide what a provider means or how a host manifests it.

A definition's fields describe configuration; they are not, by themselves, a complete tool contribution or UI layout contract. Field names are human-readable labels, not stable identities. Development source adds optional author-assigned `ParameterId` values and `HasStableParameterIds` on the definition. IDs must be explicitly assigned by the capability author, remain unchanged when a field is renamed or moved, and be unique across the complete nested definition. Workshop must not manufacture IDs from names, paths, or array positions.

Legacy fields without IDs remain readable, but Workshop must not treat their names or paths as durable parameter identity. A definition is suitable for identity-stable editing only when `HasStableParameterIds` is true.

## 2. Verified target and package boundary

The MicroBundleDomain `development` project currently targets `.NET 10.0`, enables nullable reference types and implicit usings, and declares package version `1.0.1`. The `master` project still targets `.NET 8.0`; Workshop integration work must follow the active development contract and ecosystem migration, not infer the active target from the released branch or older getting-started prose.

The authoritative NuGet profile currently lists `TheSingularityWorkshop.MicroBundleDomain` version `1.0.1` as its latest package, targeting `.NET 8.0` and last updated `2026-10-03`. This is not sufficient evidence that the published package contains the later development-source API, including stable parameter identity. A matching package version string does not prove source/binary parity.

**Integration gate:** before adding a package reference, inspect the actual published package API and prove it exposes the required stable-identity members. If it does not, Workshop must wait for a compatible package release or use an explicitly approved source-integration strategy. Do not add a parallel copy of MicroBundleDomain types, fabricate parameter IDs, or claim the adapter is complete against the older package. Workshop must not publish or release the dependency.

Workshop currently has no .NET project or compiled adapter in this repository. Its current `index.html` is a static prototype. Therefore, the contract work here is documentation and prototype-level only; it does not claim a compiled .NET 10 integration.

## 3. Workshop integration rule

Workshop must consume these contracts rather than create a parallel MicroBundle identity, dependency, provider, or configuration model.

The first adapter should:

1. Read a MicroBundle's stable identity and version from its descriptor.
2. Treat provider IDs as opaque capability identifiers.
3. Read editable configuration from its MicroBundleDefinition.
4. Preserve each author-assigned ParameterId exactly; never derive one from a label, path, or position.
5. Require stable parameter IDs before treating an editable definition as a durable, revision-safe parameter surface; allow legacy inspection without pretending names are stable IDs.
6. Map field kinds to host-neutral editing intents.
7. Traverse nested Object fields recursively while preserving each field's identity.
8. Let a 2D or VR manifestation choose its own controls and spatial arrangement.
9. Keep domain validation and runtime behavior with the capability owner.
10. Keep dependency resolution and composition with FSM_COS.

Workshop must not infer that a provider ID automatically names a complete editor, nor assume that configuration fields describe every interaction the capability supports.

## 4. The missing seam: discoverable tool contributions

The current contracts support capability discovery and configuration inspection, but the inspected API does not yet define a complete, first-class tool contribution contract containing such things as:

- a stable tool identity and contract version;
- the provider or capability it operates on;
- supported authoring operations;
- input/output or selection semantics;
- validation and diagnostic contribution points;
- optional preview/inspection behavior;
- localization and presentation hints, if needed.

Stable parameter IDs solve parameter identity; they do not solve tool identity, operations, interaction semantics, or discovery. This remains an identified integration gap, not a reason for Workshop to invent a competing runtime contract.

The next contract-design step belongs with the MicroBundleDomain owner: determine whether tool contributions should be represented as an additive editor-facing description surface, provider metadata, or a separate companion contract. Preserve the existing runtime and definition contracts and their host-neutral character.

## 5. Authoring and publication remain separate

Tool discovery does not grant authority over content or infrastructure.

- A developer may create an Experience, MicroBundle, or editor Experience.
- A content editor may modify content only within the content owner's granted permissions.
- Creating, editing, validating, previewing, or exporting an artifact does not publish it.
- Publishing to a controlled server is a distinct operation requiring explicit authorization from that server's owner.
- Workshop must never treat a tool's presence, a successful build, or a valid composition as publication authorization.

These are separate capability and authorization decisions. A UI affordance is not an authorization boundary; the enforcing host/server must validate the request.

## 6. 2D and VR parity

A tool contribution describes semantic operations, not a particular widget or physical prop.

For example, a numeric parameter may appear as a 2D slider, a numeric field, or a diegetic control surface in VR. All manifestations edit the same domain-owned value through the same validated operation and address it by its stable ParameterId.

The visual metaphor (including ingots, bins, tables, globes, and spatial panels) must not become the source of truth.

## 7. Acceptance criteria for the first real adapter

- [ ] Workshop can inspect a real `MicroBundleDefinition` without loading or executing the bundle.
- [ ] Stable bundle identity and version are preserved exactly.
- [ ] Provider IDs remain opaque; no domain-specific branching is added to the Workshop shell.
- [ ] Definitions with stable parameter IDs preserve those IDs exactly through inspection, draft editing, serialization, and revision.
- [ ] Legacy definitions without parameter IDs can be inspected but are not silently assigned fabricated stable identities.
- [ ] All five current field kinds have deterministic 2D control mappings.
- [ ] Nested Object fields are traversed recursively.
- [ ] Unsupported field kinds or malformed definitions fail visibly and safely.
- [ ] Domain validation remains authoritative; UI constraints are not treated as security validation.
- [ ] Editing a draft does not mutate the source definition or published artifact.
- [ ] The same semantic edit operation can be manifested by a future VR adapter.
- [ ] No create/edit/export path implicitly grants server publication authority.

## 8. Evidence and implementation boundary

This integration study was checked against the `development` branch source for `TheSingularityWorkshop.MicroBundleDomain.csproj`, `MicroBundleDefinition.cs`, `MicroBundleFieldBuilder.cs`, `MicroBundleDescriptor.cs`, and `IMicroBundle.cs`, plus its getting-started documentation. The project target and parameter-identity contract are branch-specific and should be rechecked when the dependency evolves. Published package metadata was checked against the TheSingularityWorkshop NuGet profile on 2026-11-19.

It is a Workshop integration plan, not a claim that a live adapter, runtime tool registry, astronomy engine, FSM Forge, permission service, or publication service already exists.

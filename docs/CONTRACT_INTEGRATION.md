# MicroBundle Tooling Integration

**Status:** Integration contract study  
**Scope:** Workshop authoring and tool discovery  
**Authority:** The current MicroBundleDomain contracts are authoritative. This document does not introduce replacement runtime or editor contracts.

## 1. Existing contract surfaces

The current MicroBundleDomain exposes two complementary surfaces:

| Surface | Existing contract | Workshop use |
|---|---|---|
| Runtime identity and capability | `MicroBundleDescriptor` | Identify a capability and inspect its declared dependencies and providers |
| Executable lifecycle | `IMicroBundle` | Understand the load and arbitration boundary; Workshop does not replace the composition host |
| Editor description | `MicroBundleDefinition` | Inspect a capability's configurable structure without executing it |
| Editable fields | `MicroBundleField` | Build controls from semantic field kinds: String, Integer, Float, Boolean, Object |

The descriptor's provider IDs are intentionally opaque. MicroBundleDomain does not decide what a provider means or how a host manifests it. The definition's fields describe configuration; they are not, by themselves, a complete tool contribution or UI layout contract.

## 2. Workshop integration rule

Workshop must consume these contracts rather than create a parallel MicroBundle identity, dependency, provider, or configuration model.

The first adapter should:

1. Read a MicroBundle's stable identity and version from its descriptor.
2. Treat provider IDs as opaque, stable capability identifiers.
3. Read editable configuration from its MicroBundleDefinition.
4. Map field kinds to host-neutral editing intents.
5. Let a 2D or VR manifestation choose its own controls and spatial arrangement.
6. Keep domain validation and runtime behavior with the capability owner.
7. Keep dependency resolution and composition with FSM_COS.

Workshop must not infer that a provider ID automatically names a complete editor, nor assume that configuration fields describe every interaction the capability supports.

## 3. The missing seam: discoverable tool contributions

The current contracts support capability discovery and configuration inspection, but the inspected API does not yet define a complete, first-class tool contribution contract containing such things as:

- a stable tool identity and contract version;
- the provider or capability it operates on;
- supported authoring operations;
- input/output or selection semantics;
- validation and diagnostic contribution points;
- optional preview/inspection behavior;
- localization and presentation hints, if needed.

This is an identified integration gap, not a reason for Workshop to invent a competing runtime contract.

The next contract-design step belongs with the MicroBundleDomain owner: determine whether tool contributions should be represented as an additive editor-facing description surface, provider metadata, or a separate companion contract. Preserve the existing runtime and definition contracts and their host-neutral character.

## 4. Authoring and publication remain separate

Tool discovery does not grant authority over content or infrastructure.

- A developer may create an Experience, MicroBundle, or editor Experience.
- A content editor may modify content only within the content owner's granted permissions.
- Creating, editing, validating, previewing, or exporting an artifact does not publish it.
- Publishing to a controlled server is a distinct operation requiring explicit authorization from that server's owner.
- Workshop must never treat a tool's presence, a successful build, or a valid composition as publication authorization.

These are separate capability and authorization decisions. A UI affordance is not an authorization boundary; the enforcing host/server must validate the request.

## 5. 2D and VR parity

A tool contribution describes semantic operations, not a particular widget or physical prop.

For example, a numeric parameter may appear as a 2D slider, a numeric field, or a diegetic control surface in VR. All manifestations edit the same domain-owned value through the same validated operation.

The visual metaphor (including ingots, bins, tables, globes, and spatial panels) must not become the source of truth.

## 6. Acceptance criteria for the first real adapter

- [ ] Workshop can inspect a real `MicroBundleDefinition` without loading or executing the bundle.
- [ ] Stable bundle identity and version are preserved exactly.
- [ ] Provider IDs remain opaque; no domain-specific branching is added to the Workshop shell.
- [ ] All five current field kinds have deterministic 2D control mappings.
- [ ] Nested Object fields are traversed recursively.
- [ ] Unsupported field kinds or malformed definitions fail visibly and safely.
- [ ] Domain validation remains authoritative; UI constraints are not treated as security validation.
- [ ] Editing a draft does not mutate the source definition or published artifact.
- [ ] The same semantic edit operation can be manifested by a future VR adapter.
- [ ] No create/edit/export path implicitly grants server publication authority.

## 7. Evidence and implementation boundary

This integration study was checked against the current `MicroBundleDefinition.cs`, `MicroBundleDescriptor.cs`, and `IMicroBundle.cs` in TheSingularityWorkshop.MicroBundleDomain, plus its Architecture and Knowledge Model documentation.

It is a Workshop integration plan, not a claim that a live adapter, runtime tool registry, astronomy engine, FSM Forge, permission service, or publication service already exists.

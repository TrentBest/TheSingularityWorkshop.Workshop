# Hermit integration map

**Status:** architecture mapped against the current development sources of GUI, Physics, and Gestures. This document records real seams and gaps; it does not claim that cross-repository adapters already exist.

## Intended composition

~~~text
GUI execution host
  └── Workshop Experience
        ├── creator / review / adoption surfaces
        └── Hermit
              └── host-owned shell and capability adapter
                    ├── Physics providers and authoritative outcomes
                    └── Gestures evaluator and movement intent
~~~

The GUI repository describes the GUI as the outer execution boundary: it resolves capabilities, establishes context, owns lifecycle, routes input, observes execution, and selects manifestation. Its [next contract surface](https://github.com/TrentBest/TheSingularityWorkshop.GUI/blob/development/docs/NEXT_CONTRACT_SURFACE.md) still treats those semantics as contracts to define before expanding Core interfaces. The [nested-experience document](https://github.com/TrentBest/TheSingularityWorkshop.GUI/blob/development/docs/GUI_NESTED_EXPERIENCES.md) explicitly marks recursive hosting as a proposal, not current implementation. Therefore Hermit is currently a Workshop-hosted prototype and reference core—not yet a nested runnable Experience.

## Existing domain seams

### Physics

The Physics repository already exposes two concrete contact MicroBundle providers in Physics/MicroBundles/ContactCapabilityMicroBundles.cs:

| Provider ID | Actual contract |
|---|---|
| physics.contact.sphere-sphere.v1 | Detects sphere–sphere geometric contact from two rigid-body snapshots |
| physics.contact.normal-impulse.v1 | Resolves one active contact using a bounded translational normal impulse |

Other relevant primitives include:

- RigidBodyIntegrator.Advance: deterministic semi-implicit Euler stepping for one unconstrained body with caller-supplied constant world-frame acceleration. It does not apply forces, detect collisions, resolve contacts, or enforce constraints.
- InclinedPlaneSolver.Calculate: analytical frictionless sliding from rest, with forces, acceleration, travel time and final speed. It is a constrained teaching model, not a general contact or rigid-body solver.

See the [Physics capability catalog](https://github.com/TrentBest/TheSingularityWorkshop.Physics/blob/development/docs/PHYSICS_CAPABILITY_CATALOG.md) for the authoritative inventory and limits.

**Not currently established:** a general lifting/rigging solver, dolly route validator, gantry structural/load-envelope validator, or universal manipulation capability. The handling-floor's physics.assess-load, physics.validate-route, physics.validate-gantry, and physics.query-trajectory identifiers are illustrative placeholders, not provider IDs exported by Physics.

### Gestures

The Gestures repository provides a deterministic CPU reference evaluator:

- GestureDefinition contains normalized keyframes and optional semantic anchors.
- GestureEvaluator.EvaluateWithSample evaluates a definition at elapsed time using caller-supplied deterministic variation samples.
- EvaluatedPose contains evaluated named local transforms and a lateral offset.

This is procedure/movement intent. It is not, by itself, a world-space trajectory, a physical-body mapping, a reachability guarantee, applied force, collision result, or achieved state. The [Physics motion handoff](https://github.com/TrentBest/TheSingularityWorkshop.Gestures/blob/development/docs/PHYSICS_MOTION_HANDOFF.md) describes the proposed adapter seam and explicitly says it is not yet a runtime API.

## Required adapter responsibilities

The adapter belongs at the host/composition boundary. Keep Physics independent of Gestures and keep Hermit independent of both domain assemblies.

1. **Discovery:** resolve exact provider IDs and versions from the composed MicroBundle set. A missing provider is unavailable—not silently substituted.
2. **Snapshot:** expose a stable shell/environment identity, revision, read-only domain observations, units, coordinate frames, source identity and evidence class.
3. **Proposal:** Hermit returns a capability ID/version, target identity, typed parameters, assumptions, stop conditions and expected evidence.
4. **Authorization:** the trusted host rechecks capability/version, target, parameters, shell revision, creator identity, approval expiry, replay state, quotas and cancellation at invocation time.
5. **Invocation:** the host calls the resolved provider through its declared contract. A proposal or approval alone never invokes a domain operation.
6. **Outcome:** return provider results and subsequent Physics observations as separate records. Invocation acknowledgement is not proof of achieved state.
7. **Movement:** when Gestures is used, pin the Gesture definition/version, target mapping, deterministic variation sample, duration, time mapping, coordinate frame and units. Physics remains authoritative for achieved physical state and contact.

## Host-owned memory

Hermit's durable memory must be supplied by the trusted host, not browser storage or hidden model state. A memory record needs at least:

- owner/session and scope;
- source and provenance;
- creation and last-validation time;
- confidence/evidence class;
- retention/expiry policy;
- creator visibility, correction and deletion controls;
- links to the experiment and shell revision that justified it.

Memory retrieval is advisory context. It never grants capability, approval, or permission to act.

## Integration gates

- [x] Deterministic browser reference core and acceptance tests.
- [x] Current Physics and Gestures seams inventoried without inventing provider APIs.
- [ ] Trusted host-side authorization and durable replay protection.
- [ ] GUI execution-host contract available for Workshop composition.
- [ ] Physics provider adapter with typed, provenance-bearing observations.
- [ ] Gestures-to-Physics target/time/frame adapter.
- [ ] Host-owned memory store and retention controls.
- [ ] End-to-end tests proving denial, cancellation, evidence provenance, and baseline preservation.

Until those gates are met, the handling-floor remains an inspectable design prototype. It must not claim a physical task succeeded or that a live device was controlled.

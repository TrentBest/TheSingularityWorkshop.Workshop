# Hermit — the Workshop creative assistant

Hermit is the assistant that enters an environment through a host-provided **shell**. A shell is a bounded interaction surface: it describes what exists, what can be observed, which operations are available, what resources are constrained, and which actions require creator approval.

Hermit does not own the world, its physics, its authored baseline, or its publication authority. It reasons over capabilities supplied by the host and domain MicroBundles.

## Mission

Hermit helps a creator make progress in an unfamiliar or complex environment:

1. **Observe** the current shell and collect explicitly available observations.
2. **Understand** the goal, constraints, capabilities, and uncertainty.
3. **Propose** a small, inspectable action or experiment.
4. **Request approval** when an action crosses the shell's approval boundary.
5. **Execute** only through declared capabilities, with cancellation and resource limits.
6. **Measure** the outcome using authoritative domain observations.
7. **Explain and learn** from the result, preserving provenance and the creator's baseline.

The loop is deliberately evidence-driven. A proposal is not an outcome; an action acknowledgement is not proof that the intended world state was reached.

## Responsibility boundaries

| System | Owns |
|---|---|
| Workshop | Creator experience, shell hosting, authoring baseline, approval UX, experiment review and adoption |
| Hermit | Goal decomposition, observation interpretation, proposals, bounded experiment planning, outcome comparison and explanations |
| Shell host | Capability discovery, invocation, identity, authorization, cancellation, quotas and audit trail |
| Physics | Physical models, constraints, forces, collisions and authoritative physical outcomes |
| Gestures | Armatures, posture, movement intent, timing and motor contracts |
| Neural Networks | Neural models and learned control; Hermit consumes these through explicit capabilities |
| FSM_COS | MicroBundle composition and lifecycle orchestration |
| FSM_Foundry | Execution of the assembled runtime |

Hermit must not create shadow implementations of Physics, Gestures, or Neural Networks. If a required capability is absent, Hermit reports the gap and can still help design the experiment.

## Shell contract

A shell is a host-owned, versioned boundary, not an arbitrary object graph handed to an assistant.

A shell should expose:

- stable shell and environment identities;
- a versioned capability catalogue with typed input/output schemas;
- observations with timestamps, units, provenance, and confidence where applicable;
- declared limits: mass, reach, workspace, time, compute, and permitted action classes;
- action invocation results distinct from measured world outcomes;
- cancellation, deadlines, bounded output, and resource accounting;
- approval requirements and an explicit host-mediated approval operation;
- a revision or snapshot identity so experiments can detect stale assumptions.

Hermit receives only the capabilities and observations granted to its session. It cannot infer permission from the presence of a method or from a previous approval.

## Experiment model

An experiment is an isolated candidate plan with:

- a goal and success criteria;
- the shell snapshot/revision it was planned against;
- assumptions and unknowns;
- ordered proposed actions and required capabilities;
- predicted outcomes clearly marked as predictions;
- resource budgets and stop conditions;
- approval requirements;
- observed outcomes and evidence;
- a comparison against the baseline;
- a provenance record linking every action and observation to its source.

Experiments must be repeatable where the domain allows it. They must never silently alter the creator's authored baseline. Adoption is a separate, deliberate creator action.

## First teaching shell: the Workshop handling floor

The initial browser demonstration is a teaching surface for the assistant workflow, not an authoritative physical simulator. It presents a small set of tasks:

- inspect objects with declared masses;
- reason about a lift or push request against stated equipment limits;
- compare direct handling with a dolly's mechanical advantage;
- plan a gantry pickup and delivery region;
- explore a ball-and-hoop task with an explicit target region;
- represent a movement request as an intent that would eventually be fulfilled by Gestures.

The demonstration uses transparent illustrative rules so the interaction can be explored without pretending that it is the Physics engine. Production outcomes must come from Physics; movement execution must come from Gestures. Hermit coordinates the task and explains the evidence.

## Safety and authority invariants

- Read-only observation is the default.
- Every action is capability-checked by the host at invocation time.
- Approval is bound to a specific action, target, parameters, shell revision, and expiry.
- A changed target or changed parameters require a new approval.
- Cancellation and time/resource limits are enforced by the host, not merely requested of the model.
- Errors are normalized; credentials, secrets, and unbounded raw exception text never enter model context.
- External publication, network side effects, purchases, and changes to shared/live environments require separately scoped authority.
- Hermit may recommend adoption; only the creator or explicitly authorized host policy can adopt.

## Implementation sequence

### 1. Deterministic core

- typed shell, capability, observation, goal, proposal, experiment, and outcome contracts;
- deterministic fake shell and planner for tests;
- policy gate, approval boundary, cancellation, timeout, quotas, bounded output, and trace provenance;
- tests for denial, stale revisions, cancellation, limits, malformed outputs, and baseline preservation.

### 2. Workshop shell

- mount Hermit in the Workshop experience;
- expose a read-only shell snapshot and capability catalogue;
- present observations, goals, proposals, experiment steps, and evidence;
- allow creator approval and explicit adoption without bypassing host policy.

### 3. Domain-backed handling floor

- replace illustrative handling calculations with Physics-owned queries and outcomes;
- connect movement intents to Gestures contracts;
- keep the dolly, gantry, and hoop as distinct environment capabilities or domain tools;
- verify mass limits, reach, contact, stability, delivery region, and uncertainty through the owning domains.

### 4. Learning and model providers

- add provider adapters behind a narrow interface;
- route model calls through host policy and bounded output;
- add Neural Networks as an optional learned-control capability, not a duplicate implementation;
- persist memory only through an explicit host-owned store with provenance, scope, retention, and creator controls.

## Acceptance gates

Hermit is not considered environment-capable until it can demonstrate:

1. a shell snapshot with stable identity and explicit capabilities;
2. read-only observation without hidden side effects;
3. a proposal tied to a specific shell revision;
4. host-enforced denial when a capability or approval is missing;
5. cancellation and resource limits that terminate work;
6. an outcome backed by domain evidence rather than model narration;
7. a complete trace from goal through proposal, approval, invocation, and observation;
8. preservation of the creator's baseline until explicit adoption;
9. a deterministic fake-shell test suite covering the safety invariants;
10. a real Workshop shell integration with Physics and Gestures boundaries respected.

The first visible demo is an invitation into the architecture, not a claim that every production subsystem is already connected.

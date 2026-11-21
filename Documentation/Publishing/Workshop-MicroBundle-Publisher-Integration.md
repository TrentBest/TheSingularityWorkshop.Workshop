# Workshop MicroBundle Publisher Integration

## Status

This repository currently has no editor, application host, authoring service, or publishing implementation. This document defines the first integration boundary; it does not claim that a Workshop editor exists.

The validated publisher is the MicroBundleRepository CLI introduced by [MicroBundleRepository PR #41](https://github.com/TrentBest/TheSingularityWorkshop.MicroBundleRepository/pull/41). That CLI publishes portable identity tuples through the repository REST API and requires the Workshop publisher credential.

## Authority and lifecycle

Workshop is the sole authoring and arbitration authority. Publishing is an explicit Workshop editor action over a deliberately selected, validated candidate composition.

The following are not publish triggers:

- Editing or saving a MicroBundle.
- Receiving a MicroBundle update.
- Refreshing repository metadata or cache state.
- Opening, closing, or running an Experience.
- Background synchronization, retries, or startup.

The repository stores and delivers immutable artifacts. It does not arbitrate an Experience, select its MicroBundles, or decide when a player adopts an update.

A successful publish creates/returns a portable identity consisting of ontology, exact version, and SHA-256 content hash. The repository may also return a repository-local numeric binding. The published Experience manifest must pin exact immutable identities. Updating a MicroBundle in the repository must not silently mutate an already-published manifest or force a player update.

## Required publish transaction

1. The editor presents the candidate composition and the exact MicroBundle artifacts/versions that will be published.
2. Workshop validates the composition and resolves every selected artifact to its exact bytes and declared ontology/version.
3. A user explicitly invokes **Publish**. The action is disabled while the candidate is invalid or another publish transaction is active.
4. Workshop obtains the publisher credential from a host-owned secret provider. The secret is never part of the candidate, manifest, command-line arguments, UI state, telemetry, or logs.
5. Workshop invokes the repository publisher through a narrow adapter. The currently validated CLI accepts the credential only through the environment variable MICRO_BUNDLE_REPOSITORY_WORKSHOP_PUBLISHER_KEY; it must not be supplied as an argument.
6. The adapter captures cancellation, exit status, and bounded diagnostics. It must redact credential-like values and must never echo the process environment.
7. Workshop accepts success only after the publisher has confirmed the repository-assigned portable identity and exact artifact read-back. A zero exit code alone is insufficient.
8. Workshop records the returned immutable identity in the authoring/publishing result. The Experience manifest is produced from the validated candidate composition, not from a repository-side selection or arbitration step.

A partial failure must be reported as a failed or indeterminate publish, never as a successful publish. Retrying an immutable identity must rely on the repository's byte-verification/idempotence contract, not on inventing a new version or changing content silently.

## Host integration boundary

Keep the editor independent of process-launch details and secret storage. The initial host should implement narrow abstractions equivalent to:

- **IWorkshopPublisherCredentialProvider**: asynchronously obtains the publisher secret from a host-controlled secret store; returns no secret in diagnostic representations.
- **IWorkshopMicroBundlePublisher**: accepts a validated artifact request and cancellation token; returns the verified portable identity/binding or a typed failure.
- **IWorkshopPublishCoordinator**: enforces the explicit user action, serializes concurrent publish attempts for the same candidate, and reports transaction state to the editor.

The editor should depend on the coordinator, not directly on process launch, HTTP, environment variables, or repository storage APIs.

Prefer a host-native REST adapter with an in-memory authorization header once the validated REST client can be consumed from a compatible, approved dependency graph. Until then, the CLI adapter is the proven transport path. If using it, set the credential only in the child process environment for the lifetime of that invocation, clear inherited environment where practical, and do not place the secret in process arguments. Environment variables are not a perfect isolation boundary against same-user or privileged process inspection; document this residual exposure and revisit it before treating the integration as hardened secret isolation.

## Failure, cancellation, and diagnostics

- Missing credential: fail closed before sending a mutation.
- Repository rejects credential: report authorization failure without retrying with another credential source.
- Network timeout or lost response: report outcome as indeterminate until the identity can be resolved and bytes verified.
- Cancellation before request dispatch: stop without publishing.
- Cancellation after dispatch: stop waiting where safe, but do not claim that the remote mutation was rolled back. Resolve the identity before retrying.
- Invalid candidate, ontology, version, or content: reject before dispatch.
- Read-back mismatch: fail closed; do not mark the artifact published.
- Process launch failure or unexpected exit: return a typed failure with bounded, redacted diagnostics.

Never log the publisher secret, full environment, authorization header, or raw exception data that may contain request headers. User-facing diagnostics should identify the artifact and stage, not expose credentials.

## Acceptance criteria

- [ ] Workshop has an explicit, user-initiated publish action.
- [ ] No background or automatic path can invoke publishing.
- [ ] Candidate composition is validated and arbitrated by Workshop before publication.
- [ ] Publisher credential is retrieved from a host-owned secret provider and is never committed or displayed.
- [ ] Secret is absent from command-line arguments, logs, telemetry, manifests, and diagnostic output.
- [ ] Missing/invalid credentials fail closed.
- [ ] Cancellation and indeterminate network outcomes are represented distinctly.
- [ ] Returned ontology, exact version, and SHA-256 are checked against the selected artifact.
- [ ] Artifact bytes are verified by repository read-back before success is reported.
- [ ] Published Experience manifests pin immutable identities and are not silently rewritten by later repository updates.
- [ ] Tests cover explicit-action gating, secret redaction, cancellation, authorization failure, read-back mismatch, and successful round-trip.

## Deliberate non-goals

This integration does not make the Repository an authority over Workshop, does not give other Experiences Workshop privileges, does not automatically publish on save, does not automatically update published Experiences, and does not define player cache activation. Runtime composition remains the responsibility of FSM_COS using the published manifest; cache/load lifecycle remains with the player/host.

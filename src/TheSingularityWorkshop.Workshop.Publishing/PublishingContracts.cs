using System.Security.Cryptography;

namespace TheSingularityWorkshop.Workshop.Publishing;

/// <summary>
/// Immutable bytes selected by Workshop for one MicroBundle publication.
/// </summary>
public sealed class WorkshopArtifact
{
    private readonly byte[] _content;

    public WorkshopArtifact(string ontology, string version, ReadOnlySpan<byte> content)
    {
        if (string.IsNullOrWhiteSpace(ontology))
            throw new ArgumentException("An ontology is required.", nameof(ontology));
        if (string.IsNullOrWhiteSpace(version))
            throw new ArgumentException("An exact version is required.", nameof(version));
        if (content.IsEmpty)
            throw new ArgumentException("An artifact must contain at least one byte.", nameof(content));

        Ontology = ontology;
        Version = version;
        _content = content.ToArray();
        Identity = new WorkshopMicroBundleIdentity(
            Ontology,
            Version,
            Convert.ToHexString(SHA256.HashData(_content)).ToLowerInvariant());
    }

    public string Ontology { get; }
    public string Version { get; }
    public WorkshopMicroBundleIdentity Identity { get; }
    public int ContentLength => _content.Length;

    /// <summary>Returns a defensive copy of the selected artifact bytes.</summary>
    public byte[] CopyContent() => _content.ToArray();
}

/// <summary>Portable immutable identity for a MicroBundle artifact.</summary>
public sealed record WorkshopMicroBundleIdentity(string Ontology, string Version, string ContentHash);

/// <summary>
/// Secret value supplied by the host credential provider. Its string representation is always redacted.
/// </summary>
public sealed class WorkshopPublisherCredential
{
    private readonly string _value;

    public WorkshopPublisherCredential(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("A non-empty publisher credential is required.", nameof(value));

        _value = value;
    }

    /// <summary>Provides the secret only to the publisher adapter.</summary>
    public string RevealForPublisher() => _value;

    public override string ToString() => "[REDACTED]";
}

/// <summary>Retrieves the Workshop publisher secret from a host-controlled secret store.</summary>
public interface IWorkshopPublisherCredentialProvider
{
    ValueTask<WorkshopPublisherCredential?> GetCredentialAsync(CancellationToken cancellationToken);
}

/// <summary>Publishes an artifact using the Workshop-only repository credential.</summary>
public interface IWorkshopMicroBundlePublisher
{
    Task<WorkshopPublishAttempt> PublishAsync(
        WorkshopArtifact artifact,
        WorkshopPublisherCredential credential,
        CancellationToken cancellationToken);
}

public enum WorkshopPublishStatus
{
    Published,
    Rejected,
    Indeterminate,
    Cancelled,
    Failed
}

public enum WorkshopPublishFailure
{
    None,
    MissingCredential,
    Authorization,
    IdentityMismatch,
    ReadBackMismatch,
    Transport,
    Process,
    Cancelled,
    Busy,
    Unknown
}

/// <summary>Outcome reported by the repository publisher adapter.</summary>
public sealed record WorkshopPublishAttempt(
    WorkshopPublishStatus Status,
    WorkshopMicroBundleIdentity? Identity = null,
    ulong? RepositoryBinding = null,
    WorkshopPublishFailure Failure = WorkshopPublishFailure.None,
    string? Diagnostic = null);

/// <summary>Coordinates one explicitly initiated Workshop publish transaction.</summary>
public sealed class WorkshopPublishCoordinator
{
    private readonly IWorkshopPublisherCredentialProvider _credentials;
    private readonly IWorkshopMicroBundlePublisher _publisher;
    private readonly SemaphoreSlim _gate = new(1, 1);

    public WorkshopPublishCoordinator(
        IWorkshopPublisherCredentialProvider credentials,
        IWorkshopMicroBundlePublisher publisher)
    {
        _credentials = credentials ?? throw new ArgumentNullException(nameof(credentials));
        _publisher = publisher ?? throw new ArgumentNullException(nameof(publisher));
    }

    /// <summary>
    /// Starts a publish transaction for an explicit user Publish command.
    /// Hosts must call this method only from the corresponding user action; save,
    /// refresh, startup, synchronization, and runtime lifecycle paths must not call it.
    /// </summary>
    public async Task<WorkshopPublishAttempt> PublishFromExplicitUserActionAsync(
        WorkshopArtifact artifact,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(artifact);

        if (!await _gate.WaitAsync(0, cancellationToken).ConfigureAwait(false))
            return new WorkshopPublishAttempt(
                WorkshopPublishStatus.Rejected,
                Failure: WorkshopPublishFailure.Busy,
                Diagnostic: "A Workshop publish transaction is already active.");

        try
        {
            var credential = await _credentials.GetCredentialAsync(cancellationToken).ConfigureAwait(false);
            if (credential is null)
                return new WorkshopPublishAttempt(
                    WorkshopPublishStatus.Rejected,
                    Failure: WorkshopPublishFailure.MissingCredential,
                    Diagnostic: "Workshop publisher credential is unavailable.");

            var attempt = await _publisher.PublishAsync(artifact, credential, cancellationToken).ConfigureAwait(false);
            if (attempt.Status == WorkshopPublishStatus.Published
                && attempt.Identity != artifact.Identity)
            {
                return new WorkshopPublishAttempt(
                    WorkshopPublishStatus.Failed,
                    Failure: WorkshopPublishFailure.IdentityMismatch,
                    Diagnostic: "Repository publisher returned an identity that does not match the selected artifact.");
            }

            return attempt;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return new WorkshopPublishAttempt(
                WorkshopPublishStatus.Cancelled,
                Failure: WorkshopPublishFailure.Cancelled,
                Diagnostic: "Workshop publish was cancelled. If dispatch may have occurred, resolve the immutable identity before retrying.");
        }
        catch
        {
            // Do not forward raw exception text: transport exceptions can contain headers or request details.
            return new WorkshopPublishAttempt(
                WorkshopPublishStatus.Failed,
                Failure: WorkshopPublishFailure.Unknown,
                Diagnostic: "Workshop publish failed unexpectedly. Consult protected host diagnostics.");
        }
        finally
        {
            _gate.Release();
        }
    }
}

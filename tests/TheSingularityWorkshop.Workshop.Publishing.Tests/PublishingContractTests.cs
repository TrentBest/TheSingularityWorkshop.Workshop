using TheSingularityWorkshop.Workshop.Publishing;

namespace TheSingularityWorkshop.Workshop.Publishing.Tests;

public sealed class PublishingContractTests
{
    [Fact]
    public void Artifact_CalculatesPortableSha256AndCopiesContent()
    {
        byte[] source = [1, 2, 3, 4];
        var artifact = new WorkshopArtifact("workshop/example", "1.2.3", source);
        source[0] = 99;

        Assert.Equal("workshop/example", artifact.Identity.Ontology);
        Assert.Equal("1.2.3", artifact.Identity.Version);
        Assert.Equal("9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a", artifact.Identity.ContentHash);
        Assert.Equal(new byte[] { 1, 2, 3, 4 }, artifact.CopyContent());
    }

    [Fact]
    public void CredentialStringRepresentationIsRedacted()
    {
        var credential = new WorkshopPublisherCredential("top-secret-value");

        Assert.Equal("[REDACTED]", credential.ToString());
        Assert.DoesNotContain("top-secret-value", credential.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task MissingCredentialFailsClosedBeforePublisherInvocation()
    {
        var publisher = new RecordingPublisher();
        var coordinator = new WorkshopPublishCoordinator(new EmptyCredentialProvider(), publisher);
        var artifact = new WorkshopArtifact("workshop/example", "1.0.0", [1]);

        var result = await coordinator.PublishFromExplicitUserActionAsync(artifact);

        Assert.Equal(WorkshopPublishStatus.Rejected, result.Status);
        Assert.Equal(WorkshopPublishFailure.MissingCredential, result.Failure);
        Assert.False(publisher.WasInvoked);
    }

    [Fact]
    public async Task SuccessfulAttemptMustReturnExactSelectedIdentity()
    {
        var artifact = new WorkshopArtifact("workshop/example", "1.0.0", [1, 2, 3]);
        var publisher = new RecordingPublisher(new WorkshopPublishAttempt(
            WorkshopPublishStatus.Published,
            new WorkshopMicroBundleIdentity("workshop/other", "1.0.0", artifact.Identity.ContentHash)));
        var coordinator = new WorkshopPublishCoordinator(new TestCredentialProvider(), publisher);

        var result = await coordinator.PublishFromExplicitUserActionAsync(artifact);

        Assert.Equal(WorkshopPublishStatus.Failed, result.Status);
        Assert.Equal(WorkshopPublishFailure.IdentityMismatch, result.Failure);
    }

    [Fact]
    public async Task CancellationBeforeGateAcquisitionReturnsCancelled()
    {
        var publisher = new RecordingPublisher();
        var coordinator = new WorkshopPublishCoordinator(new TestCredentialProvider(), publisher);
        var artifact = new WorkshopArtifact("workshop/example", "1.0.0", [1]);
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var result = await coordinator.PublishFromExplicitUserActionAsync(artifact, cancellation.Token);

        Assert.Equal(WorkshopPublishStatus.Cancelled, result.Status);
        Assert.Equal(WorkshopPublishFailure.Cancelled, result.Failure);
        Assert.False(publisher.WasInvoked);
    }

    [Fact]
    public async Task MatchingIdentityIsAccepted()
    {
        var artifact = new WorkshopArtifact("workshop/example", "1.0.0", [1, 2, 3]);
        var publisher = new RecordingPublisher(new WorkshopPublishAttempt(
            WorkshopPublishStatus.Published,
            artifact.Identity,
            RepositoryBinding: 42));
        var coordinator = new WorkshopPublishCoordinator(new TestCredentialProvider(), publisher);

        var result = await coordinator.PublishFromExplicitUserActionAsync(artifact);

        Assert.Equal(WorkshopPublishStatus.Published, result.Status);
        Assert.Equal(artifact.Identity, result.Identity);
        Assert.Equal((ulong)42, result.RepositoryBinding);
    }

    private sealed class EmptyCredentialProvider : IWorkshopPublisherCredentialProvider
    {
        public ValueTask<WorkshopPublisherCredential?> GetCredentialAsync(CancellationToken cancellationToken)
            => ValueTask.FromResult<WorkshopPublisherCredential?>(null);
    }

    private sealed class TestCredentialProvider : IWorkshopPublisherCredentialProvider
    {
        public ValueTask<WorkshopPublisherCredential?> GetCredentialAsync(CancellationToken cancellationToken)
            => ValueTask.FromResult<WorkshopPublisherCredential?>(new WorkshopPublisherCredential("test-secret"));
    }

    private sealed class RecordingPublisher(WorkshopPublishAttempt? result = null) : IWorkshopMicroBundlePublisher
    {
        public bool WasInvoked { get; private set; }

        public Task<WorkshopPublishAttempt> PublishAsync(
            WorkshopArtifact artifact,
            WorkshopPublisherCredential credential,
            CancellationToken cancellationToken)
        {
            WasInvoked = true;
            return Task.FromResult(result ?? new WorkshopPublishAttempt(
                WorkshopPublishStatus.Published,
                artifact.Identity));
        }
    }
}

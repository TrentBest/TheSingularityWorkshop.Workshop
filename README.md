# TheSingularityWorkshop.Workshop

Workshop is the authoring and arbitration authority for MicroBundle composition and Experience publication.

## Engineering

- [Workshop MicroBundle Publisher Integration](Documentation/Publishing/Workshop-MicroBundle-Publisher-Integration.md) — authority boundary, explicit publish transaction, credential handling, failure semantics, and implementation status.

## Build and test

The initial publishing contracts and tests target .NET 10:

```bash
dotnet test tests/TheSingularityWorkshop.Workshop.Publishing.Tests/TheSingularityWorkshop.Workshop.Publishing.Tests.csproj
```

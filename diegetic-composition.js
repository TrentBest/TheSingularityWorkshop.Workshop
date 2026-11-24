(function (root) {
  "use strict";

  function text(value, label) {
    if (typeof value !== "string" || !value.trim()) throw new TypeError(label + " is required.");
    return value.trim();
  }
  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }
  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach(key => freeze(value[key]));
      Object.freeze(value);
    }
    return value;
  }
  function same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function identity(value, label) {
    if (!value || typeof value !== "object") throw new TypeError(label + " is required.");
    return {
      id: text(value.id, label + " id"),
      version: text(value.version, label + " version")
    };
  }
  function validateContribution(raw, bundle, provider) {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.tools)) throw new TypeError("Provider contribution must contain a tools array.");
    const ids = new Set();
    const tools = raw.tools.map(tool => {
      const id = text(tool.id, "Tool identity");
      if (ids.has(id)) throw new Error("Duplicate tool identity: " + id);
      ids.add(id);
      const domain = identity(tool.domain, "Domain contract");
      if (!Array.isArray(tool.ports)) throw new TypeError("Tool " + id + " must declare ports.");
      const portIds = new Set();
      const ports = tool.ports.map(port => {
        const portId = text(port.id, "Port identity");
        if (portIds.has(portId)) throw new Error("Duplicate port identity in " + id + ": " + portId);
        portIds.add(portId);
        const direction = text(port.direction, "Port direction");
        if (direction !== "input" && direction !== "output") throw new Error("Unsupported port direction: " + direction);
        return {
          id: portId,
          title: text(port.title || port.id, "Port title"),
          direction,
          schema: identity(port.schema, "Port schema")
        };
      });
      const required = Array.isArray(tool.requiredCapabilities) ? tool.requiredCapabilities.map(x => text(x, "Required capability")) : [];
      return {
        id,
        title: text(tool.title, "Tool title"),
        description: typeof tool.description === "string" ? tool.description : "",
        domain,
        requiredCapabilities: required,
        ports
      };
    });
    return freeze({
      provider: { id: provider.id, contractVersion: provider.contractVersion },
      source: { id: bundle.id, version: bundle.version, publisherId: bundle.publisherId, creatorId: bundle.creatorId },
      tools
    });
  }

  function createHost(options) {
    options = options || {};
    const workspaceId = text(options.workspaceId, "Workspace identity");
    const creatorId = text(options.creatorId, "Creator identity");
    if (typeof options.resolveProvider !== "function") throw new TypeError("The host must supply a trusted provider resolver.");
    const trustedPublishers = new Set((options.trustedPublishers || []).map(x => text(x, "Trusted publisher")));
    const trustedCreators = new Set((options.trustedCreators || []).map(x => text(x, "Trusted creator")));
    const grantedCapabilities = new Set((options.grantedCapabilities || []).map(x => text(x, "Granted capability")));
    const bundles = new Map(), stations = new Map(), connections = new Map(), proposals = new Map();
    let revision = 0;

    function requireCurrent(proposal) {
      if (!proposal || proposal.workspaceId !== workspaceId) throw new Error("Connection proposal belongs to another workspace.");
      if (proposal.revision !== revision) throw new Error("Stale connection proposal: workspace revision changed.");
      if (proposals.get(proposal.id) !== proposal) throw new Error("Connection proposal is not pending in this workspace.");
    }
    function endpoint(stationId, portId, direction) {
      const station = stations.get(stationId);
      if (!station) throw new Error("Unknown station: " + stationId);
      const port = station.tools.flatMap(tool => tool.ports.map(p => ({ tool, port: p })))
        .find(item => item.port.id === portId);
      if (!port) throw new Error("Unknown port: " + portId);
      if (port.port.direction !== direction) throw new Error("Port " + portId + " must be " + direction + ".");
      return { station, tool: port.tool, port: port.port };
    }

    return Object.freeze({
      get snapshot() {
        return freeze({
          workspaceId, creatorId, revision,
          bundles: Array.from(bundles.values()).map(clone),
          stations: Array.from(stations.values()).map(clone),
          connections: Array.from(connections.values()).map(clone)
        });
      },
      loadBundle(bundleInput) {
        const bundle = identity(bundleInput, "MicroBundle");
        const publisherId = text(bundleInput.publisherId, "Publisher identity");\n        const bundleCreatorId = text(bundleInput.creatorId || publisherId, "Bundle creator identity");
        if (bundles.has(bundle.id)) throw new Error("MicroBundle is already loaded: " + bundle.id);
        if (!trustedPublishers.has(publisherId) && publisherId !== creatorId) throw new Error("Publisher is not trusted by this workspace: " + publisherId);
        if (!Array.isArray(bundleInput.providers)) throw new TypeError("MicroBundle must expose its declared provider catalogue.");
        const mounted = [];
        for (const declaration of bundleInput.providers) {
          const providerId = text(declaration.id, "Provider identity");
          const contractVersion = text(declaration.contractVersion, "Provider contract version");
          const resolved = options.resolveProvider(bundleInput, { id: providerId, contractVersion });
          if (!resolved) throw new Error("Declared provider could not be resolved: " + providerId);
          if (resolved.id !== providerId || resolved.contractVersion !== contractVersion) throw new Error("Resolved provider identity/version does not match its declaration: " + providerId);
          const contribution = validateContribution(resolved.contribution, { id: bundle.id, version: bundle.version, publisherId, creatorId: bundleCreatorId }, { id: providerId, contractVersion });
          contribution.tools.forEach(tool => tool.requiredCapabilities.forEach(capability => {
            if (!grantedCapabilities.has(capability)) throw new Error("Required capability is not granted: " + capability);
          }));
          contribution.tools.forEach(tool => {
            const stationId = bundle.id + "::" + providerId + "::" + tool.id;
            if (stations.has(stationId) || mounted.some(x => x.id === stationId)) throw new Error("Duplicate station identity: " + stationId);
            mounted.push(freeze({
              id: stationId, title: tool.title, description: tool.description,
              source: clone(contribution.source), provider: clone(contribution.provider),
              tools: [clone(tool)]
            }));
          });
        }
        bundles.set(bundle.id, freeze({ id: bundle.id, version: bundle.version, publisherId, providers: bundleInput.providers.map(p => ({ id: p.id, contractVersion: p.contractVersion })) }));
        mounted.forEach(station => stations.set(station.id, station));
        revision++;
        return freeze({ bundle: clone(bundles.get(bundle.id)), mounted: mounted.map(clone), revision });
      },
      proposeConnection(input) {
        const source = endpoint(text(input.sourceStationId, "Source station"), text(input.sourcePortId, "Source port"), "output");
        const target = endpoint(text(input.targetStationId, "Target station"), text(input.targetPortId, "Target port"), "input");
        if (!same(source.port.schema, target.port.schema)) throw new Error("Port schemas are incompatible: " + source.port.schema.id + "@" + source.port.schema.version + " != " + target.port.schema.id + "@" + target.port.schema.version);
        const sourcePublisher = source.station.source.publisherId;
        const targetPublisher = target.station.source.publisherId;
        if (sourcePublisher !== targetPublisher && !trustedCreators.has(targetPublisher) && !trustedCreators.has(sourcePublisher)) {
          throw new Error("Cross-publisher connection is not covered by workspace trust policy.");
        }
        const proposal = freeze({
          id: text(input.id, "Proposal identity"), workspaceId, revision,
          source: { stationId: source.station.id, toolId: source.tool.id, portId: source.port.id, schema: clone(source.port.schema) },
          target: { stationId: target.station.id, toolId: target.tool.id, portId: target.port.id, schema: clone(target.port.schema) }
        });
        if (proposals.has(proposal.id)) throw new Error("Duplicate proposal identity: " + proposal.id);
        proposals.set(proposal.id, proposal);
        return proposal;
      },
      approveConnection(proposal, approval) {
        requireCurrent(proposal);
        if (!approval || text(approval.creatorId, "Approving creator") !== creatorId) throw new Error("Only the workspace creator can approve this connection.");
        if (text(approval.proposalId, "Approved proposal identity") !== proposal.id) throw new Error("Approval does not identify this exact proposal.");
        const id = proposal.id;
        if (connections.has(id)) throw new Error("Connection already exists: " + id);
        const connection = freeze({
          id, workspaceId, approvedBy: creatorId, approvedAt: Number.isFinite(approval.approvedAt) ? approval.approvedAt : Date.now(),
          source: clone(proposal.source), target: clone(proposal.target)
        });
        connections.set(id, connection);
        proposals.delete(id);
        revision++;
        return connection;
      },
      rejectConnection(proposal, creatorId) {
        requireCurrent(proposal);
        if (text(creatorId, "Rejecting creator") !== creatorId || creatorId !== arguments[1]) throw new Error("Creator identity is required.");
        if (creatorId !== options.creatorId) throw new Error("Only the workspace creator can reject this connection.");
        proposals.delete(proposal.id);
        return true;
      },
      disconnect(connectionId, requestingCreatorId) {
        if (text(requestingCreatorId, "Requesting creator") !== creatorId) throw new Error("Only the workspace creator can disconnect a connection.");
        if (!connections.delete(text(connectionId, "Connection identity"))) return false;
        revision++;
        return true;
      },
      unloadBundle(bundleId, requestingCreatorId) {
        if (text(requestingCreatorId, "Requesting creator") !== creatorId) throw new Error("Only the workspace creator can unload a MicroBundle.");
        const id = text(bundleId, "MicroBundle identity");
        if (!bundles.has(id)) return false;
        const removed = new Set(Array.from(stations.keys()).filter(stationId => stationId.startsWith(id + "::")));
        Array.from(connections.values()).forEach(connection => {
          if (removed.has(connection.source.stationId) || removed.has(connection.target.stationId)) connections.delete(connection.id);
        });
        removed.forEach(stationId => stations.delete(stationId));
        bundles.delete(id);
        revision++;
        return true;
      }
    });
  }

  root.WorkshopDiegeticComposition = Object.freeze({ createHost });
})(typeof globalThis !== "undefined" ? globalThis : this);

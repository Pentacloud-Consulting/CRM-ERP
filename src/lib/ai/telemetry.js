/**
 * FreightFlow AI — Feature Telemetry Tracker
 * 
 * Tracks most-used AI commands, clicked suggestions, search queries,
 * and user engagement metrics to guide product decisions.
 */

const telemetryStore = {
  commands: {},      // { "show pentacloud": 5, "delayed shipments": 3 }
  features: {},      // { "accountSummary": 12, "commandCenter": 8 }
  actions: {},       // { "callCustomer": 2, "uploadDocument": 1 }
  sessionStart: Date.now(),
};

/**
 * Track a user command/query.
 */
export function trackCommand(command) {
  const key = command.toLowerCase().trim();
  telemetryStore.commands[key] = (telemetryStore.commands[key] || 0) + 1;
}

/**
 * Track an AI feature usage.
 */
export function trackFeatureUsage(featureName) {
  telemetryStore.features[featureName] = (telemetryStore.features[featureName] || 0) + 1;
}

/**
 * Track a suggested action click.
 */
export function trackActionClick(actionName) {
  telemetryStore.actions[actionName] = (telemetryStore.actions[actionName] || 0) + 1;
}

/**
 * Get telemetry summary for analytics dashboard.
 */
export function getTelemetrySummary() {
  const topCommands = Object.entries(telemetryStore.commands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topFeatures = Object.entries(telemetryStore.features)
    .sort((a, b) => b[1] - a[1]);

  const topActions = Object.entries(telemetryStore.actions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    topCommands,
    topFeatures,
    topActions,
    sessionDurationMs: Date.now() - telemetryStore.sessionStart,
    totalQueries: Object.values(telemetryStore.commands).reduce((s, v) => s + v, 0),
  };
}

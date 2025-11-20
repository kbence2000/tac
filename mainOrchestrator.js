// backend/orchestrator/mainOrchestrator.js
// Példa: Rift + Anti-Rift + DualResonance + Singularity összekötése

import riftEngine from "../core/riftEngine.js";
import antiRiftEngine from "../core/antiRiftEngine.js";
import singularityTheoryEngine from "../core/singularityTheoryEngine.js";
import { DualResonance } from "../core/dualResonanceEngine.js";

export async function globalSystemHealthDemo(){
  const riftReport = riftEngine.detect(10, 3.5);
  const antiRift = antiRiftEngine.harmonize(riftReport);

  const activitySeries = [0.1, 0.5, 2.5, 8.0, 3.2, 0.9];
  const resonance = DualResonance.summary(activitySeries);

  const snapshot = {
    modulesActive: 24,
    avgComplexity: 0.72,
    autonomyLevel: 0.6,
    couplingLevel: 0.55,
    improvementRate: 0.4,
    safetyIndex: 0.75
  };
  const singularityRecord = singularityTheoryEngine.addSnapshot(snapshot);
  const singularityReport = singularityTheoryEngine.fullReport();

  return {
    rift: riftReport,
    antiRift,
    resonance,
    singularity: {
      latest: singularityRecord,
      report: singularityReport
    }
  };
}

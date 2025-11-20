// backend/core/dualResonanceEngine.js
// Dual Resonance Engine – dB + Anti-dB fúzió

export class DbEngineClone {
  constructor(config = {}) {
    this.name = "DbEngineClone";
    this.noiseFloor = config.noiseFloor || 1e-6;
  }
  analyze(series = []) {
    if (!Array.isArray(series) || series.length===0) {
      return { ok:false, error:"EMPTY_SERIES" };
    }
    const eps = this.noiseFloor;
    const dbValues = series.map(v=>{
      const power = Math.max(Math.abs(v),eps);
      return 10*Math.log10(power/eps);
    });
    const avg = dbValues.reduce((a,b)=>a+b,0)/dbValues.length;
    return {
      ok:true,
      series,
      dbValues: dbValues.map(n=>parseFloat(n.toFixed(3))),
      avgDb: parseFloat(avg.toFixed(3))
    };
  }
}

export class AntiDbClone {
  constructor(config = {}) {
    this.name = "AntiDbClone";
    this.silenceThreshold = config.silenceThreshold || 0.00001;
    this.flatThreshold = config.flatThreshold || 0.000001;
  }
  analyze(series = []) {
    if (!Array.isArray(series) || series.length===0) {
      return { ok:false, error:"EMPTY_SERIES" };
    }
    const eps = this.silenceThreshold;
    const flat = this.flatThreshold;
    const anomalies = [];
    const deltas = [];
    for (let i=1;i<series.length;i++){
      const delta = Math.abs(series[i]-series[i-1]);
      deltas.push(delta);
      if (delta<flat){
        anomalies.push({ index:i, type:"FLATLINE", desc:"Suspiciously stable" });
      }
      if (Math.abs(series[i])<eps){
        anomalies.push({ index:i, type:"SILENCE", desc:"Below silence threshold" });
      }
    }
    const avgDelta = deltas.reduce((a,b)=>a+b,0)/deltas.length;
    return {
      ok:true,
      series,
      avgDelta: parseFloat(avgDelta.toFixed(6)),
      anomalies,
      anomalyScore: anomalies.length
    };
  }
}

export class DualResonanceEngine {
  constructor(){
    this.name = "DualResonanceEngine";
    this.dbClone = new DbEngineClone();
    this.antiDbClone = new AntiDbClone();
  }
  analyze(series=[]){
    const dbReport = this.dbClone.analyze(series);
    const antiReport = this.antiDbClone.analyze(series);
    if (!dbReport.ok || !antiReport.ok){
      return { ok:false, error:"INVALID_INPUT" };
    }
    const resonance = dbReport.avgDb - antiReport.anomalyScore*2;
    return {
      ok:true,
      series,
      db: dbReport,
      anti: antiReport,
      resonanceIndex: parseFloat(resonance.toFixed(3)),
      state:
        resonance>20 ? "HIGH_RESONANCE" :
        resonance>5 ? "MID_RESONANCE" : "LOW_RESONANCE"
    };
  }
  summary(series=[]){
    const r = this.analyze(series);
    if (!r.ok) return r;
    return {
      resonanceIndex: r.resonanceIndex,
      state: r.state,
      avgDb: r.db.avgDb,
      silenceEvents: r.anti.anomalyScore,
      anomalies: r.anti.anomalies
    };
  }
}

export const DualResonance = new DualResonanceEngine();
export default { DbEngineClone, AntiDbClone, DualResonanceEngine, DualResonance };

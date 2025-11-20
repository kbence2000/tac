// backend/core/singularityTheoryEngine.js
// SingularityTheoryEngine – meta-analitikai modul

export class SingularityTheoryEngine {
  constructor(config = {}) {
    this.name = config.name || "SingularityTheoryEngine";
    this.history = [];
    this.maxHistory = config.maxHistory || 500;
  }

  addSnapshot(snapshot) {
    const t = snapshot.time || Date.now();
    const normalized = this._normalizeMetrics(snapshot);
    const score = this._computeSingularityScore(normalized);
    const risk  = this._classifyRisk(score, normalized);

    const record = { t, metrics: normalized, score, risk };
    this.history.push(record);
    if (this.history.length > this.maxHistory) this.history.shift();
    return record;
  }

  getLatest() {
    if (this.history.length === 0) return null;
    return this.history[this.history.length - 1];
  }

  analyzeTrend() {
    if (this.history.length < 3) {
      return { ok: false, reason: "NOT_ENOUGH_DATA" };
    }
    const scores = this.history.map(h => h.score);
    const deltas = [];
    for (let i = 1; i < scores.length; i++) {
      deltas.push(scores[i] - scores[i - 1]);
    }
    const avgSlope = deltas.reduce((a,b)=>a+b,0)/(deltas.length||1);
    let trend = "flat";
    if (avgSlope > 0.5) trend = "accelerating";
    else if (avgSlope > 0.1) trend = "rising";
    else if (avgSlope < -0.1) trend = "falling";

    const latest = scores[scores.length-1];
    const projectedScore30 = this._clamp(latest + avgSlope*30,0,100);

    return {
      ok: true,
      avgSlope: parseFloat(avgSlope.toFixed(3)),
      trend,
      projectedScore30: parseFloat(projectedScore30.toFixed(2))
    };
  }

  fullReport() {
    const latest = this.getLatest();
    const trend  = this.analyzeTrend();
    return { latest, trend, historySize: this.history.length };
  }

  _normalizeMetrics(s) {
    const safe = (v,def=0)=> typeof v==="number" && !Number.isNaN(v)?v:def;
    const clamp01 = v => this._clamp(safe(v),0,1);
    return {
      modulesActive: Math.max(0, safe(s.modulesActive,0)),
      avgComplexity: clamp01(s.avgComplexity),
      autonomyLevel: clamp01(s.autonomyLevel),
      couplingLevel: clamp01(s.couplingLevel),
      improvementRate: clamp01(s.improvementRate),
      safetyIndex: clamp01(s.safetyIndex)
    };
  }

  _computeSingularityScore(m) {
    const baseIntensity =
      m.avgComplexity*0.3 +
      m.autonomyLevel*0.3 +
      m.couplingLevel*0.2 +
      m.improvementRate*0.2;

    const moduleFactor = Math.log10(1 + m.modulesActive)/2;
    const safetyFactor = 1 - m.safetyIndex;
    let raw = baseIntensity*(1+moduleFactor)*safetyFactor*100;
    raw = 100/(1+Math.exp(-(raw-50)/20));
    return parseFloat(this._clamp(raw,0,100).toFixed(2));
  }

  _classifyRisk(score,m){
    if (score>75 && m.safetyIndex<0.4) return "high";
    if (score>50 && m.safetyIndex<0.7) return "medium";
    return "low";
  }

  _clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
}

const singularityTheoryEngine = new SingularityTheoryEngine();
export default singularityTheoryEngine;

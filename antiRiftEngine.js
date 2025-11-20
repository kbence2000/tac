// backend/core/antiRiftEngine.js
// Anti-Rift AI – stabilizáló réteg

export class AntiRiftEngine {
  constructor(config = {}) {
    this.name = "AntiRiftEngine";
    this.softThreshold = config.softThreshold ?? 0.35;
    this.hardThreshold = config.hardThreshold ?? 0.65;
    this.smoothingStrength = config.smoothingStrength ?? 0.6;
  }

  analyzeRifts(riftReport) {
    if (!riftReport || !Array.isArray(riftReport.layers)) {
      return { ok:false, error:"INVALID_RIFT_REPORT" };
    }
    const layers = riftReport.layers;
    if (layers.length === 0) return { ok:false, error:"EMPTY_LAYERS" };

    const intensities = layers.map(l=>this._clamp01(l.riftIntensity ?? 0));
    const avgIntensity = intensities.reduce((a,b)=>a+b,0)/intensities.length;
    const maxIntensity = Math.max(...intensities);
    const minIntensity = Math.min(...intensities);
    const riskLevel = this._classifyRisk(avgIntensity,maxIntensity);

    return {
      ok:true,
      source: riftReport.source || null,
      avgIntensity: parseFloat(avgIntensity.toFixed(3)),
      maxIntensity: parseFloat(maxIntensity.toFixed(3)),
      minIntensity: parseFloat(minIntensity.toFixed(3)),
      riskLevel,
      layerCount: layers.length
    };
  }

  suggestStabilization(riftReport){
    const analysis = this.analyzeRifts(riftReport);
    if (!analysis.ok) return analysis;
    const { avgIntensity, riskLevel } = analysis;
    const actions = [];
    if (riskLevel==="low"){
      actions.push("MONITOR_ONLY");
    } else if (riskLevel==="medium"){
      actions.push("MILD_SMOOTHING","PARTIAL_DECOUPLING");
    } else if (riskLevel==="high"){
      actions.push("STRONG_SMOOTHING","DECOUPLE_CRITICAL_LAYERS","LIMIT_AUTONOMY");
    }
    const stabilizationStrength = this._clamp01(
      avgIntensity * (riskLevel==="high" ? 1.2 : 0.8)
    );
    return {
      ok:true,
      analysis,
      actions,
      stabilizationStrength: parseFloat(stabilizationStrength.toFixed(3))
    };
  }

  harmonize(riftReport){
    const stab = this.suggestStabilization(riftReport);
    if (!stab.ok) return stab;
    const k = this.smoothingStrength * stab.stabilizationStrength;
    const smoothedLayers = riftReport.layers.map(layer=>{
      const rift = this._clamp01(layer.riftIntensity ?? 0);
      const base = layer.baseValue ?? 0;
      const drift = layer.drift ?? 0;
      const newRift = this._lerp(rift,0,k);
      const newDrift = this._lerp(drift,0,k);
      const newBase = base * (1 - 0.1*k);
      return {
        name: layer.name,
        originalBase: base,
        originalRift: rift,
        originalDrift: drift,
        smoothedBase: parseFloat(newBase.toFixed(6)),
        smoothedRift: parseFloat(newRift.toFixed(6)),
        smoothedDrift: parseFloat(newDrift.toFixed(6))
      };
    });

    return {
      ok:true,
      source: riftReport.source || null,
      stabilizationPlan: stab,
      smoothedLayers
    };
  }

  _clamp01(v){ if(Number.isNaN(v)) return 0; return Math.max(0,Math.min(1,v)); }
  _classifyRisk(avg,max){
    if (max>=this.hardThreshold) return "high";
    if (avg>=this.softThreshold) return "medium";
    return "low";
  }
  _lerp(from,to,factor){
    const f=this._clamp01(factor);
    return from + (to-from)*f;
  }
}

const antiRiftEngine = new AntiRiftEngine();
export default antiRiftEngine;

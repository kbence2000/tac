// backend/core/riftEngine.js
// RiftEngine – egyszerű, demonstratív rift detektor

export class RiftEngine {
  constructor(){
    this.name = "RiftEngine";
  }

  // Készít egy egyszerű riftReportot két layerből
  detect(inputA, inputB){
    const a = Number(inputA) || 0;
    const b = Number(inputB) || 0;
    const diff = Math.abs(a-b);
    const intensity = Math.max(0, Math.min(1, diff/10)); // 0–1 skála

    return {
      source: "RiftEngine_simple",
      layers: [
        { name:"numeric-diff", baseValue: diff, riftIntensity: intensity, drift: diff>=0?1:-1 }
      ]
    };
  }
}

const riftEngine = new RiftEngine();
export default riftEngine;

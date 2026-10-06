// Shared, deterministic choreography. The vehicle is one photographic cutout;
// these transforms are 2.5D travel/parallax, not a simulated 3D turn or lift.
export const JOURNEY_START = 0.36
export const JOURNEY_END = 0.98
export const INDUSTRIAL_STAGES = [
  { label: "PORT", copy: "Your shipment arrives at the port. JSL coordinates the route, unloading and customs requirements before the next stage of its journey." },
  { label: "ON THE ROAD", copy: "Road and multimodal connections carry your freight from the port to the warehouse, connecting China, Korea and Southeast Asia." },
  { label: "WAREHOUSE", copy: "Warehousing, inventory management and bonded facilities support your cargo while the next shipment is prepared for dispatch." },
  { label: "PREPARATION", copy: "Picking, packing and labelling prepare each shipment for its destination, with handling requirements kept together throughout the process." },
  { label: "DISPATCH", copy: "Air, ocean, road, rail and express services connect your shipment to the route that fits its lead time and budget." },
  { label: "DELIVERY", copy: "Door-to-door express services carry your shipment through the final stage, with shipment status connected to JSL's own API system." },
  { label: "VISIBILITY", copy: "Real-time shipment status and logistics reports keep your team informed. One point of contact connects every stage of the journey." },
] as const

export const bounded = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0))
const ease = (n: number) => { const x = bounded(n); return x * x * (3 - 2 * x) }
const between = (p: number, start: number, end: number) => ease((p - start) / (end - start))
const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function industrialFrame(progress: number, mobile: boolean) {
  const p = bounded(progress)
  const road = between(p, 0.42, 0.59)
  const departure = between(p, 0.71, 0.94)
  const warehouse = between(p, 0.50, 0.57)
  const intro = between(p, 0, 0.04)
  const mode = p < 0.035 ? -1 : Math.min(4, Math.floor((p - 0.035) / 0.061))
  const stage = Math.min(6, Math.floor(bounded((p - JOURNEY_START) / (JOURNEY_END - JOURNEY_START)) * 7))
  return {
    p, mode, stage, warehouse,
    // The cab faces left. Forward travel therefore stays leftward in both shots.
    truckX: mobile ? mix(mix(56, 50, intro), 50, road) - 150 * departure
      : mix(mix(78, 73, intro), 35, road) - 92 * departure,
    truckWidth: mobile ? 96 : mix(42, 54, road),
    truckBottom: mobile ? mix(27, 26, road) : mix(18, 22, road),
    portScale: 1.035 + 0.05 * between(p, 0, 0.52),
    portX: -2.5 * road,
    warehouseScale: 1.065 - 0.065 * between(p, 0.54, 1),
    // Mobile titles share a position; switch there without double-printing text.
    transportOpacity: mobile ? (p < 0.36 ? 1 : 0) : 1 - between(p, 0.34, 0.38),
    journeyOpacity: mobile ? (p < 0.36 ? 0 : 1) : between(p, 0.34, 0.38),
    night: mix(1, 0.79, warehouse),
  }
}

export const modeProgress = (index: number) => 0.035 + (Math.max(0, Math.min(4, index)) + 0.5) * 0.061
export const stageProgress = (index: number) => JOURNEY_START + (Math.max(0, Math.min(6, index)) + 0.5) * (JOURNEY_END - JOURNEY_START) / 7

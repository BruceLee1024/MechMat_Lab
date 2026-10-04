import { DEFAULT_STATE } from '../types';
import { createExperiment, SimulationModule, simulationParameters } from './schema';

export const EXAMPLES: { module: SimulationModule; name: string; description: string; changes: Partial<typeof DEFAULT_STATE> }[] = [
  { module: 'axial', name: '5 kN 直杆拉伸', description: '100 mm²、1 m、200 GPa；应力 50 MPa，伸长 0.25 mm。', changes: { axialForce: 5000, axialArea: 100, axialLength: 1, bendModulus: 200 } },
  { module: 'bending', name: '简支梁跨中集中力', description: '1 kN、2 m、100×200 mm；应力 0.75 MPa，载荷点挠度 0.0125 mm。', changes: { bendLoad: 1000, bendLength: 2, bendLoadPos: 1, bendModulus: 200, bendSection: { type: 'rectangle', width: 100, height: 200 }, bendWidth: 100, bendHeight: 200 } },
  { module: 'torsion', name: '圆轴全长传动', description: '1 N·m、r=10 mm、G=80 GPa；切应力约 0.636620 MPa。', changes: { torqTorque: 1, torqRadius: 10, torqLength: 1, torqModulus: 80, torqLoadRatio: 0 } },
  { module: 'buckling', name: '铰支圆压杆', description: 'r=10 mm、L=1 m、E=200 GPa；临界力约 15503.138 N。', changes: { buckleLoad: 1000, buckleLength: 1, buckleModulus: 200, buckleSection: { type: 'circle', radius: 10 } } },
];
export function loadExample(example: typeof EXAMPLES[number]) {
  return createExperiment(example.module, example.name, { kind: 'simulation', parameters: simulationParameters(example.module, { ...DEFAULT_STATE, ...example.changes }) });
}

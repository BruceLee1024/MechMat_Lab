import {describe,it,expect} from 'vitest';
import {calculateFormulaAxial,DEFAULT_FORMULA_AXIAL} from '../mechanics/formulaAxial';

describe('公式页轴向参数联动',()=>{
  it('圆截面 N、d、L、材料与正应力、应变及伸长采用一致单位',()=>{
    const result=calculateFormulaAxial(DEFAULT_FORMULA_AXIAL);expect(result.ok).toBe(true);if(!result.ok)return;
    const A=Math.PI*18**2/4;
    expect(result.values.area).toBeCloseTo(A,10);
    expect(result.values.stress).toBeCloseTo(45000/A,10);
    expect(result.values.strain).toBeCloseTo(45000/A/206000,12);
    expect(result.values.deformation).toBeCloseTo(45000/A/206,10);
    expect(result.values.referenceRatio).toBeCloseTo(235/(45000/A),10);
    expect(result.values.extrapolated).toBe(false);
  });
  it('直接面积、压缩、零载荷与材料切换正确联动',()=>{
    const input={...DEFAULT_FORMULA_AXIAL,mode:'area' as const,area:100,forceKN:-10};
    const steel=calculateFormulaAxial(input);const aluminum=calculateFormulaAxial({...input,materialName:'6061-T6铝合金'});
    expect(steel.ok&&aluminum.ok).toBe(true);if(!steel.ok||!aluminum.ok)return;
    expect(steel.values.stress).toBe(-100);expect(steel.values.deformation).toBeLessThan(0);
    expect(aluminum.values.stress).toBe(steel.values.stress);
    expect(Math.abs(aluminum.values.deformation)).toBeGreaterThan(Math.abs(steel.values.deformation));
    const zero=calculateFormulaAxial({...input,forceKN:0});expect(zero.ok).toBe(true);if(!zero.ok)return;
    expect(zero.values.referenceRatio).toBeNull();expect(zero.values.strain).toBe(0);expect(zero.values.totalStrainEnergyJ).toBe(0);
  });
  it('超参考屈服只标记弹性外推，不宣称安全或实际塑性失效',()=>{
    const result=calculateFormulaAxial({...DEFAULT_FORMULA_AXIAL,mode:'area',area:100,forceKN:40});expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.values.extrapolated).toBe(true);expect(result.values.energyApplicable).toBe(false);expect(result.values.referenceRatio).toBeCloseTo(.5875);
  });
  it('拒绝零尺寸、无效材料和计算溢出，不用默认值替代错误',()=>{
    expect(calculateFormulaAxial({...DEFAULT_FORMULA_AXIAL,diameter:0}).ok).toBe(false);
    expect(calculateFormulaAxial({...DEFAULT_FORMULA_AXIAL,mode:'area',area:0}).ok).toBe(false);
    expect(calculateFormulaAxial({...DEFAULT_FORMULA_AXIAL,materialName:'不存在'}).ok).toBe(false);
    expect(calculateFormulaAxial({...DEFAULT_FORMULA_AXIAL,forceKN:1e308}).ok).toBe(false);
  });
});

export type FormulaReferenceKind='basic'|'beam'|'section';
export interface FormulaReferenceRecord {
  id:string;kind:FormulaReferenceKind;name:string;group:string;params?:string;
  formulas:{label:string;formula:string}[];
}
const aliases:Record<string,string>={sigma:'σ',tau:'τ',varepsilon:'ε',epsilon:'ε',delta:'δ',Delta:'δ',theta:'θ',varphi:'φ',phi:'φ',lambda:'λ',nu:'ν',rho:'ρ',mu:'μ'};
const normalize=(text:string)=>text.replace(/\\([A-Za-z]+)/g,(_,v:string)=>aliases[v]??v).normalize('NFKC').toLocaleLowerCase().replace(/sigma/g,'σ').replace(/[\\{}_\s]/g,'');

/** 搜索覆盖条目名称、目录、符号和公式正文；多个词共同匹配。 */
export function filterFormulaReferences<T extends FormulaReferenceRecord>(entries:readonly T[],{kind='all',group='all',query=''}:{kind?:FormulaReferenceKind|'all';group?:string;query?:string}){
  const words=query.trim().split(/\s+/).filter(Boolean).map(normalize);
  return entries.filter(entry=>(kind==='all'||entry.kind===kind)&&(group==='all'||`${entry.kind}/${entry.group}`===group||entry.group===group)&&words.every(word=>normalize([entry.name,entry.group,entry.params??'',...entry.formulas.flatMap(f=>[f.label,f.formula])].join(' ')).includes(word)));
}

/** 只把汉字说明前的短横线视作分隔符，保留 σ-1 和英文描述中的空格。 */
export function parseFormulaSymbols(raw:string){
  const matches=[...raw.matchAll(/(?:^|\s)(\S+?)-(?=[\u3400-\u9fff])/g)];
  return matches.map((m,i)=>({symbol:m[1],description:raw.slice(m.index!+m[0].length,matches[i+1]?.index??raw.length).trim()}));
}
const scopes:Record<string,string[]>={
  'stress-basic':['N/A 表示均匀轴向受力时的截面正应力；应力不均匀时为平均值。','胡克定律用于线弹性阶段，泊松比取相应材料与状态的值。'],
  'shear-stress':['V/A 为截面平均剪应力；局部剪应力需根据分布另算。','τ = Gγ 用于线弹性剪切；G、E、ν 的关系适用于各向同性材料。'],
  'strain-energy':['应变能公式用于线弹性、准静态加载；闭式轴向与扭转项要求该段内力、刚度不变。','扭转项中的 Iₚ 用于圆截面；非圆截面应采用相应扭转常数。'],
  'axial-deform':['分段公式用于各段内力与轴向刚度恒定的情况；连续变化时改用积分。','自重式用于等截面直杆；温度应力式为完全约束下的应力幅值，升温受压。'],
  'statically-indeterminate':['先列平衡、变形协调与材料关系。所示 ΔL₁ + ΔL₂ = 0 对应两段变形抵消的约束情形。'],
  'torsion-basic':['用于等截面圆轴的线弹性扭转；ρ 为到圆心的距离。','φ 为总扭转角，θ 为单位长度扭转角；非圆截面不能直接用 Iₚ 替代扭转常数。'],
  'torsion-section':['适用于实心圆与同心圆管；空心圆式中 D、d 分别为外径与内径。'],
  'bending-stress':['用于线弹性梁绕相应形心主轴的弯曲；y 为到中性轴的有符号距离。','截面不对称时，应分别检查两侧边缘的应力与截面模量。'],
  'shear-stress-beam':['用于初等梁理论的横向剪切，避开集中荷载和支座附近的局部效应。','S* 是待求点一侧面积对中性轴的静矩，b 是该高度处的材料宽度。'],
  deflection:['采用 Euler–Bernoulli 小挠度梁模型，忽略剪切变形。','曲率、挠度与弯矩的正负号应采用同一约定；叠加法用于线性响应。'],
  'deflection-common':['用于所列支承与载荷位置下的等截面、等刚度线弹性梁；结果为挠度幅值。'],
  'stress-transform':['采用平面应力变换；α 是截面法线相对原坐标轴的转角。','主方向应结合双角的象限确定，不能只用反正切主值。'],
  'principal-stress':['σ₁、σ₂ 为面内主应力，(σ₁−σ₂)/2 是面内最大剪应力。','若求三维最大剪应力，需将平面应力的第三主应力 0 一起排序。'],
  'strength-theory':['主应力按 σ₁ ≥ σ₂ ≥ σ₃ 排序；许用应力应与材料、失效模式及设计依据对应。'],
  'von-mises':['此处列出平面应力及纯剪切形式；用于相应屈服模型的等效应力判断。'],
  combined:['拉弯项按同一点、同一坐标与符号约定叠加。','√(σ² + 4τ²) 是第三强度理论的等效应力形式；偏心压缩采用小变形线弹性模型。'],
  buckling:['欧拉公式适用于理想细长杆的弹性失稳，I 取实际失稳方向的惯性矩。','μ 由端部约束确定；短粗杆、初始缺陷和材料非线性需另行考虑。'],
  'buckling-factor':['对应理想端部约束；固定—铰支的精确长度系数约为 0.699，0.7 为常用近似。'],
  'energy-method':['采用线弹性关系。所列莫尔积分和单位载荷式列出轴向、弯曲项；其他变形能按模型另计。'],
  fatigue:['此处为循环应力的定义；疲劳极限需结合材料、试验条件及构件修正确定。'],
};
export function formulaReferenceScope(entry:FormulaReferenceRecord):string[]{
  if(entry.kind==='basic')return scopes[entry.id]??['按公式中定义的符号、坐标与材料模型使用，保持单位一致。'];
  if(entry.kind==='section')return ['惯性矩与截面模量对应所示形心轴；不同轴的特性不能混用。',entry.id==='i-beam'?'型钢公式按理想矩形翼缘、腹板组合，未计圆角。':'尺寸符号以图示为准，面积、惯性矩与截面模量分别使用长度的二、四、三次方单位。'];
  if(entry.kind==='beam'&&entry.id.startsWith('arch-'))return ['等高抛物线拱，均布竖向载荷按水平投影计；N、V 沿截面局部切线、法线分解，M=M₀−Hy。',...(entry.id==='arch-2hinge-uniform'||entry.id==='arch-fixed-uniform'?['本条目仅采用弯曲理论，忽略轴向和剪切变形；实际压缩相容需另给 EA、EI。']:[])];
  return ['载荷位置与支承方式以当前条目的受力图为准；梁挠度采用等刚度、小变形线弹性模型。'];
}
export function formulaReferenceSymbols(entry:FormulaReferenceRecord){
  if(entry.params)return parseFormulaSymbols(entry.params).map(v=>({...v,description:v.description.split(/求解步骤|第一:/)[0].trim()}));
  if(entry.kind==='section')return parseFormulaSymbols(entry.id==='rect'?'b-截面宽度 h-截面高度 A-截面积 Ix-绕水平形心轴的惯性矩 Wx-相应抗弯截面模量':entry.id==='circle'?'r-圆半径 A-截面积 I-任一直径轴的惯性矩 W-相应抗弯截面模量':entry.id==='hollow'?'R-外圆半径 r-内圆半径 A-净截面积 I-任一直径轴的惯性矩':'B-翼缘宽度 H-总高 tf-翼缘厚度 tw-腹板厚度 A-截面积 Ix-绕水平形心轴的惯性矩');
  if(entry.kind==='beam'&&entry.id.startsWith('arch-'))return [
    {symbol:'N',description:'截面轴力，拉为正、压为负'},
    {symbol:'V',description:'截面局部剪力，V=V₀cosφ−Hsinφ'},
    {symbol:'M',description:'截面弯矩，正值在拱内侧受拉，M=M₀−Hy'},
    {symbol:'V₀',description:'同跨度、同竖向载荷的参考简支梁剪力'},
    {symbol:'M₀',description:'同跨度、同竖向载荷的参考简支梁弯矩'},
    {symbol:'H',description:'拱脚水平推力幅值，两侧方向向内'},
    {symbol:'R_A、R_C',description:'左、右拱脚竖向反力'},
    {symbol:'φ',description:'拱轴切线与水平线夹角，从左向右上升为正'},
    {symbol:'x、y',description:'x 自左拱脚起算，y 为该截面拱轴的高度'},
    {symbol:'L、f',description:'拱脚水平跨度、拱顶矢高'},
    entry.id==='arch-3hinge-center'?{symbol:'P',description:'拱顶竖向集中力'}:{symbol:'w',description:'按水平投影长度计的均布竖向载荷集度'},
  ];
  const text=entry.formulas.map(f=>f.formula).join(' ').replace(/\\text\{[^}]*\}/g,' ').replace(/\\[A-Za-z]+/g,' ').replace(/max|min|端|中/g,'');
  return parseFormulaSymbols('M-弯矩或外加力矩 V-截面剪力 P-单个集中力 q-沿梁长的均布载荷集度 w-沿水平投影的拱载荷集度 L-跨度或图示长度 a,b,c-图示位置与加载长度 f-拱矢高 E-弹性模量 I-弯曲方向的截面惯性矩 R-竖向支座反力 H-拱水平推力 δ-挠度 θ-转角').filter(p=>{
    const source=entry.formulas.map(f=>f.formula).join(' ');
    if(p.symbol==='δ')return source.includes('delta');if(p.symbol==='θ')return source.includes('theta');
    return p.symbol.split(',').some(symbol=>text.includes(symbol));
  });
}

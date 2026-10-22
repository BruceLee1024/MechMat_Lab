import {texNumber as n} from './formulaExplanations';
import type {FormulaBeamCalculator,FormulaBeamResult} from './formulaBeamCalculators';
/** 只排版仓库中已校验的有限公式语法，不执行字符串，不从排版表达式反推计算结果。 */
export function formulaBeamSubstitution(id:string,config:FormulaBeamCalculator,p:Record<string,number>,row:FormulaBeamResult):string {
 const v:Record<string,number>={...p};
 for(const f of config.inputs){if(f.unit==='kN'||f.unit==='m'||f.unit==='GPa')v[f.key]*=1000;else if(f.unit==='kN·m')v[f.key]*=1e6;else if(f.unit==='×10⁶mm⁴')v[f.key]*=1e6;}
 if(v.a!==undefined)v.b=v.L-v.a-(id==='ss-partial'?v.c:0);
 for(const r of config.calculate(p)){
  const key=r.label.match(/\b(R[₁₂A-C]?|H|x)(?:\s|$|=)/)?.[1];
  if(key)v[key]=r.value*(r.unit==='kN'||r.unit==='m'?1000:r.unit==='kN·m'?1e6:1);
 }
 const raw=row.formula.replace('≈','=') .replace(/\s*\([^()]*[\u4e00-\u9fff≈][^()]*\)\s*$/,'').replace(/\s*\(x[≈=][^()]*\)\s*$/,'');
 if(!raw.includes('=')&&!/^[A-Za-z0-9+*/.()\-√²³⁴\s]+$/.test(raw))return String.raw`\text{${row.label}}=${n(row.value)}`;
 let source=raw.split('=').at(-1)!.trim();
 const original=source;
 source=source.replace(/[²³⁴]/g,c=>`^${'²³⁴'.indexOf(c)+2}`).replace('≈','');
 const tokens=source.match(/R[₁₂A-C]?|[A-Za-z]|\d*\.?\d+(?:e[+-]?\d+)?|[()+\-*/^√]/g)??[];
 const compact=source.replace(/\s/g,'');if(tokens.join('')!==compact)throw Error(`不支持的公式排版：${original}`);
 function expression(t:string[]):string{
  let depth=0;
  for(let i=t.length-1;i>0;i--){if(t[i]===')')depth++;if(t[i]==='(')depth--;if(depth===0&&(t[i]==='+'||t[i]==='-')&&!['+','-','/','*','^','('].includes(t[i-1]))return `${expression(t.slice(0,i))}${t[i]}${expression(t.slice(i+1))}`;}
  depth=0;for(let i=0;i<t.length;i++){if(t[i]==='(')depth++;if(t[i]===')')depth--;if(depth===0&&t[i]==='/')return String.raw`\frac{${expression(t.slice(0,i))}}{${expression(t.slice(i+1))}}`;}
  const atoms:string[]=[];let sign='';
  for(let i=0;i<t.length;){let out='',token=t[i++];
   if(token==='-'||token==='+'){sign+=token;continue;}if(token==='*')continue;
   if(token==='('){const start=i;let d=1;while(i<t.length&&d){if(t[i]==='(')d++;if(t[i]===')')d--;i++;}out=String.raw`\left(${expression(t.slice(start,i-1))}\right)`;}
   else if(token==='√'){const a=t[i++];out=String.raw`\sqrt{${v[a]===undefined?a:n(v[a])}}`;}
   else out=v[token]===undefined?token:String.raw`\left(${n(v[token])}\right)`;
   if(t[i]==='^'){i++;out=`${out}^{${t[i++]}}`;}
   atoms.push(out);
  }
  return sign+atoms.join(String.raw`\times`);
 }
 let rhs=expression(tokens);
 // 排版表达式使用 N、mm、MPa，输出再回到计算器声明的单位。
 const factor=row.unit==='kN'?1/1000:row.unit==='kN·m'?1/1e6:row.unit==='m'?1/1000:row.unit==='×10⁻³ rad'?1000:1;
 if(factor!==1)rhs=String.raw`\left(${rhs}\right)\times${n(factor)}`;
 const unit=row.unit==='×10⁻³ rad'?String.raw`\times10^{-3}\ \mathrm{rad}`:String.raw`\ \mathrm{${row.unit.replaceAll('·',String.raw`\,`)}}`;
 return `${rhs}=${n(row.value)}${unit}`;
}

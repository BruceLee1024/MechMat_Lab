// 激活码管理模块
// 注意：前端验证仅能防止普通用户，技术用户可绕过

// 激活码哈希列表（使用简单哈希，不直接暴露明文）
// 你可以用 generateCodeHash('你的激活码') 生成新的哈希值
// 或在浏览器控制台运行: generateNewCode('YOUR_CODE')
const VALID_CODE_HASHES: string[] = [
  // 特殊激活码
  '000008d4c583', // MECH2024
  '000018630056', // MATERIAL001
  '00006bb7b8fc', // STRESS888
  '0000691557a7', // VIP666
  '00007990d959', // BRUCE2024
  // 批量激活码 MECH0001 - MECH0100
  '000008d5ae82', '000008d5ae81', '000008d5ae80', '000008d5ae7f', '000008d5ae7e',
  '000008d5ae7d', '000008d5ae7c', '000008d5ae7b', '000008d5ae7a', '000008d5ae64',
  '000008d5ae63', '000008d5ae62', '000008d5ae61', '000008d5ae60', '000008d5ae5f',
  '000008d5ae5e', '000008d5ae5d', '000008d5ae5c', '000008d5ae5b', '000008d5ae45',
  '000008d5ae44', '000008d5ae43', '000008d5ae42', '000008d5ae41', '000008d5ae40',
  '000008d5ae3f', '000008d5ae3e', '000008d5ae3d', '000008d5ae3c', '000008d5ae26',
  '000008d5ae25', '000008d5ae24', '000008d5ae23', '000008d5ae22', '000008d5ae21',
  '000008d5ae20', '000008d5ae1f', '000008d5ae1e', '000008d5ae1d', '000008d5ae07',
  '000008d5ae06', '000008d5ae05', '000008d5ae04', '000008d5ae03', '000008d5ae02',
  '000008d5ae01', '000008d5ae00', '000008d5adff', '000008d5adfe', '000008d5ade8',
  '000008d5ade7', '000008d5ade6', '000008d5ade5', '000008d5ade4', '000008d5ade3',
  '000008d5ade2', '000008d5ade1', '000008d5ade0', '000008d5addf', '000008d5adc9',
  '000008d5adc8', '000008d5adc7', '000008d5adc6', '000008d5adc5', '000008d5adc4',
  '000008d5adc3', '000008d5adc2', '000008d5adc1', '000008d5adc0', '000008d5adaa',
  '000008d5ada9', '000008d5ada8', '000008d5ada7', '000008d5ada6', '000008d5ada5',
  '000008d5ada4', '000008d5ada3', '000008d5ada2', '000008d5ada1', '000008d5ad8b',
  '000008d5ad8a', '000008d5ad89', '000008d5ad88', '000008d5ad87', '000008d5ad86',
  '000008d5ad85', '000008d5ad84', '000008d5ad83', '000008d5ad82', '000008d5ad6c',
  '000008d5ad6b', '000008d5ad6a', '000008d5ad69', '000008d5ad68', '000008d5ad67',
  '000008d5ad66', '000008d5ad65', '000008d5ad64', '000008d5ad63', '000008d5aac2',
];

// 免费可用的模块
export const FREE_MODULES = ['home', 'fundamentals', 'settings'];

// 简单哈希函数
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
};

// 生成激活码哈希（用于添加新激活码）
export const generateCodeHash = (code: string): string => {
  return simpleHash(code.toUpperCase().trim());
};

// 验证激活码
export const validateActivationCode = (code: string): boolean => {
  const hash = generateCodeHash(code);
  return VALID_CODE_HASHES.includes(hash);
};

// 检查是否已激活
export const isActivated = (): boolean => {
  try {
    const data = localStorage.getItem('mechmat_activation');
    if (!data) return false;
    const parsed = JSON.parse(data);
    return parsed.activated === true && parsed.token?.length > 0;
  } catch {
    return false;
  }
};

// 激活应用
export const activateApp = (code: string): { success: boolean; message: string } => {
  if (isActivated()) {
    return { success: true, message: '已经激活过了' };
  }
  
  if (!validateActivationCode(code)) {
    return { success: false, message: '激活码无效，请检查后重试' };
  }
  
  const token = generateCodeHash(code + Date.now().toString());
  localStorage.setItem('mechmat_activation', JSON.stringify({
    activated: true,
    token,
    activatedAt: new Date().toISOString()
  }));
  
  return { success: true, message: '激活成功！感谢支持！' };
};

// 检查模块是否可用
export const isModuleAvailable = (moduleId: string): boolean => {
  if (isActivated()) return true;
  return FREE_MODULES.includes(moduleId);
};

// 获取激活信息
export const getActivationInfo = (): { activated: boolean; activatedAt?: string } => {
  try {
    const data = localStorage.getItem('mechmat_activation');
    if (!data) return { activated: false };
    const parsed = JSON.parse(data);
    return {
      activated: parsed.activated === true,
      activatedAt: parsed.activatedAt
    };
  } catch {
    return { activated: false };
  }
};

// 控制台工具：生成激活码哈希
// 在浏览器控制台运行: generateNewCode('YOUR_CODE')
if (typeof window !== 'undefined') {
  (window as any).generateNewCode = (code: string) => {
    console.log(`激活码: ${code}`);
    console.log(`哈希值: '${generateCodeHash(code)}'`);
    console.log('将哈希值添加到 VALID_CODE_HASHES 数组中');
  };
}

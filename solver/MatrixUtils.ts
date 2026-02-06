// ==========================================
// 矩阵运算工具函数
// ==========================================
// 
// 提供纯数学矩阵运算功能，无力学逻辑
//

/**
 * 创建零矩阵
 */
export function createMatrix(rows: number, cols: number): number[][] {
  return Array(rows).fill(0).map(() => Array(cols).fill(0));
}

/**
 * 创建零向量
 */
export function createVector(size: number): number[] {
  return Array(size).fill(0);
}

/**
 * 高斯消元法求解线性方程组 Ax = b
 * @param A 系数矩阵
 * @param b 右端项向量
 * @returns 解向量 x，若矩阵奇异则返回 null
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const aug = A.map((row, i) => [...row, b[i]]);
  
  // 前向消元
  for (let col = 0; col < n; col++) {
    // 选主元
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    
    // 检查主元是否为零
    if (Math.abs(aug[col][col]) < 1e-12) continue;
    
    // 消元
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }
  
  // 回代
  const x = createVector(n);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-12) {
      x[i] = 0;
      continue;
    }
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j];
    }
    x[i] /= aug[i][i];
  }
  
  return x;
}

/**
 * 矩阵乘法 C = A × B
 */
export function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = B[0].length;
  const p = B.length;
  const C = createMatrix(m, n);
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < p; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  
  return C;
}

/**
 * 矩阵转置
 */
export function transpose(A: number[][]): number[][] {
  const m = A.length;
  const n = A[0].length;
  const B = createMatrix(n, m);
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      B[j][i] = A[i][j];
    }
  }
  
  return B;
}

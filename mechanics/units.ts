// 内部计算单位：N、mm、MPa、N·mm；显示和输入在边界转换。
export const kNToN = (value: number) => value * 1000;
export const nToKN = (value: number) => value / 1000;
export const mToMm = (value: number) => value * 1000;
export const mmToM = (value: number) => value / 1000;
export const gPaToMPa = (value: number) => value * 1000;
export const mPaToGPa = (value: number) => value / 1000;
export const nmToNmm = (value: number) => value * 1000;
export const nmmToNm = (value: number) => value / 1000;
export const mjToJ = (value: number) => value / 1000;
export const radiansToDegrees = (value: number) => value * 180 / Math.PI;
export const degreesToRadians = (value: number) => value * Math.PI / 180;

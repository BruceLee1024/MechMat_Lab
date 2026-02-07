import React from "react";

export interface FormulaItem { label: string; formula: string; }

export interface BeamFormula {
  id: string; name: string; group: string;
  fbd: React.ReactNode;
  sfd: React.ReactNode;
  bmd: React.ReactNode;
  formulas: FormulaItem[];
}

export interface SectionFormula {
  id: string; name: string; group: string; diagram: React.ReactNode; formulas: FormulaItem[];
}

export interface BasicFormula {
  id: string;
  name: string;
  group: string;
  formulas: FormulaItem[];
  params: string; // 参数说明
}

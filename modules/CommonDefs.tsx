
import React from "react";

export const CommonDefs = () => (
  <defs>
    {/* Hatch Pattern for Supports */}
    <pattern id="hatchPattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1" />
    </pattern>

    {/* Force Arrow (Rose - Loads) */}
    <marker id="arrowForce" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <path d="M0,0 L10,3.5 L0,7 L2,3.5 Z" fill="#e11d48" />
    </marker>
    
    {/* Vector Arrow (Indigo - Vectors/Geometry) */}
    <marker id="arrowVector" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <path d="M0,0 L10,3.5 L0,7 L2,3.5 Z" fill="#4f46e5" />
    </marker>

    {/* Dimension Arrow (Slate - Measurements) */}
    <marker id="arrowDim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6 L1.5,3 Z" fill="#64748b" />
    </marker>
  </defs>
);

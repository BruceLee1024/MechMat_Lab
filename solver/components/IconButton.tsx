import React from "react";

export const IconButton = ({
  icon: Icon,
  label,
  tooltip,
  active,
  onClick,
  disabled,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  tooltip?: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) => {
  const baseClass = "p-2 rounded-lg transition-all flex items-center justify-center relative group";
  const variantClass = {
    default: active 
      ? "bg-indigo-600 text-white shadow-sm" 
      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    danger: "bg-rose-100 text-rose-600 hover:bg-rose-200",
  }[variant];
  const disabledClass = disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${disabledClass}`}
    >
      <Icon className="w-4 h-4" />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 9999 }}>
        {tooltip || label}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
      </div>
    </button>
  );
};

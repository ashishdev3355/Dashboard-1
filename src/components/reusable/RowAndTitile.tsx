import React from 'react';

interface RowAndTitleProps {
  title: string;
  value: string | number;
}

const RowAndTitle: React.FC<RowAndTitleProps> = ({ title, value }) => {
  return (
    <div className="flex flex-col py-3 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</span>
      <span className="text-sm font-black text-slate-700 tracking-tight">{value || "-"}</span>
    </div>
  );
};

export default RowAndTitle;

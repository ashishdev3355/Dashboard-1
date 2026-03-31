import React from 'react';

interface HeaderAndValueProps {
  header?: boolean;
  Title: string | number;
  className?: string;
}

const HeaderAndValue: React.FC<HeaderAndValueProps> = ({ header, Title, className = '' }) => {
  if (header) {
    return (
      <th className={`px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50 ${className}`}>
        {Title}
      </th>
    );
  }

  return (
    <td className={`px-4 py-3 text-sm font-medium text-slate-600 ${className}`}>
      {Title || "-"}
    </td>
  );
};

export default HeaderAndValue;

import React from 'react';

interface TableHeadProps {
  columns: string[];
}

const TableHead: React.FC<TableHeadProps> = ({ columns }) => {
  return (
    <>
      {columns.map((column, index) => (
        <th
          key={index}
          className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 first:rounded-tl-xl last:rounded-tr-xl"
        >
          <div className="flex items-center gap-2">
            <span>{column}</span>
          </div>
        </th>
      ))}
    </>
  );
};

export default TableHead;
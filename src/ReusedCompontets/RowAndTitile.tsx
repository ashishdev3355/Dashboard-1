import React from 'react';

interface RowAndTitleProps {
  title: string;
  value?: string | number | null;
}

const RowAndTitle: React.FC<RowAndTitleProps> = ({ title, value }) => {
  return (
    <>
      <th className="border px-4 py-2 ">{title}</th>
      <td className="border px-4 py-2">{value ?? 'N/A'}</td>
    </>
  );
};

export default RowAndTitle;

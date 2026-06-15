interface RowType {
  header?: boolean | undefined;
  Title: string | number | null;
}

function HeaderAndValue({ header, Title }: RowType) {
  return (
    <>
      {header ? (
        <th className="border px-4 py-2">{Title}</th>
      ) : (
        <td className="border px-4 py-2">{Title}</td>
      )}
    </>
  );
}

export default HeaderAndValue;

const TableHead: React.FC<{columns : string[]}> = ({columns}) => {
    return(
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          {
            columns.map((col,idx) => (
              <th
              key={idx}
              className="border px-3 py-2 text-left"
              >
                {col}
              </th>
            ))
          }
        </tr>

      </thead>
    )
}


export default TableHead;
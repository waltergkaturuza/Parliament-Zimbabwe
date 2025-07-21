// src/components/shared/DataTable.tsx
interface DataTableProps<T> {
    data: T[];
    columns: {
      header: string;
      accessor: string | ((row: T) => React.ReactNode);
    }[];
    isLoading?: boolean;
  }
  
  export function DataTable<T>({ data, columns, isLoading }: DataTableProps<T>) {
    if (isLoading) return <div>Loading...</div>;
  
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : (row as any)[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

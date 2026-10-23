import type { FinishEntry, Frame, HorseInput } from "../sim/types";
import { rankingTable } from "./rankingTable";

type RankingProps = {
  horses: HorseInput[];
  frame: Frame;
  finish: FinishEntry[] | null;
};

export function Ranking({ horses, frame, finish }: RankingProps) {
  const table = rankingTable(horses, frame, finish);

  return (
    <aside className="ranking">
      <h2>{table.title}</h2>
      <table>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column.header} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, index) => (
                <td
                  key={table.columns[index]?.header ?? index}
                  className={table.columns[index]?.className}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

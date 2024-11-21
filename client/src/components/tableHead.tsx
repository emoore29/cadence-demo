import { Table } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

interface TableHeadProps {
  type: string;
}

export default function TableHead({ type }: TableHeadProps) {
  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Title</Table.Th>
        <Table.Th>Album</Table.Th>
        <Table.Th style={{ minWidth: "35px", width: "35px" }}></Table.Th>
        <Table.Th
          style={{ minWidth: "50px", width: "50px", textAlign: "right" }}
        >
          <IconClock size={18} stroke={2} />
        </Table.Th>
        {type === "playlist" && (
          // Columns for dropdown menu & pinned
          <>
            <Table.Th style={{ minWidth: "35px", width: "35px" }}></Table.Th>
            <Table.Th style={{ minWidth: "35px", width: "35px" }}></Table.Th>
          </>
        )}
        {type === "recommended" && (
          // Column for "Add" button
          <Table.Th style={{ minWidth: "35px", width: "35px" }}></Table.Th>
        )}
      </Table.Tr>
    </Table.Thead>
  );
}

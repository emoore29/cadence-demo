import { Table } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconClock } from "@tabler/icons-react";

interface TableHeadProps {
  type: string;
}

export default function TableHead({ type }: TableHeadProps) {
  const isMobile = useMediaQuery("(max-width: 50em)");
  const actionBtnColWidth = "25px";
  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Title</Table.Th>
        {!isMobile && <Table.Th>Album</Table.Th>}
        {/* Saved */}
        {!isMobile && (
          <Table.Th
            style={{ minWidth: actionBtnColWidth, width: actionBtnColWidth }}
          ></Table.Th>
        )}
        {/* Track length */}
        <Table.Th
          style={{
            minWidth: "50px",
            width: "50px",
            textAlign: "right",
            paddingRight: "5px",
          }}
        >
          <IconClock size={18} stroke={2} />
        </Table.Th>
        {/* Columns for dropdown menu & pinned */}
        {type === "playlist" && (
          <>
            <Table.Th
              style={{ minWidth: actionBtnColWidth, width: actionBtnColWidth }}
            ></Table.Th>
          </>
        )}
        {/*  Column for "Add" button */}
        {type === "recommended" && (
          <Table.Th style={{ minWidth: "40px", width: "40px" }}></Table.Th>
        )}
      </Table.Tr>
    </Table.Thead>
  );
}

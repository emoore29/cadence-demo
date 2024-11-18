import { Table, Skeleton } from "@mantine/core";

export default function LoadingPlaylist() {
  const skeletonArray = Array.from({ length: 8 }, (value, index) => index);

  const loadingRows = skeletonArray.map(() => (
    <Table.Tr>
      <Table.Td></Table.Td>
      <Table.Td>
        <Skeleton height={10} radius="xl" width="50%" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={10} radius="xl" width="50%" />
      </Table.Td>
      <Table.Td>
        <Skeleton height={10} radius="xl" width="70%" />
      </Table.Td>
      <Table.Td></Table.Td>
      <Table.Td></Table.Td>
      <Table.Td></Table.Td>
    </Table.Tr>
  ));

  return (
    <Table
      highlightOnHoverColor="rgba(0,0,0,0.1)"
      withRowBorders={false}
      highlightOnHover
      horizontalSpacing="xs"
      verticalSpacing="xs"
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th style={{ width: "45%" }}>Title</Table.Th>
          <Table.Th style={{ width: "45%" }}>Album</Table.Th>
          <Table.Th>Length</Table.Th>
          <Table.Th></Table.Th>
          <Table.Th></Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{loadingRows}</Table.Tbody>
    </Table>
  );
}

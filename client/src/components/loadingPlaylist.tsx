import { Table } from "@mantine/core";
import SkeletonRow from "./skeletonRow";
import TableHead from "./tableHead";

interface LoadingPlaylistProps {
  targetTracks: number;
}

// Skeleton playlist to display while real playlist is still being generated
export default function LoadingPlaylist({
  targetTracks,
}: LoadingPlaylistProps) {
  const skeletonArray = Array.from(
    { length: targetTracks },
    (value, index) => index
  );

  const loadingRows = skeletonArray.map((item) => <SkeletonRow key={item} />);

  return (
    <Table
      className="skeletonTable"
      highlightOnHoverColor="rgba(0,0,0,0.1)"
      withRowBorders={false}
      highlightOnHover
      horizontalSpacing="xs"
      verticalSpacing="xs"
      layout="auto"
    >
      <TableHead type={"skeleton"} />
      <Table.Tbody>{loadingRows}</Table.Tbody>
    </Table>
  );
}

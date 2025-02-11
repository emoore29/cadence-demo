import { Table } from "@mantine/core";
import SkeletonRow from "../SkeletonRow/skeletonRow";
import TableHead from "../TableHead/tableHead";
import styles from "./loadingPlaylist.module.css";

interface LoadingPlaylistProps {
  targetTracks: number;
}

// Skeleton playlist to display while real playlist is still being generated
export default function LoadingPlaylist({
  targetTracks,
}: LoadingPlaylistProps) {
  const skeletonArray = Array.from(
    { length: targetTracks },
    (_, index) => index
  );

  const loadingRows = skeletonArray.map((item) => <SkeletonRow key={item} />);

  return (
    <Table
      className={styles.skeletonTable}
      highlightOnHoverColor="rgba(0,0,0,0.1)"
      withRowBorders={false}
      highlightOnHover
      layout="auto"
    >
      <TableHead type={"skeleton"} />
      <Table.Tbody>{loadingRows}</Table.Tbody>
    </Table>
  );
}

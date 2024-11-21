import { Table, Skeleton } from "@mantine/core";
import TableHead from "./tableHead";

// interface LoadingPlaylistProps {
//   targetTracks: number;
// }

// Skeleton playlist to display while real playlist is still being generated
export default function LoadingPlaylist() {
  const skeletonArray = Array.from({ length: 5 }, (value, index) => index);

  function getRandomWidth(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  const loadingRows = skeletonArray.map((item) => (
    <Table.Tr key={item}>
      {/* Album art, track name, artist */}
      <Table.Td>
        <div className="trackDisplaySkeleton">
          <Skeleton height={"40px"} width={"40px"} radius={"10%"} />
          <div className="titleAndArtistSkeleton">
            <Skeleton
              height={8}
              width={`${getRandomWidth(15, 22)}%`}
              radius={"xl"}
            />
            <Skeleton
              height={8}
              width={`${getRandomWidth(18, 25)}%`}
              radius={"xl"}
            />
          </div>
        </div>
      </Table.Td>
      {/* Album name */}
      <Table.Td>
        <Skeleton height={8} radius="xl" width={`${getRandomWidth(13, 20)}%`} />
      </Table.Td>
      {/* Like button */}
      <Table.Td></Table.Td>
      {/* Track length */}
      <Table.Td className="trackTimeSkeletonTd">
        <Skeleton
          className="trackTimeSkeleton"
          height={8}
          radius="xl"
          width={30}
        />
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table
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

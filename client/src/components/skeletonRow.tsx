import { Table, Skeleton } from "@mantine/core";
import { getRandomWidth } from "@/helpers/general";

export default function SkeletonRow() {
  return (
    <Table.Tr>
      {/* Album art, track name, artist */}
      <Table.Td>
        <div className="trackDisplaySkeleton">
          <Skeleton className="albumArtSkeleton" radius={"10%"} />
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
  );
}

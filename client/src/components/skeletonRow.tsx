import { getRandomNumber } from "@/helpers/general";
import { Skeleton, Table } from "@mantine/core";

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
              width={`${getRandomNumber(15, 22)}%`}
              radius={"xl"}
            />
            <Skeleton
              height={8}
              width={`${getRandomNumber(18, 25)}%`}
              radius={"xl"}
            />
          </div>
        </div>
      </Table.Td>
      {/* Album name */}
      <Table.Td>
        <Skeleton
          height={8}
          radius="xl"
          width={`${getRandomNumber(13, 20)}%`}
        />
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

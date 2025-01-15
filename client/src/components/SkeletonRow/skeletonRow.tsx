import { getRandomNumber } from "@/helpers/general";
import { Skeleton, Table } from "@mantine/core";
import styles from "./skeletonRow.module.css";

export default function SkeletonRow() {
  return (
    <Table.Tr>
      <Table.Td>
        <div className={styles.trackDisplaySkeleton}>
          <Skeleton className={styles.albumArtSkeleton} radius={"10%"} />
          <div className={styles.titleAndArtistSkeleton}>
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
      <Table.Td>
        <Skeleton
          height={8}
          radius="xl"
          width={`${getRandomNumber(13, 20)}%`}
        />
      </Table.Td>
      <Table.Td></Table.Td>
      <Table.Td>
        <Skeleton
          className={styles.trackTimeSkeleton}
          height={8}
          radius="xl"
          width={30}
        />
      </Table.Td>
    </Table.Tr>
  );
}

import { Skeleton } from "@ds/ui";
import styles from "./loading.module.css";
import pageStyles from "./page.module.css";

export default function Loading() {
  return (
    <main className={pageStyles.main} aria-busy="true">
      <div className={pageStyles.titleRow}>
        <Skeleton variant="text" width="10rem" height="2rem" />
        <Skeleton variant="block" width="10rem" height="2.5rem" />
      </div>
      <Skeleton variant="block" width="100%" height="3rem" />
      <ul className={styles.grid}>
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className={styles.card}>
            <Skeleton variant="block" width="100%" height="10rem" />
            <Skeleton variant="text" width="70%" height="1.25rem" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="45%" />
          </li>
        ))}
      </ul>
    </main>
  );
}

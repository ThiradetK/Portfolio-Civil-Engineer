import styles from "./SectionLabel.module.scss";

export default function SectionLabel({ number, label }) {
  return (
    <div className={styles.label}>
      <span className={styles.marker} aria-hidden />
      <span className={styles.number}>{number}</span>
      <span className={styles.divider} />
      <span className={styles.text}>{label}</span>
    </div>
  );
}

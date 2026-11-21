import { usePortfolioStore } from "../store/usePortfolioStore";
import styles from "./SiteNav.module.scss";

const links = [
  ["About", "about"],
  ["Experience", "experience"],
  ["Skills", "skills"],
  ["Projects", "projects"],
];

export default function SiteNav() {
  const profile = usePortfolioStore((state) => state.profile);
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#hero" aria-label={`${profile.name}, home`}>
        <span className={styles.mark}>TK</span>
        <span className={styles.brandText}><strong>THIRADET KAWITA</strong><small>CIVIL ENGINEER</small></span>
      </a>
      <nav className={styles.nav} aria-label="Main navigation">
        {links.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>
      <a className={styles.contact} href="#contact">Contact <span aria-hidden="true">↗</span></a>
    </header>
  );
}

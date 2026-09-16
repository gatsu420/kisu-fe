import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isQuery = pathname === "/";
  const isTool = pathname.startsWith("/tool");

  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>kisu</h1>
      <nav className={styles.nav}>
        <button
          className={`${styles.navBtn} ${isQuery ? styles.navBtnActive : ""}`}
          onClick={() => navigate("/")}
        >
          Query
        </button>
        <div className={styles.dropdown}>
          <button
            className={`${styles.navBtn} ${isTool ? styles.navBtnActive : ""}`}
            onClick={() => navigate("/tool/add")}
          >
            Tools
            <span className={styles.caret}>▾</span>
          </button>
          <div className={styles.dropdownMenu}>
            <button
              className={`${styles.dropdownItem} ${
                pathname === "/tool/add" ? styles.dropdownItemActive : ""
              }`}
              onClick={() => navigate("/tool/add")}
            >
              Add New Tool
            </button>
            <button
              className={`${styles.dropdownItem} ${
                pathname === "/tool/list" ? styles.dropdownItemActive : ""
              }`}
              onClick={() => navigate("/tool/list")}
            >
              List Tools
            </button>
          </div>
        </div>
      </nav>
      <button
        className={styles.signOutBtn}
        onClick={() => navigate("/login?signout")}
      >
        Sign out
      </button>
    </header>
  );
}

import Image from "next/image";
import styles from "../../styles/page.module.css";
import NavBar from "../../components/NavBar";

export default function Blog() {
    return (
        <main className={styles.main}>
            <NavBar />
        </main>
    );
}

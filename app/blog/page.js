import Image from "next/image";
import styles from "../../styles/page.module.css";
import NavBar from "../../components/NavBar";

export const metadata = {
    title: "Blog",
    description:
        "Artigos e publicações de Vitor Arakaki sobre engenharia de dados, Python, AWS, ETL e as melhores práticas do setor.",
    openGraph: {
        title: "Blog | Vitor Arakaki",
        description:
            "Artigos e publicações de Vitor Arakaki sobre engenharia de dados, Python, AWS, ETL e as melhores práticas do setor.",
    },
};

export default function Blog() {
    return (
        <main className={styles.main}>
            <NavBar />
        </main>
    );
}

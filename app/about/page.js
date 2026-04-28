import Image from "next/image";
import styles from "../../styles/page.module.css";
import NavBar from "../../components/NavBar";

export const metadata = {
    title: "Sobre",
    description:
        "Saiba mais sobre Vitor Guirardeli Arakaki — Engenheiro de Dados Sênior nascido em São Bernardo do Campo, com certificações AWS e experiência em Python, ETL e arquitetura de dados.",
    openGraph: {
        title: "Sobre | Vitor Arakaki",
        description:
            "Saiba mais sobre Vitor Guirardeli Arakaki — Engenheiro de Dados Sênior nascido em São Bernardo do Campo, com certificações AWS e experiência em Python, ETL e arquitetura de dados.",
    },
};

export default function About() {
    return (
        <main className={styles.main}>
            <NavBar />
        </main>
    );
}

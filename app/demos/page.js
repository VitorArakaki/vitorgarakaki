import fs from "fs";
import path from "path";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import styles from "../../styles/Demos.module.css";

export const metadata = {
    title: "Demos ao vivo",
    description: "Experimente ferramentas interativas construídas com IA, 3D e automação — direto no navegador, sem instalação.",
};

function loadProjectItems() {
    const filePath = path.join(process.cwd(), "public/assets/data/projects/project-items.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
}

export default function DemosPage() {
    const allProjects = loadProjectItems();
    const demos = allProjects.filter((p) => p.hasDemo);
    const aiCount = demos.filter((p) => p.isAiDemo).length;
    const freeCount = demos.filter((p) => !p.isAiDemo).length;

    return (
        <main className={styles.page}>
            <NavBar />

            {/* ── Hero ── */}
            <div className={styles.hero}>
                <span className={styles.heroEyebrow}>Interativo</span>
                <h1 className={styles.heroTitle}>Demos ao vivo</h1>
                <p className={styles.heroSub}>
                    Ferramentas reais prontas para usar no navegador — sem instalação,
                    sem configuração. Explore, teste e veja o código por trás de cada uma.
                </p>

                <div className={styles.statsStrip}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{demos.length}</span>
                        <span className={styles.statLabel}>demos disponíveis</span>
                    </div>
                    {aiCount > 0 && (
                        <>
                            <div className={styles.statDivider} />
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{aiCount}</span>
                                <span className={styles.statLabel}>com inteligência artificial</span>
                            </div>
                        </>
                    )}
                    {freeCount > 0 && (
                        <>
                            <div className={styles.statDivider} />
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{freeCount}</span>
                                <span className={styles.statLabel}>totalmente gratuitas</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Grid ── */}
            <div className={styles.grid}>
                {demos.map((demo) => (
                    <DemoCard key={demo.slug} demo={demo} />
                ))}
            </div>
        </main>
    );
}

function DemoCard({ demo }) {
    const demoPath = `${demo.pagePath}/demo`;

    return (
        <div className={styles.card}>
            {/* Thumbnail */}
            <div className={styles.thumbWrap}>
                <img
                    src={demo.image}
                    alt={demo.title}
                    className={styles.thumb}
                />
                <div className={styles.thumbOverlay} />
            </div>

            {/* Body */}
            <div className={styles.cardBody}>
                {/* Badges */}
                <div className={styles.badges}>
                    {demo.isAiDemo ? (
                        <>
                            <span className={styles.badgeAi}>
                                <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                                    <polygon points="1,0.5 8.5,4.5 1,8.5" />
                                </svg>
                                IA
                            </span>
                            <span className={styles.badgeLimit}>3 usos grátis / dia</span>
                        </>
                    ) : (
                        <span className={styles.badgeFree}>
                            ✓ Gratuito
                        </span>
                    )}
                </div>

                {/* Title + description */}
                <h2 className={styles.cardTitle}>{demo.title}</h2>
                <p className={styles.cardDesc}>{demo.description}</p>

                {/* Footer */}
                <div className={styles.cardFooter}>
                    <Link href={demoPath} className={styles.cardCta}>
                        Abrir demo
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7h8M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                    <Link href={demo.pagePath} className={styles.cardProjectLink}>
                        Ver projeto →
                    </Link>
                </div>
            </div>
        </div>
    );
}

import fs from "fs";
import path from "path";
import NavBar from "../../../components/NavBar";
import BlinkingTitle from "../../../components/BlinkingTitle";
import DocSidebar from "../../../components/DocSidebar";
import styles from "../styles/Projects.module.css";
import { notFound } from "next/navigation";

function loadProjectItems() {
    const filePath = path.join(process.cwd(), "public/assets/data/projects/project-items.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
}

function loadProjectData(jsonFile) {
    const filePath = path.join(process.cwd(), "public", jsonFile);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
}

export function generateStaticParams() {
    const projectItems = loadProjectItems();
    return projectItems.map((item) => ({ slug: item.slug }));
}

export default async function ProjectPage({ params }) {
    const { slug } = await params;
    const projectItems = loadProjectItems();
    const project = projectItems.find((item) => item.slug === slug);

    if (!project) {
        notFound();
    }

    const projectData = loadProjectData(project.jsonFile);
    const sections = projectData?.data
        ? [...projectData.data].sort((a, b) => a.id - b.id)
        : [];

    return (
        <main className={styles.main}>
            <NavBar />
            <div className={styles.pageTitle}>
                <BlinkingTitle
                    title={project.title}
                    idVar={project.slug}
                    blinkingItem="_"
                    fontSize="2vw"
                />
            </div>
            <div className={styles.docLayout}>
                <div className={styles.docContent}>
                    {sections.map((section) => {
                        if (section.type === "text") {
                            return (
                                <div key={section.id} id={`section-${section.id}`} className={styles.section}>
                                    <div className={styles.sectionTitle}>
                                        <BlinkingTitle
                                            title={section.title}
                                            idVar={`blink-section-${section.id}`}
                                            blinkingItem=""
                                            fontSize="1.3vw"
                                        />
                                    </div>
                                    <p className={styles.sectionText}>
                                        {section.content}
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                <DocSidebar sections={sections} />
            </div>
        </main>
    );
}

import fs from "fs";
import path from "path";
import styles from "./styles/Projects.module.css";
import NavBar from "../../components/NavBar";
import BlinkingTitle from "../../components/BlinkingTitle";
import CardShow from "../../components/CardShow";

function loadProjectItems() {
    const filePath = path.join(process.cwd(), "public/assets/data/projects/project-items.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
}

export default function Projects() {
    const projectItems = loadProjectItems();
    return (
        <main className={styles.main}>
            <NavBar />
            <div id="projectsTitle" className={styles.pageTitle}>
                <BlinkingTitle title="Projects" idVar="projects" blinkingItem="_" fontSize="2vw" />
            </div>
            <div className={styles.cardShowContainer}>
                <CardShow items={projectItems} />
            </div>
        </main>
    );
}

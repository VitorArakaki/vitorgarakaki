import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import NavBar from "../../../../components/NavBar";
import ExcalidrawDemo from "../../../../components/ExcalidrawDemo";
import EnvironmentVirtualizer from "../../../../components/EnvironmentVirtualizer";
import ArchitectureDeployment from "../../../../components/ArchitectureDeployment";
import styles from "../../styles/Projects.module.css";

function loadProjectItems() {
    const filePath = path.join(process.cwd(), "public/assets/data/projects/project-items.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
}

const demoComponents = {
    "custom-excalidraw": ExcalidrawDemo,
    "environment-virtualizer": EnvironmentVirtualizer,
    "architecture-deployment": ArchitectureDeployment,
};

export function generateStaticParams() {
    const projectItems = loadProjectItems();
    return projectItems
        .filter((item) => item.hasDemo)
        .map((item) => ({ slug: item.slug }));
}

export default async function DemoPage({ params }) {
    const { slug } = await params;
    const projectItems = loadProjectItems();
    const project = projectItems.find((item) => item.slug === slug);

    if (!project || !project.hasDemo) {
        notFound();
    }

    const DemoContent = demoComponents[slug] ?? null;

    return (
        <main className={styles.main}>
            <NavBar />
            <div className={styles.demoContainer}>
                {DemoContent && <DemoContent />}
            </div>
        </main>
    );
}

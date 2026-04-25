import fs from "fs";
import path from "path";
import Link from "next/link";
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

async function fetchLinkPreview(url) {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "bot" },
            signal: AbortSignal.timeout(5000),
        });
        const html = await res.text();

        const getMetaContent = (property) => {
            const match = html.match(
                new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, "i")
            ) || html.match(
                new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, "i")
            );
            return match ? match[1] : null;
        };

        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const hostname = new URL(url).hostname;

        return {
            title: getMetaContent("og:title") || titleMatch?.[1] || url,
            description: getMetaContent("og:description") || getMetaContent("description") || "",
            siteName: getMetaContent("og:site_name") || hostname,
            favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
            url,
        };
    } catch {
        const hostname = new URL(url).hostname;
        return {
            title: url,
            description: "",
            siteName: hostname,
            favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
            url,
        };
    }
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

    const linkPreviews = {};
    for (const section of sections) {
        if (section.type === "link" && section.content) {
            const urls = section.content.split(",").map((u) => u.trim()).filter(Boolean);
            linkPreviews[section.id] = await Promise.all(urls.map(fetchLinkPreview));
        }
    }

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
                {project.hasDemo && (
                    <Link href={`/projects/${slug}/demo`} className={styles.demoButton}>
                        DEMO
                    </Link>
                )}
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
                                        {section.content.split("\n").map((line, i, arr) => (
                                            <span key={i}>
                                                {line}
                                                {i < arr.length - 1 && <br />}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            );
                        }
                        if (section.type === "link") {
                            const previews = linkPreviews[section.id] || [];
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
                                    <div className={styles.linkPreviewWrapper}>
                                        {previews.map((preview, idx) => (
                                            <div key={idx} className={styles.linkPreviewItem}>
                                                <a
                                                    href={preview.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.linkPreview}
                                                >
                                                    <div className={styles.linkPreviewBody}>
                                                        <span className={styles.linkPreviewSite}>
                                                            {preview?.favicon && (
                                                                <img
                                                                    src={preview.favicon}
                                                                    alt=""
                                                                    className={styles.linkPreviewFavicon}
                                                                />
                                                            )}
                                                            {preview?.siteName}
                                                        </span>
                                                        <span className={styles.linkPreviewTitle}>
                                                            {preview?.title}
                                                        </span>
                                                        {preview?.description && (
                                                            <span className={styles.linkPreviewDescription}>
                                                                {preview.description}
                                                            </span>
                                                        )}
                                                        <span className={styles.linkPreviewUrl}>
                                                            {preview.url}
                                                        </span>
                                                    </div>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
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

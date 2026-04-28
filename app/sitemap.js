import fs from "fs";
import path from "path";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vitorgarakaki.vercel.app";

function loadProjectItems() {
    const filePath = path.join(process.cwd(), "public/assets/data/projects/project-items.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
}

export default function sitemap() {
    const projectItems = loadProjectItems();

    const staticPages = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${siteUrl}/projects`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${siteUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${siteUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
        },
    ];

    const projectPages = projectItems.map((item) => ({
        url: `${siteUrl}/projects/${item.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
    }));

    return [...staticPages, ...projectPages];
}

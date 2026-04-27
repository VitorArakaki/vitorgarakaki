import fs from "fs";
import path from "path";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import NavBar from "../../../../components/NavBar";
import ExcalidrawDemo from "../../../../components/ExcalidrawDemo";
import EnvironmentVirtualizer from "../../../../components/EnvironmentVirtualizer";
import ArchitectureDeployment from "../../../../components/ArchitectureDeployment";
import DemoPaywall, { UsageWarningBanner } from "../../../../components/DemoPaywall";
import RecordDemoUse from "../../../../components/RecordDemoUse";
import { checkDemoAccess, FREE_LIMIT } from "../../../../lib/demoAccess";
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

// Demos that are purely client-side (no backend API to intercept for rate-limiting)
const CLIENT_ONLY_DEMOS = new Set(['custom-excalidraw']);

export default async function DemoPage({ params }) {
    const { slug } = await params;
    const projectItems = loadProjectItems();
    const project = projectItems.find((item) => item.slug === slug);

    if (!project || !project.hasDemo) {
        notFound();
    }

    // --- Access control ---
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const cookieHeader = authToken ? `auth_token=${authToken}` : '';

    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (headersList.get('x-real-ip') ?? '127.0.0.1');

    const access = await checkDemoAccess({ cookieHeader, ip }, slug);

    const DemoContent = demoComponents[slug] ?? null;

    // Show paywall when user has no remaining free uses
    if (!access.allowed) {
        return (
            <main className={styles.main}>
                <NavBar />
                <DemoPaywall slug={slug} />
            </main>
        );
    }

    // Warn when 1 or 2 uses remain (only for free-tier visitors)
    const showWarning = !access.unlimited && access.remaining < FREE_LIMIT;

    return (
        <main className={styles.main}>
            <NavBar />
            {showWarning && (
                <div style={{ padding: '0 24px', maxWidth: 720, margin: '16px auto 0' }}>
                    <UsageWarningBanner remaining={access.remaining} slug={slug} />
                </div>
            )}
            <div className={styles.demoContainer}>
                {DemoContent && <DemoContent />}
                {/* Record usage for client-only demos (no API to intercept) */}
                {CLIENT_ONLY_DEMOS.has(slug) && !access.unlimited && (
                    <RecordDemoUse slug={slug} />
                )}
            </div>
        </main>
    );
}

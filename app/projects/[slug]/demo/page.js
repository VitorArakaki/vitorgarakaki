import fs from "fs";
import path from "path";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import NavBar from "../../../../components/NavBar";
import ExcalidrawDemo from "../../../../components/ExcalidrawDemo";
import EnvironmentVirtualizer from "../../../../components/EnvironmentVirtualizer";
import ArchitectureDeployment from "../../../../components/ArchitectureDeployment";
import DemoPaywall, { FreeUserBanner } from "../../../../components/DemoPaywall";
import RecordDemoUse from "../../../../components/RecordDemoUse";
import { checkDemoAccess, getUserSubscription, FREE_LIMIT, AI_SLUGS } from "../../../../lib/demoAccess";
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

    // --- Auth context ---
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const cookieHeader = authToken ? `auth_token=${authToken}` : '';

    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (headersList.get('x-real-ip') ?? '127.0.0.1');

    const isAiDemo = AI_SLUGS.has(slug);

    // Non-AI demos are always free — only check subscription for the info banner
    let access = { allowed: true, unlimited: true, remaining: null };
    let showFreeUserBanner = false;

    if (isAiDemo) {
        access = await checkDemoAccess({ cookieHeader, ip }, slug);
        showFreeUserBanner = !access.unlimited;
    } else {
        const { isSubscribed } = await getUserSubscription({ cookieHeader });
        showFreeUserBanner = !isSubscribed;
    }

    const DemoContent = demoComponents[slug] ?? null;

    // Show paywall when AI demo user has exhausted daily free uses
    if (isAiDemo && !access.allowed) {
        return (
            <main className={styles.main}>
                <NavBar />
                <DemoPaywall slug={slug} />
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <NavBar />
            {showFreeUserBanner && (
                <div className={styles.demoBannerRow}>
                    <div className={styles.demoBannerInner}>
                        <FreeUserBanner isAiDemo={isAiDemo} remaining={isAiDemo ? access.remaining : null} />
                    </div>
                </div>
            )}
            <div className={styles.demoContainer}>
                {DemoContent && <DemoContent />}
                {/* Record usage only for client-only AI demos (no backend API to intercept) */}
                {!isAiDemo === false && !access.unlimited && (
                    <RecordDemoUse slug={slug} />
                )}
            </div>
        </main>
    );
}

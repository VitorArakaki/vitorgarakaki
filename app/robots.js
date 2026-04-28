const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vitorgarakaki.vercel.app";

export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/account", "/subscription"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}

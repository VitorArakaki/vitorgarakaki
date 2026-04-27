'use client';

import { useEffect, useRef } from 'react';

/**
 * Invisible client component that fires a single POST to /api/demo/use
 * on mount. Used for demos that have no backend API (e.g. ExcalidrawDemo)
 * so we can still track/limit access by IP.
 */
export default function RecordDemoUse({ slug }) {
    const fired = useRef(false);

    useEffect(() => {
        if (fired.current) return;
        fired.current = true;
        fetch('/api/demo/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
        }).catch(() => { /* silent — non-blocking */ });
    }, [slug]);

    return null;
}

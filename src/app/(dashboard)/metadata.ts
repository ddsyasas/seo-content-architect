import type { Metadata } from 'next';

// All dashboard pages should not be indexed
export const dashboardMetadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
};

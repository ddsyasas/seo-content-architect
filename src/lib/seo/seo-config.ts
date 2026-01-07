/**
 * SEO SCORING ALGORITHM CONFIGURATION
 * 
 * This file contains all configurable parameters for the SEO scoring system.
 * Modify values here to adjust scoring without changing application logic.
 * 
 * Last Updated: 2026-01-07
 * Version: 1.0
 */

export const SEO_CONFIG = {
    // ============================================
    // CATEGORY WEIGHTS (must sum to 100)
    // ============================================
    weights: {
        targetKeyword: 25,
        metaElements: 20,
        contentStructure: 20,
        readability: 10,
        internalLinks: 10,
        images: 10,
        outboundLinks: 5,
    },

    // ============================================
    // SCORE ZONES
    // ============================================
    scoreZones: {
        poor: { min: 0, max: 40, label: 'Poor', color: '#EF4444' },
        needsWork: { min: 41, max: 60, label: 'Needs Work', color: '#F59E0B' },
        good: { min: 61, max: 80, label: 'Good', color: '#84CC16' },
        excellent: { min: 81, max: 100, label: 'Excellent', color: '#10B981' },
    },

    // ============================================
    // TARGET KEYWORD SETTINGS
    // ============================================
    targetKeyword: {
        density: {
            optimal: { min: 0.8, max: 2.0 },
            acceptable: { min: 0.5, max: 2.5 },
        },
        firstParagraph: {
            optimal: 100,
            acceptable: 150,
        },
        stuffingThreshold: 2.5,
        points: {
            density: 10,
            firstParagraph: 8,
            noStuffing: 7,
        },
    },

    // ============================================
    // META ELEMENTS SETTINGS
    // ============================================
    metaElements: {
        title: {
            length: {
                optimal: { min: 50, max: 60 },
                acceptable: { min: 40, max: 65 },
            },
            keywordPositionBonus: 30,
            points: {
                length: 4,
                hasKeyword: 4,
                keywordPosition: 2,
            },
        },
        description: {
            length: {
                optimal: { min: 150, max: 160 },
                acceptable: { min: 120, max: 170 },
            },
            points: {
                length: 5,
                hasKeyword: 5,
            },
        },
    },

    // ============================================
    // CONTENT STRUCTURE SETTINGS
    // ============================================
    contentStructure: {
        h1: {
            requiredCount: 1,
        },
        h2: {
            wordsPerHeading: 250,
            ratioThresholds: {
                good: 0.9,
                okay: 0.6,
            },
        },
        points: {
            singleH1: 5,
            h1HasKeyword: 5,
            h2HasKeyword: 4,
            properHierarchy: 3,
            h2Frequency: 3,
        },
    },

    // ============================================
    // READABILITY SETTINGS
    // ============================================
    readability: {
        maxParagraphWords: 300,
        points: {
            total: 10,
        },
    },

    // ============================================
    // INTERNAL LINKS SETTINGS
    // ============================================
    internalLinks: {
        linksPerThousandWords: 3,
        thresholds: {
            excellent: 1.0,
            good: 0.75,
            okay: 0.50,
            poor: 0.25,
        },
        points: {
            excellent: 10,
            good: 7,
            okay: 4,
            poor: 2,
            none: 0,
        },
    },

    // ============================================
    // IMAGES SETTINGS
    // ============================================
    images: {
        wordsPerImage: 400,
        thresholds: {
            good: 1.0,
            okay: 0.5,
        },
        points: {
            baseGood: 7,
            baseOkay: 4,
            basePoor: 0,
            allHaveAlt: 2,
            altHasKeyword: 1,
        },
    },

    // ============================================
    // OUTBOUND LINKS SETTINGS
    // ============================================
    outboundLinks: {
        optimal: { min: 1, max: 5 },
        points: {
            optimal: 5,
            excessive: 3,
            none: 0,
        },
    },

    // ============================================
    // UI SETTINGS
    // ============================================
    ui: {
        debounceMs: 1000,
        defaultExpanded: false,
        showPointsBreakdown: true,
    },
};

export type SEOConfig = typeof SEO_CONFIG;

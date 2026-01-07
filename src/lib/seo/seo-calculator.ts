import { SEO_CONFIG } from './seo-config';
import { SEOScoreResult, ArticleContent, SEOCategory, SEOIndicator, IndicatorStatus } from './seo-types';
import { analyzeContent, ContentAnalysis } from './seo-analyzer';

/**
 * Main function to calculate SEO score
 */
export function calculateSEOScore(article: ArticleContent): SEOScoreResult {
    const analysis = analyzeContent(article);

    // Calculate each category
    const targetKeyword = calculateTargetKeywordScore(article, analysis);
    const metaElements = calculateMetaElementsScore(article, analysis);
    const contentStructure = calculateContentStructureScore(article, analysis);
    const readability = calculateReadabilityScore(article, analysis);
    const internalLinks = calculateInternalLinksScore(article, analysis);
    const images = calculateImagesScore(article, analysis);
    const outboundLinks = calculateOutboundLinksScore(article, analysis);

    // Sum total score
    const totalScore = Math.round(
        targetKeyword.score +
        metaElements.score +
        contentStructure.score +
        readability.score +
        internalLinks.score +
        images.score +
        outboundLinks.score
    );

    // Determine zone
    const zone = getScoreZone(totalScore);

    return {
        totalScore,
        maxScore: 100,
        zone: zone.key,
        zoneLabel: zone.label,
        zoneColor: zone.color,
        categories: {
            targetKeyword,
            metaElements,
            contentStructure,
            readability,
            internalLinks,
            images,
            outboundLinks,
        },
    };
}

function getScoreZone(score: number) {
    const { scoreZones } = SEO_CONFIG;

    if (score <= scoreZones.poor.max) {
        return { key: 'poor' as const, ...scoreZones.poor };
    }
    if (score <= scoreZones.needsWork.max) {
        return { key: 'needsWork' as const, ...scoreZones.needsWork };
    }
    if (score <= scoreZones.good.max) {
        return { key: 'good' as const, ...scoreZones.good };
    }
    return { key: 'excellent' as const, ...scoreZones.excellent };
}

// ============================================
// TARGET KEYWORD SCORING
// ============================================
function calculateTargetKeywordScore(article: ArticleContent, analysis: ContentAnalysis): SEOCategory {
    const config = SEO_CONFIG.targetKeyword;
    const indicators: SEOIndicator[] = [];
    let totalPoints = 0;

    if (!article.targetKeyword?.trim()) {
        return {
            id: 'targetKeyword',
            name: 'Target Keyword',
            score: 0,
            maxScore: SEO_CONFIG.weights.targetKeyword,
            indicators: [{
                id: 'no-keyword',
                message: 'No target keyword set',
                status: 'poor',
                points: 0,
                maxPoints: SEO_CONFIG.weights.targetKeyword,
            }],
        };
    }

    // Density check
    const density = analysis.keywordDensity;
    let densityStatus: IndicatorStatus;
    let densityPoints = 0;
    let densityMessage = '';

    if (density >= config.density.optimal.min && density <= config.density.optimal.max) {
        densityStatus = 'good';
        densityPoints = config.points.density;
        densityMessage = `Keyword density is ${density.toFixed(1)}% (optimal range)`;
    } else if (density >= config.density.acceptable.min && density <= config.density.acceptable.max) {
        densityStatus = 'okay';
        densityPoints = config.points.density / 2;
        densityMessage = `Keyword density is ${density.toFixed(1)}% (could be improved)`;
    } else {
        densityStatus = 'poor';
        densityPoints = 0;
        if (density < config.density.acceptable.min) {
            densityMessage = `Keyword density is ${density.toFixed(1)}% - add more keyword mentions`;
        } else {
            densityMessage = `Keyword density is ${density.toFixed(1)}% - reduce to avoid over-optimization`;
        }
    }

    indicators.push({
        id: 'keyword-density',
        message: densityMessage,
        status: densityStatus,
        points: densityPoints,
        maxPoints: config.points.density,
    });
    totalPoints += densityPoints;

    // First paragraph check
    const firstParaPosition = analysis.keywordFirstPosition;
    let firstParaStatus: IndicatorStatus;
    let firstParaPoints = 0;
    let firstParaMessage = '';

    if (firstParaPosition <= config.firstParagraph.optimal) {
        firstParaStatus = 'good';
        firstParaPoints = config.points.firstParagraph;
        firstParaMessage = 'Keyword appears in the first paragraph';
    } else if (firstParaPosition <= config.firstParagraph.acceptable) {
        firstParaStatus = 'okay';
        firstParaPoints = config.points.firstParagraph / 2;
        firstParaMessage = 'Keyword appears early, but move it to the first paragraph for better SEO';
    } else if (firstParaPosition === Infinity) {
        firstParaStatus = 'poor';
        firstParaPoints = 0;
        firstParaMessage = 'Keyword not found in content - add your target keyword';
    } else {
        firstParaStatus = 'poor';
        firstParaPoints = 0;
        firstParaMessage = 'Add your keyword to the introduction paragraph';
    }

    indicators.push({
        id: 'keyword-first-para',
        message: firstParaMessage,
        status: firstParaStatus,
        points: firstParaPoints,
        maxPoints: config.points.firstParagraph,
    });
    totalPoints += firstParaPoints;

    // Stuffing check
    const stuffingStatus: IndicatorStatus = density <= config.stuffingThreshold ? 'good' : 'poor';
    const stuffingPoints = stuffingStatus === 'good' ? config.points.noStuffing : 0;

    indicators.push({
        id: 'keyword-stuffing',
        message: stuffingStatus === 'good'
            ? 'No keyword stuffing detected'
            : 'Keyword stuffing detected - reduce keyword usage to improve readability',
        status: stuffingStatus,
        points: stuffingPoints,
        maxPoints: config.points.noStuffing,
    });
    totalPoints += stuffingPoints;

    return {
        id: 'targetKeyword',
        name: 'Target Keyword',
        score: totalPoints,
        maxScore: SEO_CONFIG.weights.targetKeyword,
        indicators,
    };
}

// ============================================
// META ELEMENTS SCORING
// ============================================
function calculateMetaElementsScore(article: ArticleContent, analysis: ContentAnalysis): SEOCategory {
    const config = SEO_CONFIG.metaElements;
    const indicators: SEOIndicator[] = [];
    let totalPoints = 0;
    const keyword = article.targetKeyword?.toLowerCase().trim() || '';

    // SEO Title length check
    const titleLength = article.seoTitle?.length || 0;
    let titleLengthStatus: IndicatorStatus;
    let titleLengthPoints = 0;
    let titleLengthMessage = '';

    if (titleLength === 0) {
        titleLengthStatus = 'poor';
        titleLengthMessage = 'SEO title is missing - add a compelling title';
    } else if (titleLength >= config.title.length.optimal.min && titleLength <= config.title.length.optimal.max) {
        titleLengthStatus = 'good';
        titleLengthPoints = config.title.points.length;
        titleLengthMessage = `SEO title length is ${titleLength} characters (optimal)`;
    } else if (titleLength >= config.title.length.acceptable.min && titleLength <= config.title.length.acceptable.max) {
        titleLengthStatus = 'okay';
        titleLengthPoints = config.title.points.length / 2;
        titleLengthMessage = `SEO title is ${titleLength} characters (aim for 50-60)`;
    } else {
        titleLengthStatus = 'poor';
        titleLengthMessage = titleLength < config.title.length.acceptable.min
            ? `SEO title is too short (${titleLength} chars) - aim for 50-60 characters`
            : `SEO title is too long (${titleLength} chars) - keep under 60 characters`;
    }

    indicators.push({
        id: 'meta-title-length',
        message: titleLengthMessage,
        status: titleLengthStatus,
        points: titleLengthPoints,
        maxPoints: config.title.points.length,
    });
    totalPoints += titleLengthPoints;

    // SEO Title keyword check
    const titleHasKeyword = keyword && article.seoTitle?.toLowerCase().includes(keyword);
    const titleKeywordPoints = titleHasKeyword ? config.title.points.hasKeyword : 0;

    indicators.push({
        id: 'meta-title-keyword',
        message: titleHasKeyword
            ? 'Target keyword appears in SEO title'
            : 'Add your target keyword to the SEO title',
        status: titleHasKeyword ? 'good' : 'poor',
        points: titleKeywordPoints,
        maxPoints: config.title.points.hasKeyword,
    });
    totalPoints += titleKeywordPoints;

    // Title keyword position bonus
    const titleKeywordPosition = keyword ? article.seoTitle?.toLowerCase().indexOf(keyword) : -1;
    const titleKeywordEarly = titleKeywordPosition !== undefined && titleKeywordPosition >= 0 && titleKeywordPosition <= config.title.keywordPositionBonus;
    const titlePositionPoints = titleKeywordEarly ? config.title.points.keywordPosition : 0;

    indicators.push({
        id: 'meta-title-keyword-position',
        message: titleKeywordEarly
            ? 'Keyword appears near the beginning of the title'
            : 'Move your keyword closer to the start of the title',
        status: titleKeywordEarly ? 'good' : 'okay',
        points: titlePositionPoints,
        maxPoints: config.title.points.keywordPosition,
    });
    totalPoints += titlePositionPoints;

    // SEO Description length check
    const descLength = article.seoDescription?.length || 0;
    let descLengthStatus: IndicatorStatus;
    let descLengthPoints = 0;
    let descLengthMessage = '';

    if (descLength === 0) {
        descLengthStatus = 'poor';
        descLengthMessage = 'Meta description is missing - add a compelling description';
    } else if (descLength >= config.description.length.optimal.min && descLength <= config.description.length.optimal.max) {
        descLengthStatus = 'good';
        descLengthPoints = config.description.points.length;
        descLengthMessage = `Meta description is ${descLength} characters (optimal)`;
    } else if (descLength >= config.description.length.acceptable.min && descLength <= config.description.length.acceptable.max) {
        descLengthStatus = 'okay';
        descLengthPoints = config.description.points.length / 2;
        descLengthMessage = `Meta description is ${descLength} characters (aim for 150-160)`;
    } else {
        descLengthStatus = 'poor';
        descLengthMessage = descLength < config.description.length.acceptable.min
            ? `Meta description is too short (${descLength} chars) - aim for 150-160 characters`
            : `Meta description is too long (${descLength} chars) - keep under 160 characters`;
    }

    indicators.push({
        id: 'meta-desc-length',
        message: descLengthMessage,
        status: descLengthStatus,
        points: descLengthPoints,
        maxPoints: config.description.points.length,
    });
    totalPoints += descLengthPoints;

    // Description keyword check
    const descHasKeyword = keyword && article.seoDescription?.toLowerCase().includes(keyword);
    const descKeywordPoints = descHasKeyword ? config.description.points.hasKeyword : 0;

    indicators.push({
        id: 'meta-desc-keyword',
        message: descHasKeyword
            ? 'Target keyword appears in meta description'
            : 'Add your target keyword to the meta description',
        status: descHasKeyword ? 'good' : 'poor',
        points: descKeywordPoints,
        maxPoints: config.description.points.hasKeyword,
    });
    totalPoints += descKeywordPoints;

    return {
        id: 'metaElements',
        name: 'Meta Elements',
        score: totalPoints,
        maxScore: SEO_CONFIG.weights.metaElements,
        indicators,
    };
}

// ============================================
// CONTENT STRUCTURE SCORING
// ============================================
function calculateContentStructureScore(article: ArticleContent, analysis: ContentAnalysis): SEOCategory {
    const config = SEO_CONFIG.contentStructure;
    const indicators: SEOIndicator[] = [];
    let totalPoints = 0;

    // Single H1 check
    let h1Status: IndicatorStatus;
    let h1Points = 0;
    let h1Message = '';

    if (analysis.h1Count === 1) {
        h1Status = 'good';
        h1Points = config.points.singleH1;
        h1Message = 'Article has exactly one H1 heading';
    } else if (analysis.h1Count === 0) {
        h1Status = 'poor';
        h1Message = 'Article is missing an H1 heading - add a main title';
    } else {
        h1Status = 'poor';
        h1Message = `Article has ${analysis.h1Count} H1 headings - use only one H1`;
    }

    indicators.push({
        id: 'structure-h1',
        message: h1Message,
        status: h1Status,
        points: h1Points,
        maxPoints: config.points.singleH1,
    });
    totalPoints += h1Points;

    // H1 has keyword
    const h1KeywordPoints = analysis.keywordInH1 ? config.points.h1HasKeyword : 0;

    indicators.push({
        id: 'structure-h1-keyword',
        message: analysis.keywordInH1
            ? 'Target keyword appears in H1 heading'
            : 'Add your target keyword to the H1 heading',
        status: analysis.keywordInH1 ? 'good' : 'poor',
        points: h1KeywordPoints,
        maxPoints: config.points.h1HasKeyword,
    });
    totalPoints += h1KeywordPoints;

    // H2 has keyword
    const h2KeywordPoints = analysis.keywordInH2 ? config.points.h2HasKeyword : 0;

    indicators.push({
        id: 'structure-h2-keyword',
        message: analysis.keywordInH2
            ? 'Target keyword appears in at least one H2 heading'
            : 'Add your target keyword to at least one H2 subheading',
        status: analysis.keywordInH2 ? 'good' : 'okay',
        points: h2KeywordPoints,
        maxPoints: config.points.h2HasKeyword,
    });
    totalPoints += h2KeywordPoints;

    // Heading hierarchy
    const hierarchyPoints = analysis.headingHierarchyValid ? config.points.properHierarchy : 0;

    indicators.push({
        id: 'structure-hierarchy',
        message: analysis.headingHierarchyValid
            ? 'Heading hierarchy is correct (H1 → H2 → H3)'
            : 'Fix heading hierarchy - don\'t skip heading levels',
        status: analysis.headingHierarchyValid ? 'good' : 'okay',
        points: hierarchyPoints,
        maxPoints: config.points.properHierarchy,
    });
    totalPoints += hierarchyPoints;

    // H2 frequency
    const targetH2Count = Math.floor(analysis.wordCount / config.h2.wordsPerHeading);
    const h2Ratio = targetH2Count > 0 ? analysis.h2Count / targetH2Count : 1;

    let h2FreqStatus: IndicatorStatus;
    let h2FreqPoints = 0;
    let h2FreqMessage = '';

    if (h2Ratio >= config.h2.ratioThresholds.good) {
        h2FreqStatus = 'good';
        h2FreqPoints = config.points.h2Frequency;
        h2FreqMessage = `Good use of H2 headings (${analysis.h2Count} headings)`;
    } else if (h2Ratio >= config.h2.ratioThresholds.okay) {
        h2FreqStatus = 'okay';
        h2FreqPoints = config.points.h2Frequency / 2;
        h2FreqMessage = `Add more H2 headings to break up content (${analysis.h2Count} found, aim for ${targetH2Count})`;
    } else {
        h2FreqStatus = 'poor';
        h2FreqMessage = `Content needs more structure - add H2 headings every ~250 words`;
    }

    indicators.push({
        id: 'structure-h2-frequency',
        message: h2FreqMessage,
        status: h2FreqStatus,
        points: h2FreqPoints,
        maxPoints: config.points.h2Frequency,
    });
    totalPoints += h2FreqPoints;

    return {
        id: 'contentStructure',
        name: 'Content Structure',
        score: totalPoints,
        maxScore: SEO_CONFIG.weights.contentStructure,
        indicators,
    };
}

// ============================================
// READABILITY SCORING
// ============================================
function calculateReadabilityScore(article: ArticleContent, analysis: ContentAnalysis): SEOCategory {
    const config = SEO_CONFIG.readability;
    const indicators: SEOIndicator[] = [];

    const totalParagraphs = analysis.paragraphs.length;
    const longParagraphs = analysis.longParagraphCount;
    const goodParagraphs = totalParagraphs - longParagraphs;

    let status: IndicatorStatus;
    let points = 0;
    let message = '';

    if (totalParagraphs === 0) {
        status = 'poor';
        message = 'No paragraphs found - add content to your article';
    } else if (longParagraphs === 0) {
        status = 'good';
        points = config.points.total;
        message = 'All paragraphs are a good length for readability';
    } else if (longParagraphs <= totalParagraphs / 3) {
        status = 'okay';
        points = config.points.total * 0.6;
        message = `${longParagraphs} paragraph(s) are too long - break them into shorter sections`;
    } else {
        status = 'poor';
        points = config.points.total * 0.2;
        message = `${longParagraphs} paragraphs are too long - aim for under 300 words each`;
    }

    indicators.push({
        id: 'readability-paragraphs',
        message,
        status,
        points,
        maxPoints: config.points.total,
    });

    return {
        id: 'readability',
        name: 'Readability',
        score: points,
        maxScore: SEO_CONFIG.weights.readability,
        indicators,
    };
}

// ============================================
// INTERNAL LINKS SCORING
// ============================================
function calculateInternalLinksScore(article: ArticleContent, analysis: ContentAnalysis): SEOCategory {
    const config = SEO_CONFIG.internalLinks;
    const indicators: SEOIndicator[] = [];

    const linkCount = article.internalLinks?.length || 0;
    const targetLinks = Math.ceil((analysis.wordCount / 1000) * config.linksPerThousandWords);
    const ratio = targetLinks > 0 ? linkCount / targetLinks : (linkCount > 0 ? 1 : 0);

    let status: IndicatorStatus;
    let points = 0;
    let message = '';

    if (linkCount === 0) {
        status = 'poor';
        points = config.points.none;
        message = 'No internal links found - add links to related articles';
    } else if (ratio >= config.thresholds.excellent) {
        status = 'good';
        points = config.points.excellent;
        message = `Excellent internal linking (${linkCount} links)`;
    } else if (ratio >= config.thresholds.good) {
        status = 'good';
        points = config.points.good;
        message = `Good internal linking (${linkCount} links)`;
    } else if (ratio >= config.thresholds.okay) {
        status = 'okay';
        points = config.points.okay;
        message = `Add more internal links (${linkCount} found, aim for ${targetLinks})`;
    } else {
        status = 'poor';
        points = config.points.poor;
        message = `Not enough internal links (${linkCount} found, aim for ${targetLinks})`;
    }

    indicators.push({
        id: 'internal-links-count',
        message,
        status,
        points,
        maxPoints: config.points.excellent,
    });

    return {
        id: 'internalLinks',
        name: 'Internal Links',
        score: points,
        maxScore: SEO_CONFIG.weights.internalLinks,
        indicators,
    };
}

// ============================================
// IMAGES SCORING
// ============================================
function calculateImagesScore(article: ArticleContent, analysis: ContentAnalysis): SEOCategory {
    const config = SEO_CONFIG.images;
    const indicators: SEOIndicator[] = [];
    let totalPoints = 0;

    const imageCount = article.images?.length || 0;
    const targetImages = Math.ceil(analysis.wordCount / config.wordsPerImage);
    const ratio = targetImages > 0 ? imageCount / targetImages : (imageCount > 0 ? 1 : 0);

    let countStatus: IndicatorStatus;
    let countPoints = 0;
    let countMessage = '';

    if (imageCount === 0) {
        countStatus = 'poor';
        countPoints = config.points.basePoor;
        countMessage = 'No images found - add relevant images to improve engagement';
    } else if (ratio >= config.thresholds.good) {
        countStatus = 'good';
        countPoints = config.points.baseGood;
        countMessage = `Good number of images (${imageCount} images)`;
    } else if (ratio >= config.thresholds.okay) {
        countStatus = 'okay';
        countPoints = config.points.baseOkay;
        countMessage = `Add more images (${imageCount} found, aim for ${targetImages})`;
    } else {
        countStatus = 'poor';
        countPoints = config.points.basePoor;
        countMessage = `Not enough images (${imageCount} found, aim for ${targetImages})`;
    }

    indicators.push({
        id: 'images-count',
        message: countMessage,
        status: countStatus,
        points: countPoints,
        maxPoints: config.points.baseGood,
    });
    totalPoints += countPoints;

    // Alt text check
    if (imageCount > 0) {
        const imagesWithAlt = article.images?.filter(img => img.alt?.trim()).length || 0;
        const allHaveAlt = imagesWithAlt === imageCount;
        const altPoints = allHaveAlt ? config.points.allHaveAlt : 0;

        indicators.push({
            id: 'images-alt',
            message: allHaveAlt
                ? 'All images have alt text'
                : `${imageCount - imagesWithAlt} image(s) missing alt text`,
            status: allHaveAlt ? 'good' : 'poor',
            points: altPoints,
            maxPoints: config.points.allHaveAlt,
        });
        totalPoints += altPoints;

        // Alt text with keyword
        const keyword = article.targetKeyword?.toLowerCase().trim() || '';
        const imagesWithKeywordAlt = keyword
            ? article.images?.filter(img => img.alt?.toLowerCase().includes(keyword)).length || 0
            : 0;
        const hasKeywordAlt = imagesWithKeywordAlt > 0;
        const keywordAltPoints = hasKeywordAlt ? config.points.altHasKeyword : 0;

        indicators.push({
            id: 'images-alt-keyword',
            message: hasKeywordAlt
                ? 'Target keyword appears in image alt text'
                : 'Add your target keyword to at least one image alt text',
            status: hasKeywordAlt ? 'good' : 'okay',
            points: keywordAltPoints,
            maxPoints: config.points.altHasKeyword,
        });
        totalPoints += keywordAltPoints;
    }

    return {
        id: 'images',
        name: 'Images',
        score: totalPoints,
        maxScore: SEO_CONFIG.weights.images,
        indicators,
    };
}

// ============================================
// OUTBOUND LINKS SCORING
// ============================================
function calculateOutboundLinksScore(article: ArticleContent, analysis: ContentAnalysis): SEOCategory {
    const config = SEO_CONFIG.outboundLinks;
    const indicators: SEOIndicator[] = [];

    const linkCount = article.outboundLinks?.length || 0;

    let status: IndicatorStatus;
    let points = 0;
    let message = '';

    if (linkCount === 0) {
        status = 'okay';
        points = config.points.none;
        message = 'No outbound links - consider linking to authoritative sources';
    } else if (linkCount >= config.optimal.min && linkCount <= config.optimal.max) {
        status = 'good';
        points = config.points.optimal;
        message = `Good number of outbound links (${linkCount} links to external sources)`;
    } else {
        status = 'okay';
        points = config.points.excessive;
        message = `${linkCount} outbound links - consider reducing to 1-5 for better SEO`;
    }

    indicators.push({
        id: 'outbound-links-count',
        message,
        status,
        points,
        maxPoints: config.points.optimal,
    });

    return {
        id: 'outboundLinks',
        name: 'Outbound Links',
        score: points,
        maxScore: SEO_CONFIG.weights.outboundLinks,
        indicators,
    };
}

class SEOAuditTool {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.formData = {};
    }

    initializeElements() {
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanels = document.querySelectorAll('.tab-panel');
        this.generateReportBtn = document.getElementById('generateReport');
        this.printReportBtn = document.getElementById('printReport');
        this.auditReport = document.getElementById('auditReport');
        this.reportPlaceholder = document.getElementById('reportPlaceholder');
        this.formInputs = document.querySelectorAll('input, select, textarea');
    }

    attachEventListeners() {
        // Tab navigation
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form validation
        this.formInputs.forEach(input => {
            input.addEventListener('change', () => this.validateForm());
        });

        // Report generation
        this.generateReportBtn.addEventListener('click', () => this.generateReport());
        this.printReportBtn.addEventListener('click', () => this.printReport());
    }

    switchTab(tabName) {
        // Update active tab button
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab panel
        this.tabPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
    }

    validateForm() {
        const requiredFields = [
            'clientName', 'websiteUrl', 'industry', 'primaryKeywords'
        ];

        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });

        this.generateReportBtn.disabled = !isValid;
    }

    collectFormData() {
        this.formData = {};
        this.formInputs.forEach(input => {
            this.formData[input.id] = input.value;
        });
    }

    calculateScores() {
        const scores = {
            technical: this.calculateTechnicalScore(),
            onPage: this.calculateOnPageScore(),
            content: this.calculateContentScore(),
            backlinks: this.calculateBacklinkScore(),
            gmb: this.calculateGMBScore(),
            overall: 0
        };

        // Calculate overall score - include optional sections only if they have data
        let totalScore = scores.technical + scores.onPage + scores.content;
        let sectionCount = 3;

        if (this.hasBacklinkData()) {
            totalScore += scores.backlinks;
            sectionCount++;
        }

        if (this.hasGMBData()) {
            totalScore += scores.gmb;
            sectionCount++;
        }

        scores.overall = Math.round(totalScore / sectionCount);
        return scores;
    }

    calculateTechnicalScore() {
        let score = 100;

        // Page load speed scoring
        const speed = parseFloat(this.formData.pageLoadSpeed) || 0;
        if (speed > 3) score -= 20;
        else if (speed > 2) score -= 10;

        // Mobile responsive scoring
        const mobile = this.formData.mobileResponsive;
        if (mobile === 'poor') score -= 25;
        else if (mobile === 'fair') score -= 15;
        else if (mobile === 'good') score -= 5;

        // SSL Certificate
        if (this.formData.sslCertificate === 'no') score -= 15;

        // XML Sitemap
        const sitemap = this.formData.xmlSitemap;
        if (sitemap === 'missing') score -= 15;
        else if (sitemap === 'outdated') score -= 8;

        // Core Web Vitals
        const cwv = parseInt(this.formData.coreWebVitals) || 0;
        if (cwv < 50) score -= 20;
        else if (cwv < 75) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    calculateOnPageScore() {
        let score = 100;
        const factors = [
            'titleTags', 'metaDescriptions', 'headerTags',
            'keywordOptimization', 'imageOptimization', 'internalLinking'
        ];

        factors.forEach(factor => {
            const value = this.formData[factor];
            if (value === 'poor') score -= 15;
            else if (value === 'fair') score -= 10;
            else if (value === 'good') score -= 5;
        });

        return Math.max(0, Math.min(100, score));
    }

    calculateContentScore() {
        let score = 100;
        const factors = [
            'contentQuality', 'contentLength', 'contentFreshness', 'keywordDensity'
        ];

        factors.forEach(factor => {
            const value = this.formData[factor];
            if (value === 'poor') score -= 20;
            else if (value === 'fair') score -= 12;
            else if (value === 'good') score -= 5;
        });

        // Readability bonus/penalty
        const readability = parseInt(this.formData.readabilityScore) || 0;
        if (readability < 60) score -= 10;
        else if (readability > 80) score += 5;

        return Math.max(0, Math.min(100, score));
    }

    calculateBacklinkScore() {
        if (!this.hasBacklinkData()) return 0;

        let score = 100;

        // Domain Authority scoring
        const da = parseInt(this.formData.domainAuthority) || 0;
        if (da < 20) score -= 25;
        else if (da < 35) score -= 15;
        else if (da < 50) score -= 8;

        // Backlink quality scoring
        const quality = this.formData.backlinkQuality;
        if (quality === 'poor') score -= 30;
        else if (quality === 'fair') score -= 20;
        else if (quality === 'good') score -= 8;

        // Anchor text diversity
        const diversity = this.formData.anchorTextDiversity;
        if (diversity === 'poor') score -= 25;
        else if (diversity === 'fair') score -= 15;
        else if (diversity === 'good') score -= 5;

        // Toxic links penalty
        const toxicPercent = parseInt(this.formData.toxicLinks) || 0;
        if (toxicPercent > 15) score -= 30;
        else if (toxicPercent > 10) score -= 20;
        else if (toxicPercent > 5) score -= 10;

        // Link velocity concerns
        const velocity = this.formData.linkVelocity;
        if (velocity === 'concerning') score -= 20;
        else if (velocity === 'fast') score -= 10;

        // Competitor comparison
        const totalBacklinks = parseInt(this.formData.totalBacklinks) || 0;
        const competitorBacklinks = parseInt(this.formData.competitorBacklinks) || 0;
        if (competitorBacklinks > 0 && totalBacklinks < competitorBacklinks * 0.3) {
            score -= 15;
        } else if (competitorBacklinks > 0 && totalBacklinks < competitorBacklinks * 0.6) {
            score -= 8;
        }

        return Math.max(0, Math.min(100, score));
    }

    calculateGMBScore() {
        if (!this.hasGMBData()) return 0;

        let score = 100;

        // Profile status
        const status = this.formData.gmbClaimed;
        if (status === 'unclaimed') score -= 40;
        else if (status === 'claimed-unverified') score -= 20;

        // Profile completeness
        const completeness = parseInt(this.formData.gmbCompleteness) || 0;
        if (completeness < 60) score -= 25;
        else if (completeness < 80) score -= 15;
        else if (completeness < 95) score -= 8;

        // Reviews and rating
        const rating = parseFloat(this.formData.gmbRating) || 0;
        const reviewCount = parseInt(this.formData.gmbReviews) || 0;
        if (rating < 3.5) score -= 20;
        else if (rating < 4.0) score -= 10;
        if (reviewCount < 10) score -= 15;
        else if (reviewCount < 25) score -= 8;

        // NAP consistency
        const napConsistency = parseInt(this.formData.napConsistency) || 0;
        if (napConsistency < 70) score -= 20;
        else if (napConsistency < 85) score -= 10;

        // Local rankings
        const rankings = this.formData.localRankings;
        if (rankings === 'poor') score -= 25;
        else if (rankings === 'fair') score -= 15;
        else if (rankings === 'good') score -= 5;

        // Activity factors
        const posts = this.formData.gmbPosts;
        if (posts === 'poor') score -= 15;
        else if (posts === 'fair') score -= 10;
        else if (posts === 'good') score -= 3;

        return Math.max(0, Math.min(100, score));
    }

    hasBacklinkData() {
        const backLinkFields = ['totalBacklinks', 'referringDomains', 'domainAuthority', 'backlinkQuality'];
        return backLinkFields.some(field => this.formData[field] && this.formData[field].toString().trim() !== '');
    }

    hasGMBData() {
        const gmbFields = ['gmbClaimed', 'gmbCompleteness', 'gmbRating', 'localRankings'];
        return gmbFields.some(field => this.formData[field] && this.formData[field].toString().trim() !== '');
    }

    getScoreColor(score) {
        if (score >= 80) return '#48bb78';
        if (score >= 60) return '#38b2ac';
        if (score >= 40) return '#ecc94b';
        return '#f56565';
    }

    getScoreGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C';
        return 'F';
    }

    generateFindings() {
        const findings = {
            technical: [],
            onPage: [],
            content: [],
            backlinks: [],
            gmb: [],
            recommendations: []
        };

        // TECHNICAL SEO ANALYSIS - Comprehensive findings

        // Page Load Speed Analysis
        const speed = parseFloat(this.formData.pageLoadSpeed) || 0;
        if (speed > 0) {
            if (speed > 4) {
                findings.technical.push({
                    title: 'Critical Page Speed Issues',
                    description: `Website loads in ${speed} seconds, which is significantly above the recommended 2-3 seconds. This severely impacts user experience and search rankings. Studies show that 40% of users abandon sites that take more than 3 seconds to load.`,
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Urgent Page Speed Optimization',
                    description: 'Implement immediate speed improvements: compress images (aim for under 100KB), minify CSS/JS files, enable GZIP compression, optimize server response time, and consider using a CDN. Expected improvement: 2-3 second reduction in load time.',
                    priority: 'high'
                });
            } else if (speed > 3) {
                findings.technical.push({
                    title: 'Page Speed Optimization Needed',
                    description: `Current load time of ${speed} seconds exceeds Google's recommended 2-3 seconds. This impacts user experience and may affect search rankings.`,
                    severity: 'fair'
                });
                findings.recommendations.push({
                    title: 'Optimize Page Loading Performance',
                    description: 'Optimize images, leverage browser caching, and minify resources to achieve under 3-second load times.',
                    priority: 'medium'
                });
            }
        }

        // Core Web Vitals Analysis
        const cwv = parseInt(this.formData.coreWebVitals) || 0;
        if (cwv > 0) {
            if (cwv < 50) {
                findings.technical.push({
                    title: 'Poor Core Web Vitals Performance',
                    description: `Core Web Vitals score of ${cwv}/100 indicates significant performance issues. This directly impacts Google rankings as Core Web Vitals are official ranking factors. Issues likely include poor Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS).`,
                    severity: 'poor'
                });
            } else if (cwv < 75) {
                findings.technical.push({
                    title: 'Core Web Vitals Need Improvement',
                    description: `Score of ${cwv}/100 suggests moderate performance issues that should be addressed to improve user experience and search rankings.`,
                    severity: 'fair'
                });
            }
        }

        // Mobile Responsiveness Analysis
        if (this.formData.mobileResponsive) {
            const mobileQuality = this.formData.mobileResponsive;
            if (mobileQuality === 'poor') {
                findings.technical.push({
                    title: 'Critical Mobile Usability Issues',
                    description: 'Website has significant mobile compatibility problems. With over 60% of searches happening on mobile devices, this severely impacts user experience and search rankings. Issues may include non-responsive design, touch elements too close together, viewport not set, and content wider than screen.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Implement Mobile-First Responsive Design',
                    description: 'Redesign with mobile-first approach, ensure proper viewport meta tag, implement touch-friendly navigation, and test across multiple devices. This is critical for both user experience and Google rankings.',
                    priority: 'high'
                });
            } else if (mobileQuality === 'fair') {
                findings.technical.push({
                    title: 'Mobile Experience Improvements Needed',
                    description: 'Mobile experience has some issues that should be addressed. While functional, optimizations could improve user engagement and search performance.',
                    severity: 'fair'
                });
            }
        }

        // SSL Certificate Analysis
        if (this.formData.sslCertificate === 'no') {
            findings.technical.push({
                title: 'Missing HTTPS Security Protocol',
                description: 'Website lacks SSL encryption (HTTPS), which is a confirmed Google ranking factor since 2014. This creates security warnings in browsers, reduces user trust, and negatively impacts search rankings. Modern browsers actively warn users about non-HTTPS sites, especially those collecting form data.',
                severity: 'poor'
            });
            findings.recommendations.push({
                title: 'Install SSL Certificate Immediately',
                description: 'Obtain and install an SSL certificate to enable HTTPS. Most hosting providers offer free SSL certificates. Update all internal links to HTTPS and implement 301 redirects from HTTP to HTTPS versions.',
                priority: 'high'
            });
        }

        // XML Sitemap Analysis
        if (this.formData.xmlSitemap) {
            const sitemapStatus = this.formData.xmlSitemap;
            if (sitemapStatus === 'missing') {
                findings.technical.push({
                    title: 'Missing XML Sitemap',
                    description: 'No XML sitemap detected. Sitemaps help search engines discover and index your content efficiently. Without one, search engines may miss important pages or take longer to discover new content.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Create and Submit XML Sitemap',
                    description: 'Generate an XML sitemap including all important pages, submit to Google Search Console and Bing Webmaster Tools, and keep it updated automatically.',
                    priority: 'medium'
                });
            } else if (sitemapStatus === 'outdated') {
                findings.technical.push({
                    title: 'Outdated XML Sitemap',
                    description: 'XML sitemap exists but appears outdated. This can mislead search engines and prevent proper indexing of new content.',
                    severity: 'fair'
                });
            }
        }

        // Robots.txt Analysis
        if (this.formData.robotsTxt) {
            const robotsStatus = this.formData.robotsTxt;
            if (robotsStatus === 'missing') {
                findings.technical.push({
                    title: 'Missing Robots.txt File',
                    description: 'No robots.txt file found. While not mandatory, robots.txt helps guide search engine crawlers and can prevent indexing of sensitive or duplicate content.',
                    severity: 'fair'
                });
            } else if (robotsStatus === 'issues') {
                findings.technical.push({
                    title: 'Robots.txt Configuration Issues',
                    description: 'Robots.txt file has configuration problems that may be blocking important content from search engines or allowing access to pages that should be restricted.',
                    severity: 'poor'
                });
            }
        }

        // URL Structure Analysis
        if (this.formData.urlStructure) {
            const urlQuality = this.formData.urlStructure;
            if (urlQuality === 'poor') {
                findings.technical.push({
                    title: 'Poor URL Structure',
                    description: 'URLs are not SEO-friendly. Issues may include dynamic parameters, lack of keywords, excessive length, or unclear hierarchy. Clean URLs improve user experience and search engine understanding.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Implement SEO-Friendly URL Structure',
                    description: 'Create descriptive, keyword-rich URLs with clear hierarchy. Remove unnecessary parameters, use hyphens instead of underscores, and keep URLs under 60 characters when possible.',
                    priority: 'medium'
                });
            }
        }

        // Crawl Errors Analysis
        const crawlErrors = parseInt(this.formData.crawlErrors) || 0;
        if (crawlErrors > 0) {
            if (crawlErrors > 20) {
                findings.technical.push({
                    title: 'Significant Crawl Errors Detected',
                    description: `${crawlErrors} crawl errors found. High number of crawl errors indicates technical issues preventing search engines from properly accessing and indexing content. Common issues include broken links, server errors, and redirect chains.`,
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Fix Critical Crawl Errors',
                    description: 'Systematically address all crawl errors: fix broken links, resolve server errors, clean up redirect chains, and ensure proper 404 error handling.',
                    priority: 'high'
                });
            } else if (crawlErrors > 5) {
                findings.technical.push({
                    title: 'Moderate Crawl Errors Present',
                    description: `${crawlErrors} crawl errors detected. While not critical, these should be addressed to ensure optimal search engine access.`,
                    severity: 'fair'
                });
            }
        }

        // ON-PAGE SEO ANALYSIS - Comprehensive findings

        // Title Tags Analysis
        if (this.formData.titleTags) {
            const titleQuality = this.formData.titleTags;
            if (titleQuality === 'poor') {
                findings.onPage.push({
                    title: 'Critical Title Tag Issues',
                    description: 'Title tags are missing, duplicate, or poorly optimized. Title tags are one of the most important on-page SEO factors, directly influencing click-through rates and rankings. Issues may include missing titles, duplicate titles across pages, or titles that don\'t include target keywords.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Optimize All Title Tags',
                    description: 'Create unique, descriptive title tags for every page. Include primary keywords near the beginning, keep under 60 characters, and make them compelling for users. Format: "Primary Keyword | Secondary Keyword | Brand Name".',
                    priority: 'high'
                });
            } else if (titleQuality === 'fair') {
                findings.onPage.push({
                    title: 'Title Tag Improvements Needed',
                    description: 'Title tags exist but need optimization for better performance. Some may be too long, missing keywords, or not compelling enough for users.',
                    severity: 'fair'
                });
            }
        }

        // Meta Descriptions Analysis
        if (this.formData.metaDescriptions) {
            const metaQuality = this.formData.metaDescriptions;
            if (metaQuality === 'poor') {
                findings.onPage.push({
                    title: 'Meta Description Issues',
                    description: 'Meta descriptions are missing, duplicate, or poorly written. While not a direct ranking factor, meta descriptions significantly impact click-through rates from search results. Missing descriptions mean Google creates its own, often less compelling versions.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Write Compelling Meta Descriptions',
                    description: 'Create unique meta descriptions for all important pages. Include target keywords naturally, stay within 150-160 characters, and write compelling copy that encourages clicks. Include a clear value proposition or call-to-action.',
                    priority: 'medium'
                });
            }
        }

        // Header Tags Analysis
        if (this.formData.headerTags) {
            const headerQuality = this.formData.headerTags;
            if (headerQuality === 'poor') {
                findings.onPage.push({
                    title: 'Header Tag Structure Problems',
                    description: 'Header tags (H1, H2, H3, etc.) are missing, improperly structured, or not optimized. Proper header hierarchy helps search engines understand content structure and improves accessibility. Multiple H1 tags or skipping header levels can confuse search engines.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Implement Proper Header Hierarchy',
                    description: 'Use single H1 tag per page with primary keyword, create logical H2-H6 structure for content sections, and include relevant keywords naturally in headers.',
                    priority: 'medium'
                });
            }
        }

        // Keyword Optimization Analysis
        if (this.formData.keywordOptimization) {
            const keywordQuality = this.formData.keywordOptimization;
            if (keywordQuality === 'poor') {
                findings.onPage.push({
                    title: 'Poor Keyword Optimization',
                    description: 'Content lacks proper keyword optimization. Pages may be missing target keywords, have keyword stuffing, or lack semantic keyword variations. Proper keyword optimization helps search engines understand page relevance.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Implement Strategic Keyword Optimization',
                    description: 'Research and implement target keywords naturally throughout content. Focus on user intent, include semantic variations, and maintain 1-2% keyword density. Optimize for long-tail keywords relevant to your industry.',
                    priority: 'high'
                });
            }
        }

        // Image Optimization Analysis
        if (this.formData.imageOptimization) {
            const imageQuality = this.formData.imageOptimization;
            if (imageQuality === 'poor' || imageQuality === 'fair') {
                findings.onPage.push({
                    title: 'Image Optimization Issues',
                    description: 'Images lack proper optimization affecting page speed and accessibility. Issues may include missing alt text, oversized images, wrong file formats, or non-descriptive filenames. Optimized images improve user experience and provide additional ranking opportunities.',
                    severity: imageQuality
                });
                findings.recommendations.push({
                    title: 'Optimize All Images',
                    description: 'Add descriptive alt text for accessibility and SEO, compress images (aim for under 100KB), use modern formats (WebP), resize images appropriately, and use descriptive filenames with keywords.',
                    priority: 'medium'
                });
            }
        }

        // Internal Linking Analysis
        if (this.formData.internalLinking) {
            const linkingQuality = this.formData.internalLinking;
            if (linkingQuality === 'poor') {
                findings.onPage.push({
                    title: 'Poor Internal Linking Strategy',
                    description: 'Internal linking structure is inadequate, limiting page authority distribution and user navigation. Poor internal linking makes it harder for search engines to discover and understand page relationships.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Develop Strategic Internal Linking',
                    description: 'Create comprehensive internal linking strategy: link to important pages from high-authority pages, use descriptive anchor text with keywords, ensure all pages are within 3 clicks of homepage, and create topic clusters.',
                    priority: 'medium'
                });
            }
        }

        // Schema Markup Analysis
        if (this.formData.schemaMarkup) {
            const schemaQuality = this.formData.schemaMarkup;
            if (schemaQuality === 'poor' || schemaQuality === 'missing') {
                findings.onPage.push({
                    title: 'Missing Schema Markup',
                    description: 'No structured data (schema markup) detected. Schema markup helps search engines understand content context and can enable rich snippets, improving click-through rates and visibility in search results.',
                    severity: 'fair'
                });
                findings.recommendations.push({
                    title: 'Implement Schema Markup',
                    description: 'Add relevant schema markup for your business type, products, reviews, events, and articles. Use JSON-LD format and validate with Google\'s Structured Data Testing Tool.',
                    priority: 'medium'
                });
            }
        }

        // CONTENT ANALYSIS - Comprehensive findings

        // Content Quality Analysis
        if (this.formData.contentQuality) {
            const contentQuality = this.formData.contentQuality;
            if (contentQuality === 'poor') {
                findings.content.push({
                    title: 'Low Content Quality Issues',
                    description: 'Content quality is below standards expected for effective SEO. Issues may include thin content, lack of expertise/authority, poor user engagement metrics, or content that doesn\'t match user search intent. High-quality content is essential for rankings and user satisfaction.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Enhance Content Quality and Authority',
                    description: 'Create comprehensive, expert-level content that demonstrates E-A-T (Expertise, Authoritativeness, Trustworthiness). Include original research, expert quotes, detailed explanations, and practical value for users.',
                    priority: 'high'
                });
            } else if (contentQuality === 'fair') {
                findings.content.push({
                    title: 'Content Quality Improvements Needed',
                    description: 'Content is adequate but has room for improvement in depth, expertise, or user value.',
                    severity: 'fair'
                });
            }
        }

        // Content Length Analysis
        if (this.formData.contentLength) {
            const lengthQuality = this.formData.contentLength;
            if (lengthQuality === 'poor') {
                findings.content.push({
                    title: 'Thin Content Problems',
                    description: 'Many pages have insufficient content length (under 300 words). Thin content provides little value to users and search engines. Studies show longer, comprehensive content tends to rank higher for competitive keywords.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Expand Content Depth',
                    description: 'Develop comprehensive content with minimum 500-1000 words for important pages. Focus on thorough coverage of topics, answer related questions, and provide practical value to users.',
                    priority: 'high'
                });
            } else if (lengthQuality === 'fair') {
                findings.content.push({
                    title: 'Content Length Could Be Improved',
                    description: 'Content length is moderate but could benefit from expansion for better topic coverage and user value.',
                    severity: 'fair'
                });
            }
        }

        // Content Freshness Analysis
        if (this.formData.contentFreshness) {
            const freshness = this.formData.contentFreshness;
            if (freshness === 'poor') {
                findings.content.push({
                    title: 'Outdated Content Issues',
                    description: 'Content is largely outdated, which can harm credibility and search rankings. Fresh, current content signals to search engines that the site is actively maintained and provides up-to-date information.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Implement Content Freshness Strategy',
                    description: 'Regularly update existing content with current information, add publication and update dates, create content calendar for regular publishing, and refresh old content with new insights.',
                    priority: 'medium'
                });
            }
        }

        // Keyword Density Analysis
        if (this.formData.keywordDensity) {
            const density = this.formData.keywordDensity;
            if (density === 'poor') {
                findings.content.push({
                    title: 'Keyword Density Issues',
                    description: 'Keyword usage is either too sparse (under-optimization) or excessive (over-optimization/keyword stuffing). Both scenarios can harm search performance. Modern SEO requires natural, semantic keyword usage.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Optimize Keyword Density',
                    description: 'Maintain natural keyword density of 1-3% for primary keywords. Use semantic variations and related terms. Focus on user-intent rather than exact-match keywords.',
                    priority: 'medium'
                });
            }
        }

        // Readability Analysis
        const readability = parseInt(this.formData.readabilityScore) || 0;
        if (readability > 0) {
            if (readability < 60) {
                findings.content.push({
                    title: 'Poor Content Readability',
                    description: `Readability score of ${readability}/100 indicates content is difficult to read. Poor readability increases bounce rates and reduces user engagement, indirectly affecting search rankings.`,
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Improve Content Readability',
                    description: 'Simplify language, use shorter sentences and paragraphs, add subheadings for scanning, use bullet points and lists, and maintain 8th-grade reading level for broader accessibility.',
                    priority: 'medium'
                });
            }
        }

        // Duplicate Content Analysis
        if (this.formData.duplicateContent) {
            const duplication = this.formData.duplicateContent;
            if (duplication === 'major') {
                findings.content.push({
                    title: 'Significant Duplicate Content Issues',
                    description: 'Major duplicate content problems detected. Duplicate content confuses search engines about which version to rank and can lead to ranking penalties or content being filtered from search results.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Resolve Duplicate Content Issues',
                    description: 'Identify and eliminate duplicate content through canonical tags, 301 redirects, or content consolidation. Create unique content for each page and implement proper URL parameters handling.',
                    priority: 'high'
                });
            } else if (duplication === 'moderate') {
                findings.content.push({
                    title: 'Moderate Duplicate Content',
                    description: 'Some duplicate content issues present that should be addressed for optimal search performance.',
                    severity: 'fair'
                });
            }
        }

        // BACKLINK ANALYSIS - Optional Section
        if (this.hasBacklinkData()) {
            // Domain Authority Analysis
            const da = parseInt(this.formData.domainAuthority) || 0;
            if (da > 0) {
                if (da < 20) {
                    findings.backlinks.push({
                        title: 'Low Domain Authority',
                        description: `Domain Authority of ${da} is significantly below average. This indicates weak backlink profile and limited organic search potential. Higher DA typically correlates with better search rankings.`,
                        severity: 'poor'
                    });
                    findings.recommendations.push({
                        title: 'Build High-Quality Backlinks',
                        description: 'Focus on acquiring backlinks from high-authority, relevant websites through guest posting, resource page links, digital PR, and relationship building with industry leaders.',
                        priority: 'high'
                    });
                } else if (da < 35) {
                    findings.backlinks.push({
                        title: 'Moderate Domain Authority',
                        description: `Domain Authority of ${da} shows room for improvement. With strategic link building, significant gains in organic visibility are achievable.`,
                        severity: 'fair'
                    });
                }
            }

            // Backlink Quality Assessment
            const quality = this.formData.backlinkQuality;
            if (quality === 'poor') {
                findings.backlinks.push({
                    title: 'Poor Backlink Quality Detected',
                    description: 'Many low-quality or spam backlinks detected. These can harm search rankings and may result in manual penalties from search engines.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Toxic Link Cleanup Required',
                    description: 'Conduct comprehensive backlink audit, disavow toxic links, and implement stricter link acquisition guidelines to protect domain authority.',
                    priority: 'high'
                });
            }

            // Toxic Links Analysis
            const toxicPercent = parseInt(this.formData.toxicLinks) || 0;
            if (toxicPercent > 10) {
                findings.backlinks.push({
                    title: 'High Toxic Link Percentage',
                    description: `${toxicPercent}% toxic links detected. This poses significant risk to domain authority and search rankings. Immediate action required.`,
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Emergency Link Cleanup',
                    description: 'Use Google Disavow Tool to reject toxic backlinks, conduct outreach for link removal, and implement ongoing monitoring to prevent future toxic link accumulation.',
                    priority: 'high'
                });
            }

            // Competitor Gap Analysis
            const totalBacklinks = parseInt(this.formData.totalBacklinks) || 0;
            const competitorBacklinks = parseInt(this.formData.competitorBacklinks) || 0;
            if (competitorBacklinks > 0 && totalBacklinks < competitorBacklinks * 0.5) {
                findings.backlinks.push({
                    title: 'Significant Backlink Gap vs Competitors',
                    description: `With ${totalBacklinks} backlinks vs competitor average of ${competitorBacklinks}, there's a substantial gap affecting competitive positioning.`,
                    severity: 'fair'
                });
                findings.recommendations.push({
                    title: 'Competitive Link Building Strategy',
                    description: 'Analyze competitor backlink profiles, identify link opportunities, and develop targeted outreach campaigns to close the authority gap.',
                    priority: 'high'
                });
            }
        }

        // GMB ANALYSIS - Optional Section  
        if (this.hasGMBData()) {
            // Profile Status Analysis
            const status = this.formData.gmbClaimed;
            if (status === 'unclaimed') {
                findings.gmb.push({
                    title: 'Unclaimed Google My Business Profile',
                    description: 'Google My Business profile is unclaimed, resulting in lost local search visibility and inability to manage business information presentation.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Claim and Verify GMB Profile Immediately',
                    description: 'Claim your Google My Business listing, complete verification process, and optimize all profile sections for maximum local search visibility.',
                    priority: 'high'
                });
            } else if (status === 'claimed-unverified') {
                findings.gmb.push({
                    title: 'Unverified GMB Profile',
                    description: 'GMB profile is claimed but unverified, limiting management capabilities and local search features.',
                    severity: 'fair'
                });
            }

            // Profile Completeness
            const completeness = parseInt(this.formData.gmbCompleteness) || 0;
            if (completeness < 80) {
                findings.gmb.push({
                    title: 'Incomplete GMB Profile',
                    description: `Profile completeness at ${completeness}% reduces local search visibility. Complete profiles perform significantly better in local search results.`,
                    severity: completeness < 60 ? 'poor' : 'fair'
                });
                findings.recommendations.push({
                    title: 'Complete GMB Profile Optimization',
                    description: 'Add missing business information: photos, hours, services, posts, Q&A responses, and ensure all fields are accurate and comprehensive.',
                    priority: 'high'
                });
            }

            // Reviews Analysis
            const rating = parseFloat(this.formData.gmbRating) || 0;
            const reviewCount = parseInt(this.formData.gmbReviews) || 0;
            if (rating < 4.0 && rating > 0) {
                findings.gmb.push({
                    title: 'Below Average Review Rating',
                    description: `Average rating of ${rating}/5 stars negatively impacts local search rankings and customer trust. Online reviews are crucial ranking factors.`,
                    severity: rating < 3.5 ? 'poor' : 'fair'
                });
                findings.recommendations.push({
                    title: 'Improve Review Management Strategy',
                    description: 'Implement systematic review generation process, respond to all reviews professionally, and address negative feedback to improve overall rating.',
                    priority: 'high'
                });
            }
            if (reviewCount < 25) {
                findings.gmb.push({
                    title: 'Insufficient Review Volume',
                    description: `Only ${reviewCount} reviews may limit local search competitiveness. Businesses with more reviews typically rank higher in local search.`,
                    severity: 'fair'
                });
            }

            // NAP Consistency
            const napConsistency = parseInt(this.formData.napConsistency) || 0;
            if (napConsistency < 85) {
                findings.gmb.push({
                    title: 'NAP Inconsistency Issues',
                    description: `NAP (Name, Address, Phone) consistency at ${napConsistency}% creates confusion for search engines and weakens local SEO signals.`,
                    severity: napConsistency < 70 ? 'poor' : 'fair'
                });
                findings.recommendations.push({
                    title: 'Standardize NAP Information',
                    description: 'Audit and standardize business information across all online directories, citations, and websites to improve local search authority.',
                    priority: 'high'
                });
            }

            // Local Rankings
            const rankings = this.formData.localRankings;
            if (rankings === 'poor') {
                findings.gmb.push({
                    title: 'Poor Local Search Rankings',
                    description: 'Weak local search performance indicates need for comprehensive local SEO strategy implementation.',
                    severity: 'poor'
                });
                findings.recommendations.push({
                    title: 'Comprehensive Local SEO Strategy',
                    description: 'Implement complete local SEO optimization: GMB optimization, citation building, local content creation, and review management.',
                    priority: 'high'
                });
            }
        }

        // Industry-Specific Recommendations
        this.addIndustrySpecificFindings(findings);

        return findings;
    }

    addIndustrySpecificFindings(findings) {
        const industry = this.formData.industry;

        if (industry === 'localbusiness') {
            findings.recommendations.push({
                title: 'Local SEO Optimization',
                description: 'Claim and optimize Google My Business listing, build local citations, encourage customer reviews, and optimize for "near me" searches. Include location-specific keywords and create location-specific landing pages.',
                priority: 'high'
            });
            findings.recommendations.push({
                title: 'Local Schema Markup',
                description: 'Implement LocalBusiness schema markup with NAP (Name, Address, Phone), business hours, and service areas to improve local search visibility.',
                priority: 'medium'
            });
        } else if (industry === 'ecommerce') {
            findings.recommendations.push({
                title: 'E-commerce SEO Essentials',
                description: 'Optimize product pages with unique descriptions, implement product schema markup, optimize category pages, and create user-generated content strategy through reviews.',
                priority: 'high'
            });
        } else if (industry === 'healthcare') {
            findings.recommendations.push({
                title: 'Healthcare E-A-T Optimization',
                description: 'Demonstrate medical expertise through author credentials, citations to medical studies, regular content updates by qualified professionals, and clear medical disclaimers.',
                priority: 'high'
            });
        } else if (industry === 'legal') {
            findings.recommendations.push({
                title: 'Legal Industry SEO',
                description: 'Create practice area-specific content, showcase attorney credentials and case results, implement local SEO for legal services, and ensure all content meets legal advertising guidelines.',
                priority: 'high'
            });
        }
    }

    generateReport() {
        this.collectFormData();
        const scores = this.calculateScores();
        const findings = this.generateFindings();

        const reportHTML = this.createReportHTML(scores, findings);

        this.auditReport.innerHTML = reportHTML;
        this.auditReport.style.display = 'block';
        this.reportPlaceholder.style.display = 'none';
        this.printReportBtn.disabled = false;

        // Switch to report tab
        this.switchTab('report');
    }

    createReportHTML(scores, findings) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="report-header">
                <h1 class="report-title">SEO AUDIT REPORT</h1>
                <div class="report-subtitle">Comprehensive SEO Analysis for ${this.formData.clientName}</div>
                <div class="report-date"> Created on ${currentDate} by Muhammad Ahmed</div>
            </div>
            
            <div class="report-content">
                <div class="score-overview">
                    <div class="score-card">
                        <div class="score-number" style="color: ${this.getScoreColor(scores.overall)}">${scores.overall}</div>
                        <div class="score-label">Overall Score</div>
                        <div class="score-description">Grade: ${this.getScoreGrade(scores.overall)}</div>
                    </div>
                    <div class="score-card">
                        <div class="score-number" style="color: ${this.getScoreColor(scores.technical)}">${scores.technical}</div>
                        <div class="score-label">Technical SEO</div>
                        <div class="score-description">Site Performance</div>
                    </div>
                    <div class="score-card">
                        <div class="score-number" style="color: ${this.getScoreColor(scores.onPage)}">${scores.onPage}</div>
                        <div class="score-label">On-Page SEO</div>
                        <div class="score-description">Content Optimization</div>
                    </div>
                    <div class="score-card">
                        <div class="score-number" style="color: ${this.getScoreColor(scores.content)}">${scores.content}</div>
                        <div class="score-label">Content Quality</div>
                        <div class="score-description">User Value</div>
                    </div>
                    ${this.hasBacklinkData() ? `
                    <div class="score-card">
                        <div class="score-number" style="color: ${this.getScoreColor(scores.backlinks)}">${scores.backlinks}</div>
                        <div class="score-label">Backlink Profile</div>
                        <div class="score-description">Link Authority</div>
                    </div>` : ''}
                    ${this.hasGMBData() ? `
                    <div class="score-card">
                        <div class="score-number" style="color: ${this.getScoreColor(scores.gmb)}">${scores.gmb}</div>
                        <div class="score-label">Local SEO / GMB</div>
                        <div class="score-description">Local Presence</div>
                    </div>` : ''}
                </div>

                ${this.createExecutiveSummary(scores)}
                ${this.createCleanFindingsSection('Technical SEO Analysis', findings.technical)}
                ${this.createCleanFindingsSection('On-Page SEO Analysis', findings.onPage)}
                ${this.createCleanFindingsSection('Content Analysis', findings.content)}
                ${this.hasBacklinkData() && findings.backlinks.length > 0 ? this.createCleanFindingsSection('Backlink Analysis', findings.backlinks) : ''}
                ${this.hasGMBData() && findings.gmb.length > 0 ? this.createCleanFindingsSection('Google My Business Analysis', findings.gmb) : ''}
                ${this.createCleanRecommendationsSection(findings.recommendations)}
                ${this.createCleanCompetitorAnalysis()}
                ${this.createNextSteps()}
                ${this.createSimpleCTA()}
            </div>
        `;
    }

    createExecutiveSummary(scores) {
        let summaryText = '';
        let keyIssues = [];
        let strengths = [];
        let impactStatement = '';

        // Analyze scores to provide specific insights
        if (scores.technical < 60) keyIssues.push('technical infrastructure');
        if (scores.onPage < 60) keyIssues.push('on-page optimization');
        if (scores.content < 60) keyIssues.push('content quality and optimization');

        if (scores.technical >= 80) strengths.push('strong technical foundation');
        if (scores.onPage >= 80) strengths.push('well-optimized on-page elements');
        if (scores.content >= 80) strengths.push('high-quality content strategy');

        // Generate detailed summary based on overall score
        if (scores.overall >= 80) {
            summaryText = `Excellent SEO performance with an overall score of ${scores.overall}/100. The website demonstrates ${strengths.join(' and ')}. This strong foundation positions the site well for continued search engine success.`;
            impactStatement = 'With strategic fine-tuning of the identified minor issues, this website is positioned to achieve top search rankings and substantial organic traffic growth.';
        } else if (scores.overall >= 60) {
            summaryText = `Good SEO performance with an overall score of ${scores.overall}/100. The website shows solid foundations${strengths.length > 0 ? ' particularly in ' + strengths.join(' and ') : ''}${keyIssues.length > 0 ? ', though improvements needed in ' + keyIssues.join(' and ') : ''}.`;
            impactStatement = 'Addressing the identified optimization opportunities could result in 25-40% improvement in organic search visibility and user engagement metrics.';
        } else if (scores.overall >= 40) {
            summaryText = `Moderate SEO performance with a score of ${scores.overall}/100. The website has foundational elements in place but requires significant improvements in ${keyIssues.join(', ')}.`;
            impactStatement = 'Implementing our strategic recommendations could lead to 50-75% improvement in search rankings and a substantial increase in qualified organic traffic.';
        } else {
            summaryText = `Below-average SEO performance with a score of ${scores.overall}/100. Critical issues identified across ${keyIssues.join(', ')} require immediate attention.`;
            impactStatement = 'Following our comprehensive optimization strategy could result in 100-200% improvement in search visibility and establish a strong competitive position in your market.';
        }

        // Add industry-specific context
        let industryContext = '';
        const industry = this.formData.industry;
        if (industry === 'localbusiness') {
            industryContext = ' As a local business, implementing local SEO strategies will be crucial for capturing nearby customers and competing effectively in local search results.';
        } else if (industry === 'ecommerce') {
            industryContext = ' In the competitive e-commerce landscape, technical performance and product page optimization will be key drivers of conversion and revenue growth.';
        } else if (industry === 'healthcare') {
            industryContext = ' Healthcare websites require exceptional expertise demonstration and trustworthiness signals to rank well in this heavily regulated industry.';
        } else if (industry === 'legal') {
            industryContext = ' Legal service websites must balance competitive keyword optimization with professional credibility and local market targeting.';
        }

        return `
            <div class="clean-section page-break-before">
                <h3>Executive Summary</h3>
                <div class="client-info">
                    <p><strong>Client:</strong> ${this.formData.clientName || 'N/A'}</p>
                    <p><strong>Website:</strong> ${this.formData.websiteUrl || 'N/A'}</p>
                    <p><strong>Industry:</strong> ${this.getIndustryDisplayName(industry)}</p>
                    <p><strong>Target Location:</strong> ${this.formData.targetLocation || 'N/A'}</p>
                    <p><strong>Primary Keywords:</strong> ${this.formData.primaryKeywords || 'N/A'}</p>
                    <p><strong>Business Goals:</strong> ${this.formData.businessGoals || 'N/A'}</p>
                </div>
                
                <h4>Performance Overview</h4>
                <p>${summaryText}${industryContext}</p>
                
                <h4>Strategic Impact Assessment</h4>
                <p>${impactStatement}</p>
                
                <h4>Key Findings Summary</h4>
                <ul>
                    <li><strong>Technical SEO Score:</strong> ${scores.technical}/100 - ${this.getScoreAnalysis(scores.technical, 'technical')}</li>
                    <li><strong>On-Page SEO Score:</strong> ${scores.onPage}/100 - ${this.getScoreAnalysis(scores.onPage, 'onpage')}</li>
                    <li><strong>Content Quality Score:</strong> ${scores.content}/100 - ${this.getScoreAnalysis(scores.content, 'content')}</li>
                </ul>
                
                <p><em>This comprehensive audit analyzed ${Object.keys(this.formData).length} different SEO factors to provide actionable insights for improving your website's search engine performance, user experience, and competitive positioning.</em></p>
            </div>
        `;
    }

    getIndustryDisplayName(industry) {
        const industryNames = {
            'ecommerce': 'E-commerce',
            'healthcare': 'Healthcare',
            'finance': 'Finance',
            'technology': 'Technology',
            'education': 'Education',
            'realestate': 'Real Estate',
            'automotive': 'Automotive',
            'food': 'Food & Restaurant',
            'legal': 'Legal Services',
            'localbusiness': 'Local Business',
            'other': 'Other'
        };
        return industryNames[industry] || 'Not Specified';
    }

    getScoreAnalysis(score, category) {
        if (score >= 80) {
            const excellence = {
                'technical': 'Strong technical infrastructure with minor optimization opportunities',
                'onpage': 'Well-optimized pages with effective keyword targeting',
                'content': 'High-quality content providing excellent user value'
            };
            return excellence[category] || 'Excellent performance';
        } else if (score >= 60) {
            const good = {
                'technical': 'Solid technical foundation with some improvement areas',
                'onpage': 'Good optimization baseline requiring strategic enhancements',
                'content': 'Quality content with opportunities for depth and engagement'
            };
            return good[category] || 'Good performance with improvement potential';
        } else if (score >= 40) {
            const moderate = {
                'technical': 'Technical issues requiring immediate attention',
                'onpage': 'Significant on-page optimization opportunities',
                'content': 'Content strategy needs substantial improvement'
            };
            return moderate[category] || 'Moderate performance requiring improvement';
        } else {
            const poor = {
                'technical': 'Critical technical issues impacting search performance',
                'onpage': 'Poor on-page optimization hindering visibility',
                'content': 'Content quality below industry standards'
            };
            return poor[category] || 'Poor performance requiring immediate action';
        }
    }




    createNextSteps() {
        return `
            <div class="clean-section">
                <h3>Strategic Implementation Roadmap</h3>
                <ol style="padding-left: 1.5rem; line-height: 1.7;">
                    <li style="margin-bottom: 1rem;"><strong>Immediate Actions (Week 1-2):</strong> Address critical technical issues including site speed, SSL certificate, and mobile responsiveness problems</li>
                    <li style="margin-bottom: 1rem;"><strong>Short-term Optimization (Month 1):</strong> Optimize title tags, meta descriptions, and header structure across all key pages</li>
                    <li style="margin-bottom: 1rem;"><strong>Content Enhancement (Month 1-2):</strong> Develop comprehensive, keyword-rich content addressing identified gaps and user intent</li>
                    <li style="margin-bottom: 1rem;"><strong>Technical Implementation (Month 2):</strong> Implement structured data, improve site architecture, and enhance internal linking strategy</li>
                    <li style="margin-bottom: 1rem;"><strong>Performance Monitoring (Ongoing):</strong> Set up comprehensive analytics tracking and establish regular performance review cycles</li>
                    <li style="margin-bottom: 1rem;"><strong>Continuous Optimization (Ongoing):</strong> Implement regular content updates, technical maintenance, and strategy refinements based on performance data</li>
                </ol>
            </div>
        `;
    }


    createSimpleCTA() {
        return `
            <div class="simple-cta">
                <h3>Next Steps</h3>
                <p>For professional implementation of these SEO recommendations, contact Muhammad Ahmed at muhammadahmed7863@gmail.com</p>
                <p><strong>Ready to improve your search engine rankings? Get started today.</strong></p>
            </div>
        `;
    }

    createPDFExecutiveSummary(scores) {
        const industry = this.formData.industry;
        let summaryText = '';

        if (scores.overall >= 80) {
            summaryText = `Excellent SEO performance with an overall score of ${scores.overall}/100. The website demonstrates strong foundations and is well-positioned for search engine success.`;
        } else if (scores.overall >= 60) {
            summaryText = `Good SEO performance with an overall score of ${scores.overall}/100. The website shows solid foundations with opportunities for strategic improvements.`;
        } else if (scores.overall >= 40) {
            summaryText = `Moderate SEO performance with a score of ${scores.overall}/100. The website has foundational elements but requires significant improvements.`;
        } else {
            summaryText = `Below-average SEO performance with a score of ${scores.overall}/100. Critical issues require immediate attention to improve search visibility.`;
        }

        return `
            <div class="pdf-section pdf-keep-together page-break-before">
                <h2>Executive Summary</h2>
                <div class="pdf-client-info">
                    <p><strong>Client:</strong> ${this.formData.clientName || 'N/A'}</p>
                    <p><strong>Website:</strong> ${this.formData.websiteUrl || 'N/A'}</p>
                    <p><strong>Industry:</strong> ${this.getIndustryDisplayName(industry)}</p>
                    <p><strong>Target Location:</strong> ${this.formData.targetLocation || 'N/A'}</p>
                    <p><strong>Primary Keywords:</strong> ${this.formData.primaryKeywords || 'N/A'}</p>
                    <p><strong>Business Goals:</strong> ${this.formData.businessGoals || 'N/A'}</p>
                </div>
                
                <h3>Performance Overview</h3>
                <p>${summaryText}</p>
                
                <h3>Key Findings Summary</h3>
                <ul>
                    <li><strong>Technical SEO Score:</strong> ${scores.technical}/100 - ${this.getScoreAnalysis(scores.technical, 'technical')}</li>
                    <li><strong>On-Page SEO Score:</strong> ${scores.onPage}/100 - ${this.getScoreAnalysis(scores.onPage, 'onpage')}</li>
                    <li><strong>Content Quality Score:</strong> ${scores.content}/100 - ${this.getScoreAnalysis(scores.content, 'content')}</li>
                </ul>
                
                <p><em>This comprehensive audit provides actionable insights for improving your website's search engine performance and competitive positioning.</em></p>
            </div>
        `;
    }

    createPDFSection(title, findings) {
        if (findings.length === 0) {
            return `
                <div class="pdf-section pdf-keep-together">
                    <h2>${title}</h2>
                    <p><strong>Excellent Performance:</strong> This section demonstrates strong optimization with no critical issues identified.</p>
                </div>
            `;
        }

        const findingsHTML = findings.map(finding => {
            const priorityText = finding.severity === 'critical' ? 'High Priority' :
                finding.severity === 'warning' ? 'Medium Priority' :
                    finding.severity === 'info' ? 'Low Priority' : 'Recommendation';

            return `
                <div class="pdf-finding">
                    <h4>${finding.title} <span class="pdf-priority">(${priorityText})</span></h4>
                    <p>${finding.description}</p>
                </div>
            `;
        }).join('');

        return `
            <div class="pdf-section">
                <h2>${title}</h2>
                ${findingsHTML}
            </div>
        `;
    }

    createPDFRecommendations(recommendations) {
        if (recommendations.length === 0) {
            recommendations = [
                {
                    title: 'Maintain Current Excellence',
                    description: 'Your website shows strong SEO performance. Continue monitoring and maintaining current best practices.',
                    priority: 'low'
                }
            ];
        }

        const recommendationsHTML = recommendations.map(rec => {
            const priorityText = rec.priority === 'high' ? 'High Priority' :
                rec.priority === 'medium' ? 'Medium Priority' : 'Low Priority';

            return `
                <div class="pdf-finding">
                    <h4>${rec.title} <span class="pdf-priority">(${priorityText})</span></h4>
                    <p>${rec.description}</p>
                </div>
            `;
        }).join('');

        return `
            <div class="pdf-section">
                <h2>Strategic Recommendations</h2>
                ${recommendationsHTML}
            </div>
        `;
    }

    createPDFCompetitorAnalysis() {
        const competitors = this.formData.topCompetitors || 'Not provided';
        const competitorStrength = this.formData.competitorStrength || 'Not assessed';

        return `
            <div class="pdf-section pdf-keep-together">
                <h2>Competitive Analysis</h2>
                <p><strong>Primary Competitors:</strong> ${competitors}</p>
                <p><strong>Competition Level:</strong> ${competitorStrength.charAt(0).toUpperCase() + competitorStrength.slice(1)} competition</p>
                ${this.formData.competitorAnalysis ? `<p><strong>Analysis:</strong> ${this.formData.competitorAnalysis}</p>` : ''}
            </div>
        `;
    }

    createPDFNextSteps() {
        return `
            <div class="pdf-section">
                <h2>Implementation Roadmap</h2>
                <ol>
                    <li><strong>Immediate Actions (Week 1-2):</strong> Address critical technical issues including site speed and mobile responsiveness</li>
                    <li><strong>Short-term Optimization (Month 1):</strong> Optimize title tags, meta descriptions, and header structure</li>
                    <li><strong>Content Enhancement (Month 1-2):</strong> Develop comprehensive, keyword-rich content</li>
                    <li><strong>Technical Implementation (Month 2):</strong> Implement structured data and improve site architecture</li>
                    <li><strong>Ongoing Optimization:</strong> Regular content updates and performance monitoring</li>
                </ol>
            </div>
        `;
    }

    createPDFCTA() {
        return `
            <div class="pdf-cta pdf-keep-together">
                <h2 style="margin-top: 0; font-size: 14pt;">Next Steps</h2>
                <p>For professional implementation of these SEO recommendations, contact <strong>Empire Digisol</strong></p>
                <p><strong>Ready to improve your search engine rankings? Get started today.</strong></p>
                <p style="margin-bottom: 0;">Visit: empiredigisol.com</p>
            </div>
        `;
    }

    createCleanFindingsSection(title, findings) {
        if (findings.length === 0) {
            return `
                <div class="clean-section">
                    <h3>${title}</h3>
                    <p><strong>Excellent Performance:</strong> This section demonstrates strong optimization with no critical issues identified. Continue current best practices to maintain this high standard.</p>
                </div>
            `;
        }

        const findingsHTML = findings.map(finding => {
            const priorityText = finding.severity === 'critical' ? 'High Priority' :
                finding.severity === 'warning' ? 'Medium Priority' :
                    finding.severity === 'info' ? 'Low Priority' : 'Recommendation';

            return `
                <div class="clean-finding">
                    <h4>${finding.title} <span class="priority">(${priorityText})</span></h4>
                    <p>${finding.description}</p>
                </div>
            `;
        }).join('');

        return `
            <div class="clean-section">
                <h3>${title}</h3>
                ${findingsHTML}
            </div>
        `;
    }

    createCleanRecommendationsSection(recommendations) {
        if (recommendations.length === 0) {
            recommendations = [
                {
                    title: 'Maintain Current Excellence',
                    description: 'Your website shows strong SEO performance. Continue monitoring and maintaining current best practices while staying updated with the latest SEO trends and algorithm changes.',
                    priority: 'low'
                },
                {
                    title: 'Regular SEO Health Checks',
                    description: 'Schedule quarterly SEO audits to ensure continued optimization and catch any emerging issues early.',
                    priority: 'medium'
                }
            ];
        }

        const recommendationsHTML = recommendations.map(rec => {
            const priorityText = rec.priority === 'high' ? 'High Priority' :
                rec.priority === 'medium' ? 'Medium Priority' : 'Low Priority';

            return `
                <div class="clean-recommendation">
                    <h4>${rec.title} <span class="priority">(${priorityText})</span></h4>
                    <p>${rec.description}</p>
                </div>
            `;
        }).join('');

        return `
            <div class="clean-section">
                <h3>Strategic Recommendations & Action Items</h3>
                ${recommendationsHTML}
            </div>
        `;
    }

    createCleanCompetitorAnalysis() {
        const competitors = this.formData.topCompetitors || 'Not provided';
        const competitorStrength = this.formData.competitorStrength || 'Not assessed';
        const contentGaps = this.formData.competitorContentGap || 'Not analyzed';

        let competitiveInsight = '';
        switch (competitorStrength) {
            case 'weak':
                competitiveInsight = 'The competitive landscape presents excellent opportunities for rapid market share growth through strategic SEO implementation.';
                break;
            case 'moderate':
                competitiveInsight = 'Moderate competition exists, but strategic optimization can secure significant competitive advantages.';
                break;
            case 'strong':
                competitiveInsight = 'Strong competition requires focused, high-quality SEO strategies to achieve and maintain competitive positioning.';
                break;
            default:
                competitiveInsight = 'Competitive analysis will help identify specific opportunities for market positioning and growth.';
        }

        return `
            <div class="clean-section">
                <h3>Competitive Landscape Analysis</h3>
                <p><strong>Primary Competitors:</strong> ${competitors}</p>
                <p><strong>Competition Level:</strong> ${competitorStrength.charAt(0).toUpperCase() + competitorStrength.slice(1)} competition</p>
                <p><strong>Content Gap Opportunities:</strong> ${contentGaps.charAt(0).toUpperCase() + contentGaps.slice(1)} opportunities for content expansion</p>
                <p>${competitiveInsight}</p>
                ${this.formData.competitorAnalysis ? `<p><strong>Detailed Analysis:</strong> ${this.formData.competitorAnalysis}</p>` : ''}
                ${this.formData.opportunityAreas ? `<p><strong>Key Opportunity Areas:</strong> ${this.formData.opportunityAreas}</p>` : ''}
            </div>
        `;
    }

    printReport() {
        // Get the report content
        const reportElement = document.getElementById('auditReport');

        if (!reportElement || reportElement.innerHTML.trim() === '') {
            alert('Please generate a report first before downloading PDF.');
            return;
        }

        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            alert('PDF library not loaded. Please refresh the page and try again.');
            return;
        }

        try {
            const options = {
                margin: [0.75, 0.6, 0.75, 0.6],
                filename: `SEO-Audit-Report-${this.formData.clientName || 'Client'}-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff'
                },
                jsPDF: {
                    unit: 'in',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: {
                    mode: ['css', 'legacy'],
                    // before: ['.clean-section'],
                    // after: ['.page-break-after'],
                    avoid: [
                        '.score-card',
                        '.clean-finding',
                        '.client-info',
                        '.simple-cta',
                        '.clean-section',
                        'h3',  // section main headings
                        'h4'   // subsection headings
                    ]
                }
            };

            const originalText = this.printReportBtn.textContent;
            this.printReportBtn.textContent = 'Generating Professional PDF...';
            this.printReportBtn.disabled = true;

            // Use the actual report element with improved settings
            html2pdf()
                .set(options)
                .from(reportElement)
                .save()
                .then(() => {
                    this.printReportBtn.textContent = originalText;
                    this.printReportBtn.disabled = false;
                })
                .catch((error) => {
                    console.error('PDF generation error:', error);
                    alert('Error generating PDF: ' + error.message);
                    this.printReportBtn.textContent = originalText;
                    this.printReportBtn.disabled = false;
                });
        } catch (error) {
            console.error('PDF setup error:', error);
            alert('Error setting up PDF generation: ' + error.message);
        }
    }
    createSimplePDFContent() {
        // Create a temporary container for PDF content
        const pdfContainer = document.createElement('div');
        pdfContainer.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 8.27in;
            background: white;
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            padding: 0.5in;
            box-sizing: border-box;
        `;

        // Get basic data
        const clientName = this.formData.clientName || 'Client';
        const websiteUrl = this.formData.websiteUrl || 'Website';
        const industry = this.formData.industry || 'Not specified';
        const scores = this.calculateScores();

        // Create simple, reliable PDF content
        pdfContainer.innerHTML = `
            <div style="text-align: center; border-bottom: 2pt solid #667eea; padding-bottom: 1rem; margin-bottom: 2rem;">
                <h1 style="color: #1a202c; font-size: 24pt; font-weight: bold; margin: 0 0 0.5rem 0;">Empire Digisol SEO Audit</h1>
                <p style="color: #4a5568; font-size: 12pt; margin: 0;">Professional SEO Analysis Report</p>
                <p style="color: #718096; font-size: 10pt; margin-top: 0.5rem;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <div style="margin-bottom: 2rem;">
                <h2 style="color: #1a202c; font-size: 16pt; font-weight: bold; margin-bottom: 1rem;">Executive Summary</h2>
                
                <div style="background: #f8f9fa; padding: 1rem; border: 1pt solid #e9ecef; margin-bottom: 1rem;">
                    <p><strong>Client:</strong> ${clientName}</p>
                    <p><strong>Website:</strong> ${websiteUrl}</p>
                    <p><strong>Industry:</strong> ${industry}</p>
                </div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h2 style="color: #1a202c; font-size: 16pt; font-weight: bold; margin-bottom: 1rem;">SEO Scores</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="text-align: center; background: #f8f9fa; padding: 1rem; border: 1pt solid #e9ecef;">
                        <div style="font-size: 36pt; font-weight: bold; color: #667eea; margin-bottom: 0.5rem;">${scores.overall}</div>
                        <div style="font-size: 12pt; font-weight: bold;">Overall Score</div>
                    </div>
                    <div style="text-align: center; background: #f8f9fa; padding: 1rem; border: 1pt solid #e9ecef;">
                        <div style="font-size: 36pt; font-weight: bold; color: #667eea; margin-bottom: 0.5rem;">${scores.technical}</div>
                        <div style="font-size: 12pt; font-weight: bold;">Technical SEO</div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; border-top: 2pt solid #667eea; padding-top: 2rem; margin-top: 2rem;">
                <h2 style="color: #1a202c; font-size: 18pt; font-weight: bold; margin-bottom: 1rem;">Ready to Transform Your SEO Performance?</h2>
                <p style="color: #4a5568; font-size: 12pt; margin-bottom: 1.5rem;">Partner with Empire Digisol to implement these recommendations and achieve measurable results</p>
                <div style="display: inline-block; background: #667eea; color: white; padding: 0.75rem 2rem; border-radius: 6px; font-weight: bold; font-size: 12pt;">Get Started Today</div>
            </div>
        `;

        document.body.appendChild(pdfContainer);
        return pdfContainer;
    }

    createPDFOptimizedContent() {
        // Create a temporary container for PDF-optimized content
        const pdfContainer = document.createElement('div');
        pdfContainer.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 8.27in;
            background: white;
            font-family: 'Inter', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            padding: 0.5in;
            box-sizing: border-box;
        `;

        // Generate PDF-optimized HTML content
        const scores = this.calculateScores();
        const findings = this.generateFindings();

        pdfContainer.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <div style="text-align: center; border-bottom: 2pt solid #667eea; padding-bottom: 1rem; margin-bottom: 2rem;">
                    <h1 style="color: #1a202c; font-size: 24pt; font-weight: 700; margin: 0 0 0.5rem 0;">Empire Digisol SEO Audit</h1>
                    <p style="color: #4a5568; font-size: 12pt; margin: 0;">Professional SEO Analysis Report</p>
                    <p style="color: #718096; font-size: 10pt; margin-top: 0.5rem;">Generated on ${new Date().toLocaleDateString()}</p>
                </div>

                ${this.createPDFScoreOverview(scores)}
                ${this.createPDFExecutiveSummary(scores)}
                ${this.createPDFSectionAnalysis(findings)}
                ${this.createPDFRecommendations(findings)}
                ${this.createPDFCompetitiveAnalysis()}
                ${this.createPDFImplementationRoadmap()}
                ${this.createPDFCTASection()}
            </div>
        `;

        document.body.appendChild(pdfContainer);
        return pdfContainer;
    }

    createPDFScoreOverview(scores) {
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="text-align: center; background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1pt solid #e9ecef;">
                    <div style="font-size: 36pt; font-weight: 700; color: ${this.getScoreColor(scores.overall)}; margin-bottom: 0.5rem;">${scores.overall}</div>
                    <div style="font-size: 12pt; font-weight: 600; color: #1a202c;">Overall Score</div>
                    <div style="font-size: 10pt; color: #6c757d;">Grade: ${this.getScoreGrade(scores.overall)}</div>
                </div>
                <div style="text-align: center; background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1pt solid #e9ecef;">
                    <div style="font-size: 36pt; font-weight: 700; color: ${this.getScoreColor(scores.technical)}; margin-bottom: 0.5rem;">${scores.technical}</div>
                    <div style="font-size: 12pt; font-weight: 600; color: #1a202c;">Technical SEO</div>
                    <div style="font-size: 10pt; color: #6c757d;">Site Performance</div>
                </div>
                <div style="text-align: center; background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1pt solid #e9ecef;">
                    <div style="font-size: 36pt; font-weight: 700; color: ${this.getScoreColor(scores.onPage)}; margin-bottom: 0.5rem;">${scores.onPage}</div>
                    <div style="font-size: 12pt; font-weight: 600; color: #1a202c;">On-Page SEO</div>
                    <div style="font-size: 10pt; color: #6c757d;">Content Optimization</div>
                </div>
                <div style="text-align: center; background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1pt solid #e9ecef;">
                    <div style="font-size: 36pt; font-weight: 700; color: ${this.getScoreColor(scores.content)}; margin-bottom: 0.5rem;">${scores.content}</div>
                    <div style="font-size: 12pt; font-weight: 600; color: #1a202c;">Content Quality</div>
                    <div style="font-size: 10pt; color: #6c757d;">User Value</div>
                </div>
            </div>
        `;
    }

    createPDFExecutiveSummary(scores) {
        const clientName = this.formData.clientName || 'Client';
        const websiteUrl = this.formData.websiteUrl || 'Website';
        const industry = this.formData.industry || 'Not specified';
        const targetLocation = this.formData.targetLocation || 'Not specified';
        const primaryKeywords = this.formData.primaryKeywords || 'Not specified';
        const businessGoals = this.formData.businessGoals || 'Not specified';

        return `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: #1a202c; font-size: 16pt; font-weight: 700; margin-bottom: 1rem; border-bottom: 1pt solid #e2e8f0; padding-bottom: 0.5rem;">Executive Summary</h2>
                
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1pt solid #e9ecef;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 10pt;">
                        <div><strong>Client:</strong> ${clientName}</div>
                        <div><strong>Website:</strong> ${websiteUrl}</div>
                        <div><strong>Industry:</strong> ${industry}</div>
                        <div><strong>Target Location:</strong> ${targetLocation}</div>
                        <div style="grid-column: span 2;"><strong>Primary Keywords:</strong> ${primaryKeywords}</div>
                        <div style="grid-column: span 2;"><strong>Business Goals:</strong> ${businessGoals}</div>
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <h3 style="color: #1a202c; font-size: 14pt; font-weight: 600; margin-bottom: 0.5rem;">Performance Overview</h3>
                    <p style="font-size: 11pt; line-height: 1.5; margin-bottom: 1rem;">
                        ${this.generatePerformanceOverview(scores, industry)}
                    </p>
                </div>

                <div style="margin-bottom: 1rem;">
                    <h3 style="color: #1a202c; font-size: 14pt; font-weight: 600; margin-bottom: 0.5rem;">Strategic Impact Assessment</h3>
                    <p style="font-size: 11pt; line-height: 1.5; margin-bottom: 1rem;">
                        With strategic fine-tuning of the identified minor issues, this website is positioned to achieve top search rankings and substantial organic traffic growth.
                    </p>
                </div>

                <div>
                    <h3 style="color: #1a202c; font-size: 14pt; font-weight: 600; margin-bottom: 0.5rem;">Key Findings Summary</h3>
                    <ul style="font-size: 11pt; line-height: 1.5; padding-left: 1rem;">
                        <li style="margin-bottom: 0.5rem;"><strong>Technical SEO Score:</strong> ${scores.technical}/100 - ${this.getScoreDescription(scores.technical)}</li>
                        <li style="margin-bottom: 0.5rem;"><strong>On-Page SEO Score:</strong> ${scores.onPage}/100 - ${this.getScoreDescription(scores.onPage)}</li>
                        <li style="margin-bottom: 0.5rem;"><strong>Content Quality Score:</strong> ${scores.content}/100 - ${this.getScoreDescription(scores.content)}</li>
                    </ul>
                    <p style="font-size: 10pt; color: #6c757d; margin-top: 1rem;">
                        This comprehensive audit evaluated 63 SEO factors to deliver clear insights for boosting search performance, user experience, and competitiveness.
                    </p>
                </div>
            </div>
        `;
    }

    createPDFSectionAnalysis(findings) {
        return `
            <div style="margin-bottom: 2rem;">
                ${this.createPDFAnalysisSection('Technical SEO Analysis', findings.technical)}
                ${this.createPDFAnalysisSection('On-Page SEO Analysis', findings.onPage)}
                ${this.createPDFAnalysisSection('Content Analysis', findings.content)}
                ${this.hasBacklinkData() ? this.createPDFAnalysisSection('Backlink Analysis', findings.backlinks) : ''}
                ${this.hasGMBData() ? this.createPDFAnalysisSection('Google My Business Analysis', findings.gmb) : ''}
            </div>
        `;
    }

    createPDFAnalysisSection(title, findings) {
        if (!findings || findings.length === 0) {
            return `
                <div style="margin-bottom: 1.5rem;">
                    <h2 style="color: #1a202c; font-size: 16pt; font-weight: 700; margin-bottom: 1rem; border-bottom: 1pt solid #e2e8f0; padding-bottom: 0.5rem;">${title}</h2>
                    <div style="background: #d4edda; border: 1pt solid #c3e6cb; border-radius: 8px; padding: 1rem;">
                        <p style="color: #155724; font-weight: 600; margin: 0; font-size: 11pt;">✓ Excellent Performance Detected</p>
                        <p style="color: #155724; margin: 0.5rem 0 0 0; font-size: 10pt;">This section demonstrates strong optimization with no critical issues identified. Continue current best practices to maintain this high standard.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div style="margin-bottom: 1.5rem;">
                <h2 style="color: #1a202c; font-size: 16pt; font-weight: 700; margin-bottom: 1rem; border-bottom: 1pt solid #e2e8f0; padding-bottom: 0.5rem;">${title}</h2>
                ${findings.map(finding => `
                    <div style="margin-bottom: 1rem; border-left: 3pt solid ${this.getSeverityColor(finding.severity)}; padding-left: 1rem;">
                        <h4 style="color: #1a202c; font-size: 12pt; font-weight: 600; margin: 0 0 0.5rem 0;">${finding.title}</h4>
                        <p style="color: #4a5568; font-size: 10pt; line-height: 1.4; margin: 0;">${finding.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createPDFRecommendations(findings) {
        const allRecommendations = findings.recommendations || [];

        if (allRecommendations.length === 0) {
            return '';
        }

        const highPriority = allRecommendations.filter(rec => rec.priority === 'high');
        const mediumPriority = allRecommendations.filter(rec => rec.priority === 'medium');
        const lowPriority = allRecommendations.filter(rec => rec.priority === 'low');

        return `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: #1a202c; font-size: 16pt; font-weight: 700; margin-bottom: 1rem; border-bottom: 1pt solid #e2e8f0; padding-bottom: 0.5rem;">Strategic Recommendations & Action Items</h2>
                
                ${highPriority.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="background: #dc3545; color: white; padding: 0.5rem 1rem; border-radius: 4px; font-size: 12pt; font-weight: 600; margin: 0 0 1rem 0; text-align: center;">HIGH PRIORITY</h3>
                        ${highPriority.map(rec => `
                            <div style="background: #fff5f5; border: 1pt solid #fed7d7; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                                <h4 style="color: #c53030; font-size: 12pt; font-weight: 600; margin: 0 0 0.5rem 0;">${rec.title}</h4>
                                <p style="color: #4a5568; font-size: 10pt; line-height: 1.4; margin: 0;">${rec.description}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${mediumPriority.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="background: #ed8936; color: white; padding: 0.5rem 1rem; border-radius: 4px; font-size: 12pt; font-weight: 600; margin: 0 0 1rem 0; text-align: center;">MEDIUM PRIORITY</h3>
                        ${mediumPriority.map(rec => `
                            <div style="background: #fffaf0; border: 1pt solid #fbd38d; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                                <h4 style="color: #c05621; font-size: 12pt; font-weight: 600; margin: 0 0 0.5rem 0;">${rec.title}</h4>
                                <p style="color: #4a5568; font-size: 10pt; line-height: 1.4; margin: 0;">${rec.description}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${lowPriority.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="background: #38a169; color: white; padding: 0.5rem 1rem; border-radius: 4px; font-size: 12pt; font-weight: 600; margin: 0 0 1rem 0; text-align: center;">LOW PRIORITY</h3>
                        ${lowPriority.map(rec => `
                            <div style="background: #f0fff4; border: 1pt solid #9ae6b4; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                                <h4 style="color: #2f855a; font-size: 12pt; font-weight: 600; margin: 0 0 0.5rem 0;">${rec.title}</h4>
                                <p style="color: #4a5568; font-size: 10pt; line-height: 1.4; margin: 0;">${rec.description}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createPDFCompetitiveAnalysis() {
        const competitors = this.formData.topCompetitors || 'Not provided';
        const competitorStrength = this.formData.competitorStrength || 'not assessed';
        const contentGaps = this.formData.competitorContentGap || 'not analyzed';

        return `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: #1a202c; font-size: 16pt; font-weight: 700; margin-bottom: 1rem; border-bottom: 1pt solid #e2e8f0; padding-bottom: 0.5rem;">Competitive Landscape Analysis</h2>
                <p style="font-size: 11pt; line-height: 1.5; margin-bottom: 0.5rem;"><strong>Primary Competitors:</strong> ${competitors}</p>
                <p style="font-size: 11pt; line-height: 1.5; margin-bottom: 0.5rem;"><strong>Competition Level:</strong> ${competitorStrength.charAt(0).toUpperCase() + competitorStrength.slice(1)} competition</p>
                <p style="font-size: 11pt; line-height: 1.5; margin-bottom: 1rem;"><strong>Content Gap Opportunities:</strong> ${contentGaps.charAt(0).toUpperCase() + contentGaps.slice(1)} opportunities for content expansion</p>
                <p style="font-size: 11pt; line-height: 1.5;">Competitive analysis will help identify specific opportunities for market positioning and growth.</p>
                ${this.formData.competitorAnalysis ? `<p style="font-size: 11pt; line-height: 1.5; margin-top: 1rem;"><strong>Detailed Analysis:</strong> ${this.formData.competitorAnalysis}</p>` : ''}
                ${this.formData.opportunityAreas ? `<p style="font-size: 11pt; line-height: 1.5; margin-top: 1rem;"><strong>Key Opportunity Areas:</strong> ${this.formData.opportunityAreas}</p>` : ''}
            </div>
        `;
    }

    createPDFImplementationRoadmap() {
        return `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: #1a202c; font-size: 16pt; font-weight: 700; margin-bottom: 1rem; border-bottom: 1pt solid #e2e8f0; padding-bottom: 0.5rem;">Strategic Implementation Roadmap</h2>
                <ol style="font-size: 11pt; line-height: 1.5; padding-left: 1rem;">
                    <li style="margin-bottom: 1rem;"><strong>Immediate Actions (Week 1-2):</strong> Address critical technical issues including site speed, SSL certificate, and mobile responsiveness problems</li>
                    <li style="margin-bottom: 1rem;"><strong>Short-term Optimization (Month 1):</strong> Optimize title tags, meta descriptions, and header structure across all key pages</li>
                    <li style="margin-bottom: 1rem;"><strong>Content Enhancement (Month 1-2):</strong> Develop comprehensive, keyword-rich content addressing identified gaps and user intent</li>
                    <li style="margin-bottom: 1rem;"><strong>Technical Implementation (Month 2):</strong> Implement structured data, improve site architecture, and enhance internal linking strategy</li>
                    <li style="margin-bottom: 1rem;"><strong>Performance Monitoring (Ongoing):</strong> Set up comprehensive analytics tracking and establish regular performance review cycles</li>
                    <li style="margin-bottom: 1rem;"><strong>Continuous Optimization (Ongoing):</strong> Implement regular content updates, technical maintenance, and strategy refinements based on performance data</li>
                </ol>
            </div>
        `;
    }

    createPDFCTASection() {
        return `
            <div style="text-align: center; border-top: 2pt solid #667eea; padding-top: 2rem; margin-top: 2rem;">
                <h2 style="color: #1a202c; font-size: 18pt; font-weight: 700; margin-bottom: 1rem;">Ready to Transform Your SEO Performance?</h2>
                <p style="color: #4a5568; font-size: 12pt; margin-bottom: 1.5rem; line-height: 1.5;">Partner with Empire Digisol to implement these recommendations and achieve measurable results</p>
                <div style="display: inline-block; background: #667eea; color: white; padding: 0.75rem 2rem; border-radius: 6px; font-weight: 600; font-size: 12pt; text-decoration: none; border: 2pt solid #667eea;">Get Started Today</div>
            </div>
        `;
    }

    getSeverityColor(severity) {
        const colors = {
            'poor': '#dc3545',
            'fair': '#ffc107',
            'good': '#28a745',
            'excellent': '#17a2b8'
        };
        return colors[severity] || '#6c757d';
    }

    getScoreDescription(score) {
        if (score >= 90) return 'Excellent performance with minimal optimization needed';
        if (score >= 80) return 'Strong performance with minor improvement opportunities';
        if (score >= 70) return 'Good performance with some optimization needed';
        if (score >= 60) return 'Fair performance requiring moderate improvements';
        return 'Poor performance requiring significant optimization';
    }

    generatePerformanceOverview(scores, industry) {
        const overallGrade = this.getScoreGrade(scores.overall);
        const industryContext = this.getIndustryContext(industry);

        if (scores.overall >= 85) {
            return `Excellent SEO performance with an overall score of ${scores.overall}/100. The website demonstrates strong technical foundation and well-optimized on-page elements and high-quality content strategy. This strong foundation positions the site well for continued search engine success. ${industryContext}`;
        } else if (scores.overall >= 70) {
            return `Strong SEO performance with an overall score of ${scores.overall}/100. The website shows good optimization across most areas with some opportunities for improvement. ${industryContext}`;
        } else if (scores.overall >= 50) {
            return `Moderate SEO performance with an overall score of ${scores.overall}/100. The website has a solid foundation but requires focused optimization efforts to achieve competitive rankings. ${industryContext}`;
        } else {
            return `Below-average SEO performance with an overall score of ${scores.overall}/100. The website requires comprehensive optimization across multiple areas to improve search engine visibility and user experience. ${industryContext}`;
        }
    }

    getIndustryContext(industry) {
        const contexts = {
            'healthcare': 'Healthcare websites require exceptional expertise demonstration and trustworthiness signals to rank well in this heavily regulated industry.',
            'finance': 'Financial services websites must establish strong authority and trust signals due to YMYL (Your Money or Your Life) content requirements.',
            'ecommerce': 'In the competitive e-commerce landscape, technical performance and product page optimization will be key drivers of conversion and revenue growth.',
            'legal': 'Legal websites need to demonstrate expertise, authority, and trustworthiness through comprehensive content and professional credibility signals.',
            'localbusiness': 'Local businesses should focus on location-based optimization, Google My Business optimization, and local citation building.',
            'technology': 'Technology websites benefit from technical excellence, thought leadership content, and staying current with industry trends.',
            'education': 'Educational websites should focus on comprehensive, authoritative content that demonstrates expertise in their subject areas.'
        };
        return contexts[industry] || 'Industry-specific SEO strategies will help maximize organic search performance and competitive positioning.';
    }
}

// Initialize the SEO Audit Tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SEOAuditTool();
});

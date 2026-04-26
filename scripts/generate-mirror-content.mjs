#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const mirrorRoot = path.join(projectRoot, "mirror", "www.lastwartutorial.com");
const outputFile = path.join(projectRoot, "src", "data", "mirror-content.generated.ts");

const excludedSegments = new Set(["feed", "comments", "wp-json", "Edg", "+"]);
const excludedFiles = new Set(["GET.html", "xmlrpc0db0.html"]);
const featuredGuideOrder = [
  "season-6-lost-rainforest",
  "season-6-professions",
  "season-6-preseason",
  "start-of-season-6-lost-rainforest-best-strategy",
  "season-5-wild-west-the-golden-wasteland-of-the-land-of-liberty",
  "buildings",
  "daily-progress",
  "top-commander",
];

function decodeHtmlEntities(input) {
  const named = {
    amp: "&",
    apos: "'",
    quot: '"',
    nbsp: " ",
    lt: "<",
    gt: ">",
    ndash: "-",
    mdash: "-",
    hellip: "...",
    rsquo: "'",
    lsquo: "'",
    rdquo: '"',
    ldquo: '"',
    bull: "•",
    middot: "·",
    copy: "©",
    reg: "®",
    trade: "™",
  };

  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(parseInt(entity.slice(1), 10));
    }
    return named[entity] ?? `&${entity};`;
  });
}

function stripTags(input) {
  return decodeHtmlEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normaliseWhitespace(input) {
  return stripTags(input).replace(/\s+/g, " ").trim();
}

function slugify(input) {
  return normaliseWhitespace(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
    } else {
      files.push(absolutePath);
    }
  }
  return files;
}

function shouldIncludeFile(relativePath) {
  if (excludedFiles.has(path.basename(relativePath))) return false;
  const segments = relativePath.split(path.sep);
  return !segments.some((segment) => excludedSegments.has(segment));
}

function extractMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

function getAttr(tag, attrName) {
  const match = tag.match(new RegExp(`${attrName}=(["'])(.*?)\\1`, "i"));
  return match ? decodeHtmlEntities(match[2].trim()) : "";
}

function extractBalancedDiv(html, marker) {
  if (marker === "entry-content si-entry") {
    const entryMatch = html.match(/<div class="entry-content si-entry"[^>]*>/i);
    if (!entryMatch || entryMatch.index === undefined) return "";

    const start = entryMatch.index;
    const commentIndex = html.indexOf('<section id="comments"', start);
    const articleEndIndex = html.indexOf("</article><!-- #post", start);
    const endCandidates = [commentIndex, articleEndIndex].filter((index) => index > start);
    const end = endCandidates.length > 0 ? Math.min(...endCandidates) : -1;
    return end > start ? html.slice(start, end) : html.slice(start);
  }

  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return "";

  const divStart = html.lastIndexOf("<div", markerIndex);
  if (divStart < 0) return "";

  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = divStart;

  let depth = 0;
  let match;
  while ((match = tagRegex.exec(html))) {
    if (match[0].startsWith("</div")) {
      depth -= 1;
      if (depth === 0) {
        return html.slice(divStart, tagRegex.lastIndex);
      }
    } else {
      depth += 1;
    }
  }

  return "";
}

function resolveRelativePath(pageRelativePath, assetPath) {
  const withoutQuery = assetPath.split("?")[0].split("#")[0];
  if (withoutQuery.startsWith("http://") || withoutQuery.startsWith("https://")) {
    const url = new URL(withoutQuery);
    return url.pathname.replace(/^\/+/, "");
  }
  const currentDir = path.dirname(pageRelativePath);
  return path.normalize(path.join(currentDir, withoutQuery)).replaceAll("\\", "/");
}

function isImageAsset(assetPath) {
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(assetPath);
}

function resolveImage(pageRelativePath, source, fallbackAlt) {
  if (!source) return null;
  const resolved = resolveRelativePath(pageRelativePath, source);
  if (!isImageAsset(resolved)) return null;

  const absolutePath = path.join(mirrorRoot, resolved);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) return null;

  return {
    src: resolved,
    alt: fallbackAlt,
  };
}

function assetExpression(assetRelativePath) {
  return `new URL(${JSON.stringify(`../../mirror/www.lastwartutorial.com/${assetRelativePath}`)}, import.meta.url).href`;
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHeadingSection(html, anchor) {
  const headingRegex = new RegExp(`<h([234])\\b[^>]*id=["']${escapeRegex(anchor)}["'][^>]*>[\\s\\S]*?<\\/h\\1>`, "i");
  const startMatch = headingRegex.exec(html);
  if (!startMatch || startMatch.index === undefined) return "";

  const start = startMatch.index;
  const level = Number(startMatch[1]);
  const nextHeadingRegex = /<h([234])\b[^>]*id=["'][^"']+["'][^>]*>[\s\S]*?<\/h\1>/gi;
  nextHeadingRegex.lastIndex = start + startMatch[0].length;

  let nextMatch;
  while ((nextMatch = nextHeadingRegex.exec(html))) {
    const nextLevel = Number(nextMatch[1]);
    if (nextLevel <= level) {
      return html.slice(start, nextMatch.index);
    }
  }

  return html.slice(start);
}

function parseParagraphs(html) {
  return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => normaliseWhitespace(match[1]))
    .filter(Boolean);
}

function parseListItems(html) {
  return [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => normaliseWhitespace(match[1]))
    .filter(Boolean);
}

function parseTextBlocks(html) {
  return [...parseParagraphs(html), ...parseListItems(html)];
}

function parseHeroSkills(blockHtml) {
  const tableMatch = blockHtml.match(/<table>[\s\S]*?<tbody>([\s\S]*?)<\/tbody><\/table>/i);
  if (!tableMatch) return [];

  return [...tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)]
    .slice(1)
    .map((rowMatch) => [...rowMatch[1].matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((cell) => normaliseWhitespace(cell[1])))
    .filter((cells) => cells.length >= 3)
    .map((cells) => ({
      name: cells[0],
      description: cells[2],
    }));
}

function parseHeroIntel() {
  const heroesRelativePath = "heroes/index.html";
  const heroesAbsolutePath = path.join(mirrorRoot, heroesRelativePath);
  if (!fs.existsSync(heroesAbsolutePath)) return null;

  const html = fs.readFileSync(heroesAbsolutePath, "utf8");
  const contentHtml = extractBalancedDiv(html, 'entry-content si-entry');
  if (!contentHtml) return null;

  const introItems = parseTextBlocks(extractHeadingSection(contentHtml, "introduction"));
  const typeItems = parseTextBlocks(extractHeadingSection(contentHtml, "types"));
  const abilityItems = parseTextBlocks(extractHeadingSection(contentHtml, "ability"));

  const gearByAbility = {
    attacker: {
      recommended: parseListItems(extractHeadingSection(contentHtml, "ability-attack")),
      summary: "Attack heroes are best upgraded with attack-focused gear from the mirror guide.",
    },
    defender: {
      recommended: parseListItems(extractHeadingSection(contentHtml, "ability-defense")),
      summary: "Defense heroes are best upgraded with survivability-focused gear from the mirror guide.",
    },
    support: {
      recommended: [],
      summary: "The mirrored hero guide does not list a dedicated support-gear pair, so use the main gears guide for situational upgrades.",
    },
  };

  const availableHeroesHtml = extractHeadingSection(contentHtml, "available-heroes");
  if (!availableHeroesHtml) {
    return {
      overview: introItems,
      typeGuide: typeItems,
      abilityGuide: abilityItems,
      heroes: [],
    };
  }

  const heroHeadingMatches = [...availableHeroesHtml.matchAll(/<h3\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h3>/gi)];

  const heroes = heroHeadingMatches.map((match, index) => {
    const next = heroHeadingMatches[index + 1];
    const blockStart = match.index ?? 0;
    const blockEnd = next ? next.index ?? availableHeroesHtml.length : availableHeroesHtml.length;
    const blockHtml = availableHeroesHtml.slice(blockStart, blockEnd);

    const headingText = normaliseWhitespace(match[2]);
    const [namePart, titlePart] = headingText.split(/\s+[–-]\s+/);
    const description = parseParagraphs(blockHtml).find(Boolean) ?? "";

    const listItems = parseListItems(blockHtml);
    const rarity = listItems.find((item) => item.toLowerCase().startsWith("rarity:"))?.split(":")[1]?.trim() ?? "";
    const type = listItems.find((item) => item.toLowerCase().startsWith("type:"))?.split(":")[1]?.trim() ?? "";
    const ability = listItems.find((item) => item.toLowerCase().startsWith("ability:"))?.split(":")[1]?.trim() ?? "";
    const gear = gearByAbility[ability.toLowerCase()] ?? {
      recommended: [],
      summary: "See the mirrored gears guide for general gear upgrade priorities.",
    };

    const imageTag = [...blockHtml.matchAll(/<img\b[^>]*>/gi)]
      .map((imgMatch) => imgMatch[0])
      .find((tag) => {
        const src = getAttr(tag, "src");
        return src.includes("/wp-content/uploads/") && !src.includes("skill");
      });

    const image = imageTag ? resolveImage(heroesRelativePath, getAttr(imageTag, "src"), namePart?.trim() || headingText) : null;

    return {
      id: slugify(namePart || headingText),
      name: (namePart || headingText).trim(),
      title: (titlePart || "").trim(),
      description,
      rarity,
      type,
      ability,
      gear,
      image,
      skills: parseHeroSkills(blockHtml),
    };
  });

  return {
    overview: introItems,
    typeGuide: typeItems,
    abilityGuide: abilityItems,
    heroes,
  };
}

function classifyGuide(slug, title, description) {
  const text = `${slug} ${title} ${description}`.toLowerCase();

  if (text.includes("season")) return "seasons";
  if (text.includes("top commander") || text.includes("rookie") || text.includes("celebration")) return "events";
  if (text.includes("building") || text.includes("daily") || text.includes("vip")) return "progression";
  return "systems";
}

function sectionFromSlice(title, sliceHtml, pageRelativePath) {
  const paragraphs = [...sliceHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => normaliseWhitespace(match[1]))
    .filter(Boolean);

  const images = [...sliceHtml.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => {
      const src = getAttr(match[0], "src");
      const alt = getAttr(match[0], "alt");
      return resolveImage(pageRelativePath, src, alt || title);
    })
    .filter(Boolean);

  return {
    id: slugify(title),
    title: normaliseWhitespace(title),
    body: paragraphs.slice(0, 4),
    image: images[0] ?? null,
  };
}

function parseGuide(relativePath) {
  const absolutePath = path.join(mirrorRoot, relativePath);
  const html = fs.readFileSync(absolutePath, "utf8");

  const entryTitle = extractMatch(html, /<h1\b[^>]*class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i);
  const description =
    extractMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i) ||
    extractMatch(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const documentTitle = extractMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const contentHtml = extractBalancedDiv(html, 'entry-content si-entry');

  if (!contentHtml || !entryTitle) return null;

  const headingMatches = [...contentHtml.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)];
  const sections = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const current = headingMatches[index];
    const next = headingMatches[index + 1];
    const headingHtml = current[3];
    const headingText = normaliseWhitespace(headingHtml);
    if (!headingText || headingText.toLowerCase() === "contents") continue;

    const sliceStart = current.index ?? 0;
    const sliceEnd = next ? next.index ?? contentHtml.length : contentHtml.length;
    const sliceHtml = contentHtml.slice(sliceStart, sliceEnd);
    const section = sectionFromSlice(headingText, sliceHtml, relativePath);
    if (section.body.length > 0) sections.push(section);
  }

  const paragraphs = [...contentHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => normaliseWhitespace(match[1]))
    .filter(Boolean);

  const imageMatches = [...contentHtml.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => {
      const src = getAttr(match[0], "src");
      const alt = getAttr(match[0], "alt");
      return resolveImage(relativePath, src, alt || entryTitle);
    })
    .filter(Boolean);

  const slug = relativePath === "index.html" ? "home" : relativePath.replace(/\/index\.html$/, "");
  const title = normaliseWhitespace(entryTitle);
  const ogImage = extractMatch(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const ogImageRelative = resolveImage(relativePath, ogImage, title)?.src ?? "";
  const highlights = paragraphs.slice(0, 4);
  const words = stripTags(contentHtml).split(/\s+/).filter(Boolean).length;

  if (sections.length === 0 && paragraphs.length > 0) {
    sections.push({
      id: "overview",
      title: "Overview",
      body: paragraphs.slice(0, 4),
      image: imageMatches[0] ?? null,
    });
  }

  return {
    id: slug,
    slug,
    title,
    description: normaliseWhitespace(description || documentTitle),
    category: classifyGuide(slug, title, description),
    sourcePath: relativePath,
    publishedAt: extractMatch(html, /<meta\s+property="article:published_time"\s+content="([^"]*)"/i),
    updatedAt: extractMatch(html, /<meta\s+property="article:modified_time"\s+content="([^"]*)"/i),
    readTimeMinutes: Math.max(2, Math.round(words / 220)),
    highlights,
    sections: sections.slice(0, 10),
    gallery: imageMatches.slice(0, 8),
    coverImage: ogImageRelative || imageMatches[0]?.src || "",
    tags: Array.from(
      new Set(
        [slug, ...title.split(/\s+/), ...description.split(/\s+/)]
          .map((part) => slugify(part))
          .filter((part) => part.length > 3)
      )
    ).slice(0, 12),
  };
}

function faqFromGuides(guidesBySlug) {
  const mappings = [
    ["What should players expect from Season 6?", "season-6-lost-rainforest"],
    ["How does the Season 6 preseason work?", "season-6-preseason"],
    ["What are the key strategy priorities at the start of Season 6?", "start-of-season-6-lost-rainforest-best-strategy"],
    ["How do professions change Season 6 gameplay?", "season-6-professions"],
    ["What should beginners focus on first?", "basics"],
    ["Which upgrades matter most for progression?", "buildings"],
    ["How should daily progression be managed?", "daily-progress"],
    ["What value does the VIP program provide?", "vip-program"],
  ];

  return mappings
    .map(([question, slug]) => {
      const guide = guidesBySlug.get(slug);
      if (!guide) return null;
      return {
        question,
        answer: guide.highlights[0] || guide.description,
        guideId: guide.id,
      };
    })
    .filter(Boolean);
}

function toCode(value, indent = 0) {
  const spacing = "  ".repeat(indent);
  const childSpacing = "  ".repeat(indent + 1);

  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${childSpacing}${toCode(item, indent + 1)}`).join(",\n")}\n${spacing}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return `{\n${entries
      .map(([key, entryValue]) => `${childSpacing}${key}: ${toCode(entryValue, indent + 1)}`)
      .join(",\n")}\n${spacing}}`;
  }
  throw new Error(`Unsupported value: ${String(value)}`);
}

function guideToCode(guide, indent = 0) {
  const spacing = "  ".repeat(indent);
  const childSpacing = "  ".repeat(indent + 1);

  const objectEntries = [
    `id: ${JSON.stringify(guide.id)}`,
    `slug: ${JSON.stringify(guide.slug)}`,
    `title: ${JSON.stringify(guide.title)}`,
    `description: ${JSON.stringify(guide.description)}`,
    `category: ${JSON.stringify(guide.category)}`,
    `sourcePath: ${JSON.stringify(guide.sourcePath)}`,
    `publishedAt: ${JSON.stringify(guide.publishedAt)}`,
    `updatedAt: ${JSON.stringify(guide.updatedAt)}`,
    `readTimeMinutes: ${guide.readTimeMinutes}`,
    `coverImage: ${guide.coverImage ? assetExpression(guide.coverImage) : "null"}`,
    `tags: ${toCode(guide.tags, indent + 1)}`,
    `highlights: ${toCode(guide.highlights, indent + 1)}`,
    `gallery: ${toCode(
      guide.gallery.map((image) => ({
        alt: image.alt,
        src: `__ASSET__${image.src}`,
      })),
      indent + 1
    ).replace(/"__ASSET__(.*?)"/g, (_, assetPath) => assetExpression(assetPath))}`,
    `sections: ${toCode(
      guide.sections.map((section) => ({
        ...section,
        image: section.image
          ? {
              alt: section.image.alt,
              src: `__ASSET__${section.image.src}`,
            }
          : null,
      })),
      indent + 1
    ).replace(/"__ASSET__(.*?)"/g, (_, assetPath) => assetExpression(assetPath))}`,
  ];

  return `{\n${objectEntries.map((entry) => `${childSpacing}${entry}`).join(",\n")}\n${spacing}}`;
}

const files = walk(mirrorRoot)
  .filter((file) => file.endsWith("index.html"))
  .map((file) => path.relative(mirrorRoot, file))
  .filter(shouldIncludeFile)
  .sort();

const guides = files
  .map((relativePath) => parseGuide(relativePath))
  .filter(Boolean)
  .filter((guide) => guide.id !== "home");

const guidesBySlug = new Map(guides.map((guide) => [guide.slug, guide]));

const categories = [
  {
    id: "seasons",
    label: "Season Guides",
    description: "Preseason, weekly breakdowns, and full seasonal overviews from the mirrored archive.",
  },
  {
    id: "events",
    label: "Events",
    description: "Competitive and calendar-driven activities pulled from the mirror and grouped for quick reference.",
  },
  {
    id: "progression",
    label: "Progression",
    description: "Base growth, VIP value, building priorities, and everyday account advancement.",
  },
  {
    id: "systems",
    label: "Core Systems",
    description: "Broader gameplay systems, onboarding topics, and evergreen Last War fundamentals.",
  },
];

const featuredGuideIds = featuredGuideOrder.filter((slug) => guidesBySlug.has(slug));
const totalSections = guides.reduce((count, guide) => count + guide.sections.length, 0);

const siteMeta = parseGuide("index.html") ?? {
  title: "Last War Tutorial",
  description: "Mirror-backed Last War companion app",
  coverImage: "",
};
const heroIntel = parseHeroIntel() ?? {
  overview: [],
  typeGuide: [],
  abilityGuide: [],
  heroes: [],
};

const output = `/* eslint-disable */
// This file is auto-generated by scripts/generate-mirror-content.mjs
export const mirrorContent = {
  generatedAt: ${JSON.stringify(new Date().toISOString())},
  site: {
    title: ${JSON.stringify(siteMeta.title)},
    description: ${JSON.stringify(siteMeta.description)},
    coverImage: ${siteMeta.coverImage ? assetExpression(siteMeta.coverImage) : "null"},
  },
  stats: {
    guideCount: ${guides.length},
    sectionCount: ${totalSections},
  },
  heroIntel: ${toCode(
    {
      ...heroIntel,
      heroes: heroIntel.heroes.map((hero) => ({
        ...hero,
        image: hero.image
          ? {
              alt: hero.image.alt,
              src: `__ASSET__${hero.image.src}`,
            }
          : null,
      })),
    },
    1
  ).replace(/"__ASSET__(.*?)"/g, (_, assetPath) => assetExpression(assetPath))},
  categories: ${toCode(categories, 1)},
  featuredGuideIds: ${toCode(featuredGuideIds, 1)},
  faqs: ${toCode(faqFromGuides(guidesBySlug), 1)},
  guides: [
${guides.map((guide) => `    ${guideToCode(guide, 2)}`).join(",\n")}
  ],
} as const;
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, output);

console.log(`Generated ${guides.length} guides into ${path.relative(projectRoot, outputFile)}`);

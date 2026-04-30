const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");

async function authorImageShortcode(src, alt, widthPx, className, loading) {
  const fullSrc = path.join(__dirname, "src", src);
  const metadata = await Image(fullSrc, {
    widths: [widthPx, widthPx * 2],
    formats: ["avif", "webp", "png"],
    outputDir: "./_site/assets/images/authors/",
    urlPath: "/assets/images/authors/",
    filenameFormat: function (id, src, width, format) {
      const name = path.basename(src, path.extname(src));
      return `${name}-${width}w.${format}`;
    },
    sharpAvifOptions: { quality: 72 },
    sharpWebpOptions: { quality: 80 },
  });

  const avif = metadata.avif || [];
  const webp = metadata.webp || [];
  const png  = metadata.png  || [];

  const avifSrcset = avif.map(i => `${i.url} ${i.width}w`).join(", ");
  const webpSrcset = webp.map(i => `${i.url} ${i.width}w`).join(", ");
  const fallback   = png[0] || webp[0] || avif[0];
  const sizes = `${widthPx}px`;

  return `<picture>
  ${avif.length ? `<source type="image/avif" srcset="${avifSrcset}" sizes="${sizes}">` : ""}
  ${webp.length ? `<source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">` : ""}
  <img src="${fallback.url}" alt="${alt}" class="${className}" width="${widthPx}" height="${widthPx}" loading="${loading || 'lazy'}" decoding="async">
</picture>`;
}

module.exports = function (eleventyConfig) {
  // Passthrough static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Watch targets
  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("src/assets/js/");

  // Author image shortcode — generates AVIF + WebP + PNG <picture> element
  eleventyConfig.addAsyncShortcode("authorImage", authorImageShortcode);

  // Inline critical CSS shortcode
  eleventyConfig.addShortcode("inlineCss", function (filepath) {
    const fullPath = path.join(__dirname, "src/assets/css", filepath);
    try {
      return `<style>${fs.readFileSync(fullPath, "utf8")}</style>`;
    } catch (e) {
      return `<!-- CSS not found: ${filepath} -->`;
    }
  });

  // Format Indian Rupee numbers in templates
  eleventyConfig.addFilter("inr", function (value) {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  });

  // Date filter — human-readable (used in page content)
  eleventyConfig.addFilter("dateDisplay", function (dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  // Date filter — ISO 8601 YYYY-MM-DD (required by sitemap protocol)
  eleventyConfig.addFilter("dateIso", function (dateStr) {
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  });

  // Collections: India calculators
  eleventyConfig.addCollection("indiaCalcs", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/india/*.njk")
      .filter((p) => !p.inputPath.includes("index"));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};

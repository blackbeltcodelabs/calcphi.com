const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  // Passthrough static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Watch targets
  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("src/assets/js/");

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

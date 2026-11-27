/**
 * Builds the studio's 3D text typefaces from Google Fonts.
 *
 * Run with: node scripts/build-studio-fonts.mjs
 *
 * The generated JSON files live in src/components/studio/fonts and are
 * committed, so the app never fetches a font at runtime. Variable fonts are
 * instanced twice (regular 400 / bold 700) with fontTools before conversion.
 *
 * Requirements: `python3 -m venv /tmp/font-venv && /tmp/font-venv/bin/pip
 * install fonttools` and the dev dependency opentype.js.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/components/studio/fonts");
const cacheDir = "/tmp/studio-fonts";
const fontTools = process.env.FONTTOOLS || "/tmp/font-venv/bin/fonttools";

const FONTS = [
  { key: "roboto", file: "ofl/roboto/Roboto%5Bwdth,wght%5D.ttf", variable: true },
  { key: "montserrat", file: "ofl/montserrat/Montserrat%5Bwght%5D.ttf", variable: true },
  { key: "oswald", file: "ofl/oswald/Oswald%5Bwght%5D.ttf", variable: true },
  { key: "playfairdisplay", file: "ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf", variable: true },
  { key: "spacegrotesk", file: "ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf", variable: true },
  { key: "bebasneue", file: "ofl/bebasneue/BebasNeue-Regular.ttf" },
  { key: "lobster", file: "ofl/lobster/Lobster-Regular.ttf" },
  { key: "pacifico", file: "ofl/pacifico/Pacifico-Regular.ttf" },
];

const RESOLUTION = 1000;
const CHARSET = Array.from({ length: 95 }, (_, index) => String.fromCharCode(32 + index));

const n = (value) => Math.round(value * 100) / 100;

function download(relative, target) {
  execFileSync("curl", [
    "-fsSL",
    "-o",
    target,
    `https://raw.githubusercontent.com/google/fonts/main/${relative}`,
  ]);
}

function instance(source, target, weight) {
  execFileSync(fontTools, [
    "varLib.instancer",
    source,
    `wght=${weight}`,
    "-o",
    target,
  ]);
}

/** Turns one TTF into the compact JSON format three's FontLoader reads. */
function convert(ttfPath, familyName) {
  const buffer = readFileSync(ttfPath);
  const font = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
  const upem = font.unitsPerEm || 1000;
  const scale = RESOLUTION / upem;
  const glyphs = {};

  CHARSET.forEach((char) => {
    const glyph = font.charToGlyph(char);
    if (!glyph) return;
    const path = glyph.getPath(0, 0, upem);
    const outline = [];
    path.commands.forEach((command) => {
      if (command.type === "M") {
        outline.push("m", n(command.x * scale), n(command.y * scale));
      } else if (command.type === "L") {
        outline.push("l", n(command.x * scale), n(command.y * scale));
      } else if (command.type === "Q") {
        outline.push(
          "q",
          n(command.x * scale),
          n(command.y * scale),
          n(command.x1 * scale),
          n(command.y1 * scale)
        );
      } else if (command.type === "C") {
        outline.push(
          "b",
          n(command.x * scale),
          n(command.y * scale),
          n(command.x1 * scale),
          n(command.y1 * scale),
          n(command.x2 * scale),
          n(command.y2 * scale)
        );
      }
    });
    const bounds = glyph.getBoundingBox();
    glyphs[char] = {
      ha: n((glyph.advanceWidth || 0) * scale),
      x_min: n(bounds.x1 * scale),
      x_max: n(bounds.x2 * scale),
      o: outline.join(" "),
    };
  });

  const metrics = font.tables.post || {};
  return {
    glyphs,
    familyName,
    ascender: n(font.ascender * scale),
    descender: n(font.descender * scale),
    underlinePosition: n((metrics.underlinePosition || 0) * scale),
    underlineThickness: n((metrics.underlineThickness || 50) * scale),
    boundingBox: {
      yMin: n(font.descender * scale),
      yMax: n(font.ascender * scale),
      xMin: 0,
      xMax: n((font.tables.head?.xMax || upem) * scale),
    },
    resolution: RESOLUTION,
    original_font_information: { family_name: familyName },
  };
}

mkdirSync(outDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

const manifest = [];

const force = process.argv.includes("--force");

FONTS.forEach((entry) => {
  const regularPath = join(outDir, `${entry.key}.json`);
  if (!force && existsSync(regularPath) && !entry.variable) {
    manifest.push({ key: entry.key, bold: false });
    return;
  }
  if (!force && existsSync(regularPath)) {
    manifest.push({ key: entry.key, bold: existsSync(join(outDir, `${entry.key}-bold.json`)) });
    return;
  }
  const source = join(cacheDir, `${entry.key}.ttf`);
  process.stdout.write(`Downloading ${entry.key}…\n`);
  download(entry.file, source);

  const family = entry.key.charAt(0).toUpperCase() + entry.key.slice(1);
  writeFileSync(
    join(outDir, `${entry.key}.json`),
    JSON.stringify(convert(source, family))
  );

  let bold = false;
  if (entry.variable) {
    try {
      const boldPath = join(cacheDir, `${entry.key}-bold.ttf`);
      instance(source, boldPath, 700);
      writeFileSync(
        join(outDir, `${entry.key}-bold.json`),
        JSON.stringify(convert(boldPath, `${family} Bold`))
      );
      bold = true;
    } catch (error) {
      process.stdout.write(`  no bold instance: ${error.message.split("\n")[0]}\n`);
    }
  }
  manifest.push({ key: entry.key, bold });
});

writeFileSync(
  join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
process.stdout.write(`Wrote ${manifest.length} families to ${outDir}\n`);

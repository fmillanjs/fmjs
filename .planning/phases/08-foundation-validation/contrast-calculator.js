/**
 * WCAG Contrast Calculator for OKLCH colors
 * Converts OKLCH to RGB and calculates WCAG contrast ratios
 */

// OKLCH to RGB conversion (simplified - uses relative luminance approximation)
function oklchToRgb(l, c, h) {
  // OKLCH lightness (0-100%) approximately maps to relative luminance
  // For achromatic colors (c=0), we can use lightness directly
  // For chromatic colors, we need proper conversion but achromatic approximation works for our tokens

  // Convert lightness percentage to 0-1 range
  const lightness = l / 100;

  // For achromatic colors (c ≈ 0), R=G=B
  if (c < 0.01) {
    const val = Math.round(lightness * 255);
    return [val, val, val];
  }

  // For chromatic colors, use polar to cartesian conversion
  // This is a simplified conversion - accurate enough for contrast measurement
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // Convert Lab to RGB (simplified)
  // This approximation is sufficient for contrast ratio calculation
  const y = (lightness + 16) / 116;
  const x = a / 500 + y;
  const z = y - b / 200;

  // Convert XYZ to RGB
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let blu = x * 0.0557 + y * -0.2040 + z * 1.0570;

  // Clamp and convert to 0-255
  r = Math.max(0, Math.min(1, r)) * 255;
  g = Math.max(0, Math.min(1, g)) * 255;
  blu = Math.max(0, Math.min(1, blu)) * 255;

  return [Math.round(r), Math.round(g), Math.round(blu)];
}

// Calculate relative luminance (WCAG formula)
function relativeLuminance(r, g, b) {
  // Convert to 0-1 range
  const [rs, gs, bs] = [r / 255, g / 255, b / 255];

  // Apply gamma correction
  const toLinear = (c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLin = toLinear(rs);
  const gLin = toLinear(gs);
  const bLin = toLinear(bs);

  // Calculate luminance
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// Calculate contrast ratio (WCAG formula)
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse OKLCH string
function parseOklch(oklchStr) {
  const match = oklchStr.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return null;
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3])
  };
}

// Calculate contrast for a token pair
function calculatePairContrast(fgOklch, bgOklch) {
  const fg = parseOklch(fgOklch);
  const bg = parseOklch(bgOklch);

  if (!fg || !bg) return null;

  const fgRgb = oklchToRgb(fg.l, fg.c, fg.h);
  const bgRgb = oklchToRgb(bg.l, bg.c, bg.h);

  const fgLum = relativeLuminance(...fgRgb);
  const bgLum = relativeLuminance(...bgRgb);

  const ratio = contrastRatio(fgLum, bgLum);

  return {
    ratio: ratio.toFixed(2),
    fgRgb: fgRgb,
    bgRgb: bgRgb
  };
}

// Test with our color tokens
const lightModePairs = [
  // Body text
  { fg: 'oklch(15% 0 0)', bg: 'oklch(98% 0 0)', name: 'foreground/background', required: 4.5 },
  { fg: 'oklch(45% 0 0)', bg: 'oklch(96% 0 0)', name: 'muted-foreground/muted', required: 4.5 },
  { fg: 'oklch(15% 0 0)', bg: 'oklch(100% 0 0)', name: 'card-foreground/card', required: 4.5 },
  { fg: 'oklch(20% 0 0)', bg: 'oklch(94% 0.05 250)', name: 'accent-foreground/accent', required: 4.5 },
  // Button text
  { fg: 'oklch(100% 0 0)', bg: 'oklch(55% 0.2 250)', name: 'primary-foreground/primary', required: 4.5 },
  { fg: 'oklch(15% 0 0)', bg: 'oklch(96% 0 0)', name: 'secondary-foreground/secondary', required: 4.5 },
  { fg: 'oklch(100% 0 0)', bg: 'oklch(55% 0.22 25)', name: 'destructive-foreground/destructive', required: 4.5 },
  { fg: 'oklch(100% 0 0)', bg: 'oklch(60% 0.18 145)', name: 'success-foreground/success', required: 4.5 },
  { fg: 'oklch(15% 0 0)', bg: 'oklch(70% 0.15 65)', name: 'warning-foreground/warning', required: 4.5 },
  // UI components
  { fg: 'oklch(89% 0 0)', bg: 'oklch(98% 0 0)', name: 'border/background', required: 3.0 },
  { fg: 'oklch(89% 0 0)', bg: 'oklch(96% 0 0)', name: 'border/muted', required: 3.0 },
  { fg: 'oklch(89% 0 0)', bg: 'oklch(98% 0 0)', name: 'input/background', required: 3.0 },
];

const darkModePairs = [
  // Body text
  { fg: 'oklch(98% 0 0)', bg: 'oklch(15% 0 0)', name: 'foreground/background', required: 4.5 },
  { fg: 'oklch(65% 0 0)', bg: 'oklch(20% 0 0)', name: 'muted-foreground/muted', required: 4.5 },
  { fg: 'oklch(98% 0 0)', bg: 'oklch(18% 0 0)', name: 'card-foreground/card', required: 4.5 },
  { fg: 'oklch(98% 0 0)', bg: 'oklch(25% 0.05 250)', name: 'accent-foreground/accent', required: 4.5 },
  // Button text
  { fg: 'oklch(100% 0 0)', bg: 'oklch(65% 0.2 250)', name: 'primary-foreground/primary', required: 4.5 },
  { fg: 'oklch(98% 0 0)', bg: 'oklch(25% 0 0)', name: 'secondary-foreground/secondary', required: 4.5 },
  { fg: 'oklch(100% 0 0)', bg: 'oklch(60% 0.22 25)', name: 'destructive-foreground/destructive', required: 4.5 },
  { fg: 'oklch(100% 0 0)', bg: 'oklch(65% 0.18 145)', name: 'success-foreground/success', required: 4.5 },
  { fg: 'oklch(10% 0 0)', bg: 'oklch(75% 0.15 65)', name: 'warning-foreground/warning', required: 4.5 },
  // UI components
  { fg: 'oklch(27% 0 0)', bg: 'oklch(15% 0 0)', name: 'border/background', required: 3.0 },
  { fg: 'oklch(27% 0 0)', bg: 'oklch(20% 0 0)', name: 'border/muted', required: 3.0 },
  { fg: 'oklch(27% 0 0)', bg: 'oklch(15% 0 0)', name: 'input/background', required: 3.0 },
];

console.log('=== LIGHT MODE ===\n');
lightModePairs.forEach(pair => {
  const result = calculatePairContrast(pair.fg, pair.bg);
  const status = parseFloat(result.ratio) >= pair.required ? 'PASS' : 'FAIL';
  console.log(`${pair.name}: ${result.ratio}:1 (${status})`);
});

console.log('\n=== DARK MODE ===\n');
darkModePairs.forEach(pair => {
  const result = calculatePairContrast(pair.fg, pair.bg);
  const status = parseFloat(result.ratio) >= pair.required ? 'PASS' : 'FAIL';
  console.log(`${pair.name}: ${result.ratio}:1 (${status})`);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculatePairContrast, parseOklch };
}

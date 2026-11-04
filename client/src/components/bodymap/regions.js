/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Body map — geometry and metadata. All wording lives in i18n under
 *  `bodyMap.regions.<id>`, so this file never needs translating.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  The figure is ONE smooth silhouette (a closed spline through the points
 *  below, mirrored about x = 120 in a 240 × 540 viewBox). Regions are simple
 *  bands and polygons that are then clipped by that silhouette, so every
 *  region follows the body's own outline without hand-drawing each one.
 *
 *  The figure is deliberately neutral: no sex characteristics, no skin tone,
 *  no face. It is a map, not a portrait.
 *
 *  `onFigure: false` marks a region with no shape — "skin" covers the whole
 *  body, so it is offered as a chip only.
 *
 *  `urgent: true` makes the result card show the emergency notice.
 *
 *  `zoom` is where the figure moves when the region is chosen: the region's
 *  centre in viewBox units and a scale.
 */

import { BODY_REGION_IDS } from '@shared/body-regions.js';

export const VIEWBOX = { width: 240, height: 540 };

/** Right half of the outline, top of the head clockwise to the crotch. */
const RIGHT = [
  [120, 13], [135, 16], [145, 27], [149, 43], [147, 59], [141, 72], [133, 80],
  [131, 88], [133, 97], [147, 103], [163, 107], [175, 114], [182, 126],
  [185, 145], [187, 166], [190, 188], [194, 210], [198, 234], [202, 258], [205, 280],
  [209, 292], [211, 305], [208, 317], [201, 322], [196, 312], [194, 297],
  [190, 274], [186, 250], [182, 227], [178, 204], [174, 182], [170, 160],
  [164, 156], [161, 178], [158, 202], [160, 226], [164, 248], [167, 270],
  [168, 292], [166, 318], [163, 346], [159, 374], [156, 400], [157, 424], [157, 446],
  [154, 470], [150, 492], [148, 505], [153, 515], [156, 524], [149, 529], [135, 529],
  [131, 520], [131, 505], [130, 482], [129, 458], [129, 434], [128, 410],
  [127, 386], [125, 362], [123, 340], [121, 326],
];

const mirror = ([x, y]) => [240 - x, y];
const OUTLINE = [...RIGHT, ...RIGHT.slice(1).reverse().map(mirror)];

/** Closed Catmull-Rom spline through the points (tension < 1 avoids overshoot). */
function spline(points, tension = 0.82) {
  const n = points.length;
  const p = (i) => points[(i + n) % n];
  let d = `M${p(0)[0]} ${p(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const k = tension / 6;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return `${d} Z`;
}

export const SILHOUETTE = spline(OUTLINE);

const rect = (x, y, w, h) => `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
/** Arms: both sides, from the shoulder joint to the fingertips. Drawn above the torso bands. */
const ARM_RIGHT = 'M158 98 H240 V340 H177 L177 214 L169 160 L159 128 Z';
const ARM_LEFT = 'M82 98 H0 V340 H63 L63 214 L71 160 L81 128 Z';

export const REGIONS = [
  { id: 'head', views: ['front', 'back'], urgent: true, d: rect(0, 0, 240, 84), zoom: { x: 120, y: 48, s: 2.3 } },
  { id: 'throat', views: ['front'], d: rect(96, 84, 48, 17), zoom: { x: 120, y: 92, s: 2.5 } },
  { id: 'neck', views: ['back'], d: rect(96, 84, 48, 17), zoom: { x: 120, y: 92, s: 2.5 } },
  { id: 'chest', views: ['front'], urgent: true, d: rect(40, 101, 160, 95), zoom: { x: 120, y: 148, s: 1.85 } },
  { id: 'abdomen', views: ['front'], d: rect(40, 196, 160, 70), zoom: { x: 120, y: 232, s: 1.95 } },
  { id: 'pelvis', views: ['front'], d: rect(40, 266, 160, 66), zoom: { x: 120, y: 298, s: 1.95 } },
  { id: 'upperBack', views: ['back'], d: rect(40, 101, 160, 89), zoom: { x: 120, y: 146, s: 1.85 } },
  { id: 'lowerBack', views: ['back'], d: rect(40, 190, 160, 76), zoom: { x: 120, y: 228, s: 1.95 } },
  { id: 'hips', views: ['back'], d: rect(40, 266, 160, 70), zoom: { x: 120, y: 300, s: 1.95 } },
  { id: 'arms', views: ['front', 'back'], d: `${ARM_RIGHT} ${ARM_LEFT}`, zoom: { x: 120, y: 210, s: 1.25 }, layer: 'top' },
  { id: 'legs', views: ['front'], d: rect(0, 332, 240, 208), zoom: { x: 120, y: 430, s: 1.5 } },
  { id: 'calves', views: ['back'], d: rect(0, 336, 240, 204), zoom: { x: 120, y: 432, s: 1.5 } },
  // Whole-body: no shape on the diagram, offered as a chip in both views.
  { id: 'skin', views: ['front', 'back'], onFigure: false, d: null },
];

/** Quiet anatomical cues, drawn under the regions. Purely decorative. */
export const DETAILS = {
  front: [
    'M98 108 C108 112 114 112 119 110', 'M142 108 C132 112 126 112 121 110', // collarbones
    'M120 128 V176', // sternum
    'M118 244 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0', // navel
    'M134 396 c4 6 12 6 16 0', 'M106 396 c-4 6 -12 6 -16 0', // knees
  ],
  back: [
    'M120 104 V262', // spine
    'M98 122 C92 136 94 150 106 158', 'M142 122 C148 136 146 150 134 158', // shoulder blades
    'M100 288 C110 298 130 298 140 288', // hips
    'M134 404 c4 -6 12 -6 16 0', 'M106 404 c-4 -6 -12 -6 -16 0', // backs of knees
  ],
};

export const regionsForView = (view) => REGIONS.filter((r) => r.views.includes(view));

export const getRegion = (id) => REGIONS.find((r) => r.id === id) || null;

/**
 * Region ids that can legitimately arrive as ?area= on the booking page.
 * Re-exported from the shared list, because the server validates against it.
 */
export const REGION_IDS = BODY_REGION_IDS;

// Fails loudly in development if the diagram and the shared list drift apart.
if (import.meta.env?.DEV) {
  const drawn = REGIONS.map((r) => r.id).sort().join();
  if (drawn !== [...BODY_REGION_IDS].sort().join()) {
    console.error('[bodymap] regions.js and shared/body-regions.js disagree', {
      drawn: REGIONS.map((r) => r.id),
      shared: BODY_REGION_IDS,
    });
  }
}

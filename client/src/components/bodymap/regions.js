/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Body map regions — geometry and metadata. All wording lives in i18n
 *  under `bodyMap.regions.<id>`, so this file never needs translating.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Shapes are drawn in a 240 × 540 viewBox on a figure centred at x = 120.
 *  `mirror: true` renders the shape a second time flipped about that centre,
 *  which is how arms and legs stay symmetrical without duplicate path data.
 *
 *  `onFigure: false` marks a region with no shape — "skin" covers the whole
 *  body, so it is offered as a chip only rather than pretending to be a
 *  clickable area somewhere on the diagram.
 *
 *  `urgent: true` makes the panel show the emergency notice for that region.
 *  Chest and head complaints are where a patient is most likely to be sitting
 *  at home with something that needs an ambulance, not a booking form.
 */

/** Flips a shape about the vertical centre line of the viewBox. */
export const MIRROR_TRANSFORM = 'translate(240, 0) scale(-1, 1)';

export const VIEWBOX = { width: 240, height: 540 };

export const REGIONS = [
  {
    id: 'head',
    views: ['front', 'back'],
    urgent: true,
    shape: { type: 'ellipse', cx: 120, cy: 46, rx: 28, ry: 32 },
  },
  {
    id: 'throat',
    views: ['front'],
    shape: { type: 'rect', x: 106, y: 72, width: 28, height: 24, rx: 10 },
  },
  {
    id: 'neck',
    views: ['back'],
    shape: { type: 'rect', x: 106, y: 72, width: 28, height: 24, rx: 10 },
  },
  {
    id: 'chest',
    views: ['front'],
    urgent: true,
    shape: {
      type: 'path',
      d: 'M120 92 C100 92 86 95 78 100 C70 105 68 118 68 132 L68 186 C68 192 73 196 80 196 '
        + 'L160 196 C167 196 172 192 172 186 L172 132 C172 118 170 105 162 100 C154 95 140 92 120 92 Z',
    },
  },
  {
    id: 'abdomen',
    views: ['front'],
    shape: {
      type: 'path',
      d: 'M80 199 L160 199 C164 199 167 203 167 208 L164 258 C163 266 158 271 150 271 '
        + 'L90 271 C82 271 77 266 76 258 L73 208 C73 203 76 199 80 199 Z',
    },
  },
  {
    id: 'pelvis',
    views: ['front'],
    shape: {
      type: 'path',
      d: 'M78 274 L162 274 L158 308 C157 317 150 324 141 324 L99 324 C90 324 83 317 82 308 Z',
    },
  },
  {
    id: 'upperBack',
    views: ['back'],
    shape: {
      type: 'path',
      d: 'M120 92 C100 92 86 95 78 100 C70 105 68 118 68 132 L68 178 L172 178 L172 132 '
        + 'C172 118 170 105 162 100 C154 95 140 92 120 92 Z',
    },
  },
  {
    id: 'lowerBack',
    views: ['back'],
    shape: {
      type: 'path',
      d: 'M68 181 L172 181 L168 258 C167 266 162 271 154 271 L86 271 C78 271 73 266 72 258 Z',
    },
  },
  {
    id: 'hips',
    views: ['back'],
    shape: {
      type: 'path',
      d: 'M76 274 L164 274 L160 316 C159 325 152 332 143 332 L97 332 C88 332 81 325 80 316 Z',
    },
  },
  {
    id: 'arms',
    views: ['front', 'back'],
    mirror: true,
    shape: {
      type: 'path',
      d: 'M67 106 C58 112 53 128 50 150 L42 232 C40 246 39 262 40 276 L40 300 '
        + 'C40 309 45 314 52 314 C59 314 64 309 64 300 L64 276 C64 262 65 247 67 233 '
        + 'L76 152 C78 132 76 116 72 106 Z',
    },
  },
  {
    id: 'legs',
    views: ['front'],
    mirror: true,
    shape: {
      type: 'path',
      d: 'M85 328 L117 328 L116 404 C115 438 112 470 108 500 L107 514 '
        + 'C106 521 101 526 94 526 C87 526 82 521 82 513 L83 500 '
        + 'C84 470 84 438 84 404 Z',
    },
  },
  {
    id: 'calves',
    views: ['back'],
    mirror: true,
    shape: {
      type: 'path',
      d: 'M85 336 L117 336 L116 408 C115 440 112 472 108 500 L107 514 '
        + 'C106 521 101 526 94 526 C87 526 82 521 82 513 L83 500 '
        + 'C84 472 84 440 84 408 Z',
    },
  },
  {
    // Whole-body: no shape on the diagram, offered as a chip in both views.
    id: 'skin',
    views: ['front', 'back'],
    onFigure: false,
    shape: null,
  },
];

export const regionsForView = (view) => REGIONS.filter((r) => r.views.includes(view));

export const getRegion = (id) => REGIONS.find((r) => r.id === id) || null;

/** Region ids that can legitimately arrive as ?area= on the booking page. */
export const REGION_IDS = REGIONS.map((r) => r.id);

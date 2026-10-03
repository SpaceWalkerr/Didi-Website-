/**
 * Body-map region ids.
 *
 * Shared because both ends need them and they must not drift: the browser
 * builds the diagram from this list, and the server validates `bodyRegion` on
 * an incoming booking against it before storing it. Geometry and wording live
 * elsewhere — the SVG shapes in client/src/components/bodymap/regions.js, the
 * labels in the i18n files under `bodyMap.regions.<id>`.
 */
export const BODY_REGION_IDS = [
  'head',
  'throat',
  'chest',
  'abdomen',
  'pelvis',
  'upperBack',
  'lowerBack',
  'hips',
  'arms',
  'legs',
  'calves',
  'neck',
  'skin',
];

export const isBodyRegion = (id) => BODY_REGION_IDS.includes(id);

/**
 * Flatten nested appearance and build draggable background gradients.
 */

export const DROP_ZONE_BASE_KEYS = [
  'dropZoneBackground',
  'dropZoneHoverBackground',
  'dropZoneLabelColor',
  'zoneIconColor'
];

export const DROP_ZONE_BORDER_COLOR_KEYS = [
  'dropZoneBorder',
  'dropZoneHoverBorder'
];

export const DROP_ZONE_COLOR_KEYS = DROP_ZONE_BASE_KEYS
  .concat(DROP_ZONE_BORDER_COLOR_KEYS);

export const DRAGGABLE_BORDER_COLOR_KEYS = [
  'draggableBorder',
  'draggableHoverBorder',
  'draggableDroppedBorder',
  'draggableCorrectBorder',
  'draggableWrongBorder'
];

export const DRAGGABLE_TEXT_COLOR_KEYS = [
  'draggableColor',
  'draggableHoverColor',
  'draggableDroppedColor',
  'draggableCorrectColor',
  'draggableWrongColor'
];

export const VALID_BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

export const BORDER_STYLE_DEFAULT = 'solid';

export const BORDER_WIDTH_DEFAULT = 0.1;

export const BORDER_WIDTH_MAX = 0.5;

export const BORDER_RADIUS_DEFAULT = 0.25;

export const BORDER_RADIUS_MAX = 2;

export const DRAGGABLE_BACKGROUND_KEYS = [
  'draggableBackground',
  'draggableHoverBackground',
  'draggableDroppedBackground',
  'draggableCorrectBackground',
  'draggableWrongBackground'
];

export const DRAGGABLE_GRADIENT_STATES = [
  {
    solidKey: 'draggableBackground',
    stateKey: 'normal',
    legacyFillKey: 'draggableBackgroundFill',
    defaults: { colorStart: '#dddddd', colorEnd: '#bbbbbb' }
  },
  {
    solidKey: 'draggableHoverBackground',
    stateKey: 'hover',
    legacyFillKey: 'draggableHoverBackgroundFill',
    defaults: { colorStart: '#edd6e9', colorEnd: '#d4bed8' }
  },
  {
    solidKey: 'draggableDroppedBackground',
    stateKey: 'dropped',
    legacyFillKey: 'draggableDroppedBackgroundFill',
    defaults: { colorStart: '#cee0f4', colorEnd: '#a9c3d0' }
  },
  {
    solidKey: 'draggableCorrectBackground',
    stateKey: 'correct',
    legacyFillKey: 'draggableCorrectBackgroundFill',
    defaults: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8' }
  },
  {
    solidKey: 'draggableWrongBackground',
    stateKey: 'wrong',
    legacyFillKey: 'draggableWrongBackgroundFill',
    defaults: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8' }
  }
];

const LEGACY_FILL_KEYS = DRAGGABLE_GRADIENT_STATES.map(function (s) {
  return s.legacyFillKey;
});

const ROOT_KEYS_TO_STRIP_AFTER_NESTED = DROP_ZONE_COLOR_KEYS
  .concat(DRAGGABLE_BACKGROUND_KEYS)
  .concat(DRAGGABLE_TEXT_COLOR_KEYS)
  .concat(DRAGGABLE_BORDER_COLOR_KEYS)
  .concat(LEGACY_FILL_KEYS);

/**
 * @param {number|string} angle
 * @param {number} fallback
 * @returns {number}
 */
export function normalizeGradientAngle(angle, fallback) {
  var n = parseInt(angle, 10);

  if (isNaN(n)) {
    return fallback;
  }

  if (n < 0) {
    return 0;
  }

  if (n > 360) {
    return 360;
  }

  return n;
}

/**
 * @param {string} color
 * @param {string} fallback
 * @returns {string}
 */
export function sanitizeGradientColor(color, fallback) {
  if (!color || typeof color !== 'string') {
    return fallback;
  }

  var c = color.trim();

  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c)) {
    return c;
  }

  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)$/.test(c)) {
    return c;
  }

  return fallback;
}

/**
 * @param {Object} stateColors
 * @param {Object} defaults
 * @param {number} angle
 * @returns {string}
 */
export function buildLinearGradientFromState(stateColors, defaults, angle) {
  var start;
  var end;

  stateColors = stateColors || {};
  start = sanitizeGradientColor(stateColors.colorStart, defaults.colorStart);
  end = sanitizeGradientColor(stateColors.colorEnd, defaults.colorEnd);

  return 'linear-gradient(' + angle + 'deg, ' + start + ' 0%, ' + end + ' 100%)';
}

/**
 * @param {Object} [appearance]
 * @returns {boolean}
 */
function usesLegacyPerStateGradient(appearance) {
  var i;
  var fill;

  if (!appearance) {
    return false;
  }

  for (i = 0; i < DRAGGABLE_GRADIENT_STATES.length; i++) {
    fill = appearance[DRAGGABLE_GRADIENT_STATES[i].legacyFillKey];

    if (fill && fill.useGradient === true) {
      return true;
    }
  }

  return false;
}

/**
 * @param {Object} [appearance]
 * @returns {number}
 */
function getLegacyGlobalAngle(appearance) {
  var i;
  var fill;
  var gc;

  if (!appearance) {
    return 180;
  }

  for (i = 0; i < DRAGGABLE_GRADIENT_STATES.length; i++) {
    fill = appearance[DRAGGABLE_GRADIENT_STATES[i].legacyFillKey];

    if (fill && fill.useGradient === true && fill.gradientColors) {
      gc = fill.gradientColors;

      if (gc.angle !== undefined && gc.angle !== null && gc.angle !== '') {
        return normalizeGradientAngle(gc.angle, 180);
      }
    }
  }

  return 180;
}

/**
 * @param {Object} target
 * @param {Object} source
 * @param {string[]} keys
 */
/**
 * @param {number|string} width
 * @param {number} fallback
 * @returns {string}
 */
export function formatBorderWidthEm(width, fallback) {
  var n = parseFloat(width);

  if (isNaN(n)) {
    n = fallback;
  }

  if (n < 0) {
    n = 0;
  }

  if (n > BORDER_WIDTH_MAX) {
    n = BORDER_WIDTH_MAX;
  }

  return n + 'em';
}

/**
 * @param {number|string} radius
 * @param {number} fallback
 * @returns {string}
 */
export function formatBorderRadiusEm(radius, fallback) {
  var n = parseFloat(radius);

  if (isNaN(n)) {
    n = fallback;
  }

  if (n < 0) {
    n = 0;
  }

  if (n > BORDER_RADIUS_MAX) {
    n = BORDER_RADIUS_MAX;
  }

  return n + 'em';
}

/**
 * @param {string} style
 * @returns {string}
 */
export function normalizeBorderStyle(style) {
  if (style && VALID_BORDER_STYLES.indexOf(style) !== -1) {
    return style;
  }

  return BORDER_STYLE_DEFAULT;
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isTruthy(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

/**
 * @param {Object} dropZone
 * @param {Object} appearance
 * @param {Object} flat
 */
function applyDropZoneBorderAppearance(dropZone, appearance, flat) {
  var borderSettings;
  var normal;
  var hover;
  var useBorder;
  var radius;

  dropZone = dropZone || {};
  appearance = appearance || {};
  radius = appearance.dropZoneBorderRadius;

  if (radius === undefined || radius === null || radius === '') {
    radius = dropZone.borderRadius;
  }

  flat.dropZoneBorderRadius = formatBorderRadiusEm(radius, BORDER_RADIUS_DEFAULT);
  useBorder = dropZone.useDropZoneBorder === undefined ?
    true :
    isTruthy(dropZone.useDropZoneBorder);

  flat.useDropZoneBorder = useBorder;
  flat.dropZoneBordersEnabled = useBorder ? '1' : '0';

  if (!useBorder) {
    flat.dropZoneBorderWidth = '0';
    flat.dropZoneBorderStyle = 'none';
    flat.dropZoneHoverBorderStyle = 'none';
    return;
  }

  borderSettings = dropZone.borderSettings || {};
  normal = borderSettings.normal || {};
  hover = borderSettings.hover || {};

  flat.dropZoneBorderWidth = formatBorderWidthEm(borderSettings.borderWidth, BORDER_WIDTH_DEFAULT);
  flat.dropZoneBorderStyle = normalizeBorderStyle(normal.borderStyle);
  flat.dropZoneHoverBorderStyle = normalizeBorderStyle(hover.borderStyle || normal.borderStyle);

  if (normal.borderColor !== undefined && normal.borderColor !== null && normal.borderColor !== '') {
    flat.dropZoneBorder = normal.borderColor;
  }
  else if (dropZone.dropZoneBorder !== undefined && dropZone.dropZoneBorder !== null && dropZone.dropZoneBorder !== '') {
    flat.dropZoneBorder = dropZone.dropZoneBorder;
  }

  if (hover.borderColor !== undefined && hover.borderColor !== null && hover.borderColor !== '') {
    flat.dropZoneHoverBorder = hover.borderColor;
  }
  else if (dropZone.dropZoneHoverBorder !== undefined && dropZone.dropZoneHoverBorder !== null && dropZone.dropZoneHoverBorder !== '') {
    flat.dropZoneHoverBorder = dropZone.dropZoneHoverBorder;
  }
}

/**
 * @param {Object} draggable
 * @param {Object} appearance
 * @param {Object} flat
 */
function applyDraggableBorderAppearance(draggable, appearance, flat) {
  var borderSettings;
  var borderColors;
  var useBorder;
  var radius;

  draggable = draggable || {};
  appearance = appearance || {};
  radius = appearance.draggableBorderRadius;

  if (radius === undefined || radius === null || radius === '') {
    radius = draggable.borderRadius;
  }

  flat.draggableBorderRadius = formatBorderRadiusEm(radius, BORDER_RADIUS_DEFAULT);
  useBorder = isTruthy(draggable.useDraggableBorder);
  flat.useDraggableBorder = useBorder;
  flat.draggableBordersEnabled = useBorder ? '1' : '0';

  if (!useBorder) {
    flat.draggableBorderWidth = '0';
    flat.draggableBorderStyle = 'none';
    return;
  }

  borderSettings = draggable.borderSettings || {};
  flat.draggableBorderWidth = formatBorderWidthEm(borderSettings.borderWidth, BORDER_WIDTH_DEFAULT);
  flat.draggableBorderStyle = normalizeBorderStyle(borderSettings.borderStyle);

  borderColors = borderSettings.borderColors || borderSettings;
  copyDefinedKeys(flat, borderColors, DRAGGABLE_BORDER_COLOR_KEYS);

  if (!flat.draggableBorder && draggable.draggableBorder) {
    flat.draggableBorder = draggable.draggableBorder;
  }
}

function copyDefinedKeys(target, source, keys) {
  var i;
  var key;
  var value;

  if (!source) {
    return;
  }

  for (i = 0; i < keys.length; i++) {
    key = keys[i];
    value = source[key];

    if (value !== undefined && value !== null && value !== '') {
      target[key] = value;
    }
  }
}

/**
 * @param {Object} [appearance] raw settings.appearance
 * @returns {Object} flat map keyed like APPEARANCE_DEFAULTS
 */
export function flattenAppearance(appearance) {
  var flat = {};
  var draggable;
  var dropZone;
  var useGradient;
  var gradientBackgrounds;
  var solidBackgrounds;
  var angle;
  var i;
  var spec;
  var stateColors;
  var legacyFill;
  var legacyGc;

  if (!appearance) {
    return flat;
  }

  if (appearance.canvasBackground) {
    flat.canvasBackground = appearance.canvasBackground;
  }

  dropZone = appearance.dropZoneColors || appearance;
  copyDefinedKeys(flat, dropZone, DROP_ZONE_BASE_KEYS);
  applyDropZoneBorderAppearance(dropZone, appearance, flat);

  draggable = appearance.draggableColors || appearance;
  copyDefinedKeys(flat, draggable, DRAGGABLE_TEXT_COLOR_KEYS);
  applyDraggableBorderAppearance(draggable, appearance, flat);

  useGradient = isTruthy(draggable.useGradientBackground) || usesLegacyPerStateGradient(appearance);

  if (useGradient) {
    gradientBackgrounds = draggable.gradientBackgrounds || {};
    angle = normalizeGradientAngle(gradientBackgrounds.gradientAngle, getLegacyGlobalAngle(appearance));

    for (i = 0; i < DRAGGABLE_GRADIENT_STATES.length; i++) {
      spec = DRAGGABLE_GRADIENT_STATES[i];
      stateColors = gradientBackgrounds[spec.stateKey];
      legacyFill = appearance[spec.legacyFillKey];

      if ((!stateColors || (!stateColors.colorStart && !stateColors.colorEnd)) &&
          legacyFill && legacyFill.useGradient === true && legacyFill.gradientColors) {
        stateColors = legacyFill.gradientColors;
      }

      flat[spec.solidKey] = buildLinearGradientFromState(stateColors, spec.defaults, angle);
    }
  }
  else {
    solidBackgrounds = draggable.solidBackgrounds || {};

    for (i = 0; i < DRAGGABLE_BACKGROUND_KEYS.length; i++) {
      spec = DRAGGABLE_BACKGROUND_KEYS[i];

      if (solidBackgrounds[spec] !== undefined && solidBackgrounds[spec] !== null && solidBackgrounds[spec] !== '') {
        flat[spec] = solidBackgrounds[spec];
      }
      else if (draggable[spec] !== undefined && draggable[spec] !== null && draggable[spec] !== '') {
        flat[spec] = draggable[spec];
      }
      else if (appearance[spec] !== undefined && appearance[spec] !== null && appearance[spec] !== '') {
        flat[spec] = appearance[spec];
      }
    }
  }

  return flat;
}

/**
 * @returns {Object}
 */
export function getDefaultNestedAppearanceExtras() {
  return {
    dropZoneBorderRadius: 0.25,
    dropZoneColors: {
      useDropZoneBorder: true,
      borderSettings: {
        borderWidth: 0.1,
        normal: {
          borderStyle: 'solid',
          borderColor: '#666666'
        },
        hover: {
          borderStyle: 'solid',
          borderColor: '#666666'
        }
      }
    },
    draggableBorderRadius: 0.25,
    draggableColors: {
      useDraggableBorder: false,
      useGradientBackground: false,
      solidBackgrounds: {},
      borderSettings: {
        borderStyle: 'solid',
        borderWidth: 0.1,
        borderColors: {
          draggableBorder: '#c6c6c6',
          draggableHoverBorder: '#d4bed8',
          draggableDroppedBorder: '#a9c3d0',
          draggableCorrectBorder: '#9dd8bb',
          draggableWrongBorder: '#f7d0d0'
        }
      },
      gradientBackgrounds: {
        gradientAngle: 180,
        normal: { colorStart: '#dddddd', colorEnd: '#bbbbbb' },
        hover: { colorStart: '#edd6e9', colorEnd: '#d4bed8' },
        dropped: { colorStart: '#cee0f4', colorEnd: '#a9c3d0' },
        correct: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8' },
        wrong: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8' }
      }
    }
  };
}

export { ROOT_KEYS_TO_STRIP_AFTER_NESTED };

import { flattenAppearance } from './draggable-fill';

/**
 * Global appearance defaults and CSS custom properties for Drag Question CFRD.
 */
export const APPEARANCE_DEFAULTS = {
  canvasBackground: '#ffffff',
  dropZoneBackground: '#f5f5f5',
  dropZoneBorder: '#666666',
  dropZoneHoverBackground: '#edd6e9',
  dropZoneHoverBorder: '#666666',
  dropZoneLabelColor: '#333333',
  zoneIconColor: '#333333',
  draggableBackground: '#dddddd',
  draggableBorder: '#c6c6c6',
  draggableColor: '#333333',
  draggableHoverBackground: '#edd6e9',
  draggableHoverBorder: '#d4bed8',
  draggableHoverColor: '#663366',
  draggableDroppedBackground: '#cee0f4',
  draggableDroppedBorder: '#a9c3d0',
  draggableDroppedColor: '#1a4473',
  draggableCorrectBackground: '#9dd8bb',
  draggableCorrectBorder: '#9dd8bb',
  draggableCorrectColor: '#255c41',
  draggableWrongBackground: '#f7d0d0',
  draggableWrongBorder: '#f7d0d0',
  draggableWrongColor: '#b71c1c',
  draggableBorderWidth: '0',
  draggableBorderStyle: 'none',
  draggableBordersEnabled: '0'
};

const CSS_VAR_KEYS = {
  canvasBackground: '--dq-canvas-bg',
  dropZoneBackground: '--dq-dropzone-bg',
  dropZoneBorder: '--dq-dropzone-border',
  dropZoneHoverBackground: '--dq-dropzone-hover-bg',
  dropZoneHoverBorder: '--dq-dropzone-hover-border',
  dropZoneLabelColor: '--dq-dropzone-label-color',
  zoneIconColor: '--dq-zone-icon-color',
  draggableBackground: '--dq-draggable-bg',
  draggableBorder: '--dq-draggable-border',
  draggableColor: '--dq-draggable-color',
  draggableHoverBackground: '--dq-draggable-hover-bg',
  draggableHoverBorder: '--dq-draggable-hover-border',
  draggableHoverColor: '--dq-draggable-hover-color',
  draggableDroppedBackground: '--dq-draggable-dropped-bg',
  draggableDroppedBorder: '--dq-draggable-dropped-border',
  draggableDroppedColor: '--dq-draggable-dropped-color',
  draggableCorrectBackground: '--dq-draggable-correct-bg',
  draggableCorrectBorder: '--dq-draggable-correct-border',
  draggableCorrectColor: '--dq-draggable-correct-color',
  draggableWrongBackground: '--dq-draggable-wrong-bg',
  draggableWrongBorder: '--dq-draggable-wrong-border',
  draggableWrongColor: '--dq-draggable-wrong-color',
  draggableBorderWidth: '--dq-draggable-border-width',
  draggableBorderStyle: '--dq-draggable-border-style',
  draggableBordersEnabled: '--dq-draggable-borders-enabled'
};

/**
 * @param {Object} [appearance]
 * @returns {Object}
 */
export function mergeAppearance(appearance) {
  var merged = {};
  var key;

  for (key in APPEARANCE_DEFAULTS) {
    if (Object.prototype.hasOwnProperty.call(APPEARANCE_DEFAULTS, key)) {
      merged[key] = APPEARANCE_DEFAULTS[key];
    }
  }

  if (!appearance) {
    return merged;
  }

  var flat = flattenAppearance(appearance);

  for (key in APPEARANCE_DEFAULTS) {
    if (Object.prototype.hasOwnProperty.call(APPEARANCE_DEFAULTS, key) &&
        flat[key] !== undefined &&
        flat[key] !== null &&
        flat[key] !== '') {
      merged[key] = flat[key];
    }
  }

  return merged;
}

/**
 * @param {Object} [settings] question.settings
 * @returns {Object}
 */
export function getAppearanceFromSettings(settings) {
  return mergeAppearance(settings && settings.appearance);
}

/**
 * @param {jQuery} $container
 * @param {Object} [appearance]
 * @returns {Object}
 */
export function applyAppearanceVars($container, appearance) {
  var merged = mergeAppearance(appearance);
  var key;
  var i;
  var el;

  if (!$container || !$container.length) {
    return merged;
  }

  for (i = 0; i < $container.length; i++) {
    el = $container[i];

    if (!el || !el.style) {
      continue;
    }

    for (key in CSS_VAR_KEYS) {
      if (Object.prototype.hasOwnProperty.call(CSS_VAR_KEYS, key)) {
        el.style.setProperty(CSS_VAR_KEYS[key], merged[key]);
      }
    }
  }

  return merged;
}

/**
 * Apply canvas background on the question wrapper (.h5p-dragquestion).
 * Variables set on .h5p-inner do not propagate to the parent element.
 *
 * @param {jQuery} $root
 * @param {Object} [appearance]
 * @returns {Object}
 */
export function applyCanvasAppearance($root, appearance) {
  var merged = mergeAppearance(appearance);
  var i;
  var el;

  if (!$root || !$root.length) {
    return merged;
  }

  for (i = 0; i < $root.length; i++) {
    el = $root[i];

    if (!el || !el.style) {
      continue;
    }

    el.style.setProperty('--dq-canvas-bg', merged.canvasBackground);
    el.style.backgroundColor = merged.canvasBackground;
  }

  return merged;
}

/**
 * Defer canvas appearance until .h5p-dragquestion exists in the DOM.
 *
 * @param {jQuery} $inner .h5p-inner
 * @param {Object} [appearance]
 */
export function scheduleCanvasAppearance($inner, appearance) {
  var applyToRoot = function () {
    var $root;

    if (!$inner || !$inner.length) {
      return;
    }

    $root = $inner.closest('.h5p-dragquestion');

    if (!$root.length) {
      return;
    }

    applyCanvasAppearance($root, appearance);
  };

  setTimeout(applyToRoot, 0);
  setTimeout(applyToRoot, 50);
}

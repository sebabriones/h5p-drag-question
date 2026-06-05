/**
 * Read zoneIcon from labelWithIcon (supports fontawesomeIcon subgroup and legacy paths).
 *
 * @param {Object} withIcon
 * @param {Object} [visual]
 * @returns {string|undefined}
 */
function getZoneIconFromLabelWithIcon(withIcon, visual) {
  var faGroup;
  var zoneIcon;

  if (!withIcon) {
    return visual && visual.zoneIcon;
  }

  faGroup = withIcon.fontawesomeIcon;

  if (typeof faGroup === 'string') {
    zoneIcon = faGroup.trim();
  }
  else if (faGroup && faGroup.zoneIcon !== undefined) {
    zoneIcon = faGroup.zoneIcon;
  }

  if (zoneIcon === undefined && withIcon.zoneIcon !== undefined) {
    zoneIcon = withIcon.zoneIcon;
  }

  return zoneIcon;
}

/**
 * Flatten label visual params (nested groups and legacy flat fields).
 *
 * @param {Object} dropZone
 * @returns {Object}
 */
export function getLabelVisualFromDropZone(dropZone) {
  var visual = dropZone && dropZone.labelVisual;
  var withIcon;
  var result;

  if (!visual) {
    var legacyIconSource = dropZone && dropZone.iconSource;
    var legacyZoneImage = dropZone && dropZone.zoneImage;
    var legacyZoneIcon = dropZone && dropZone.zoneIcon;

    return {
      labelDisplayMode: dropZone && dropZone.labelDisplayMode,
      labelPosition: dropZone && dropZone.labelPosition,
      iconSource: resolveIconSource(legacyIconSource, legacyZoneImage, legacyZoneIcon),
      zoneImage: legacyZoneImage,
      zoneIcon: legacyZoneIcon,
      visualScale: 100
    };
  }

  withIcon = visual.labelWithIcon;
  result = {
    labelDisplayMode: visual.labelDisplayMode,
    labelPosition: visual.labelPosition,
    iconSource: withIcon && withIcon.iconSource,
    zoneImage: withIcon && withIcon.zoneImage,
    zoneIcon: getZoneIconFromLabelWithIcon(withIcon, visual),
    visualScale: withIcon && withIcon.visualScale
  };

  if (result.iconSource === undefined && visual.iconSource !== undefined) {
    result.iconSource = visual.iconSource;
  }

  if (result.zoneImage === undefined && visual.zoneImage !== undefined) {
    result.zoneImage = visual.zoneImage;
  }

  result.iconSource = resolveIconSource(result.iconSource, result.zoneImage, result.zoneIcon);

  return result;
}

/**
 * @param {string} [mode]
 * @returns {string}
 */
export function normalizeLabelDisplayMode(mode) {
  if (mode === 'label-with-icon' || mode === 'icon-only') {
    return mode;
  }

  return 'label-only';
}

/**
 * @param {string} [mode]
 * @returns {boolean}
 */
export function usesLabelVisualStack(mode) {
  return mode === 'label-with-icon' || mode === 'icon-only';
}

/**
 * @param {string} [iconSource]
 * @param {Object} [zoneImage]
 * @param {string} [zoneIcon]
 * @returns {string}
 */
export function resolveIconSource(iconSource, zoneImage, zoneIcon) {
  var hasIcon = zoneIcon && String(zoneIcon).trim() !== '';
  var hasImage = zoneImage && zoneImage.path;

  if (iconSource === 'fontawesome') {
    return 'fontawesome';
  }

  if (hasIcon && !hasImage) {
    return 'fontawesome';
  }

  return 'image';
}

/**
 * @param {string} [source]
 * @returns {string}
 */
export function normalizeIconSource(source) {
  return source === 'fontawesome' ? 'fontawesome' : 'image';
}

/**
 * @param {string} [zoneIcon] e.g. fa-building
 * @returns {string} class attribute value for Font Awesome
 */
export function getFaIconClassAttr(zoneIcon) {
  var icon;

  if (!zoneIcon || !zoneIcon.trim) {
    return '';
  }

  icon = zoneIcon.trim();

  if (icon.indexOf('fa ') === 0) {
    return icon;
  }

  if (icon.indexOf('fa-') === 0) {
    return 'fa ' + icon;
  }

  return 'fa fa-' + icon;
}

/**
 * @param {number|string} [scale] percent (50–150)
 * @returns {number}
 */
export function normalizeVisualScale(scale) {
  var value = parseInt(scale, 10);

  if (isNaN(value)) {
    return 100;
  }

  if (value < 50) {
    return 50;
  }

  if (value > 150) {
    return 150;
  }

  return value;
}

/**
 * Inline style for visual stack CSS variable --dq-visual-scale (factor 0.5–1.5).
 *
 * @param {number|string} [visualScale]
 * @returns {string}
 */
export function getVisualStackScaleStyle(visualScale) {
  var factor = normalizeVisualScale(visualScale) / 100;

  return ' style="--dq-visual-scale: ' + factor + '"';
}

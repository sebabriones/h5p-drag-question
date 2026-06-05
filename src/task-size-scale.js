export const TASK_SIZE_BASE_WIDTH = 620;
export const TASK_SIZE_BASE_HEIGHT = 310;
export const TASK_SIZE_SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2];
export const TASK_SIZE_SCALE_DEFAULT = 1;

/**
 * Snap a scale value to the nearest allowed step (1.0–2.0).
 *
 * @param {number|string} value
 * @returns {number}
 */
export function normalizeTaskSizeScale(value) {
  var scale = parseFloat(value);

  if (isNaN(scale)) {
    return TASK_SIZE_SCALE_DEFAULT;
  }

  var closest = TASK_SIZE_SCALE_STEPS[0];
  var minDiff = Math.abs(scale - closest);

  for (var i = 1; i < TASK_SIZE_SCALE_STEPS.length; i++) {
    var diff = Math.abs(scale - TASK_SIZE_SCALE_STEPS[i]);

    if (diff < minDiff) {
      minDiff = diff;
      closest = TASK_SIZE_SCALE_STEPS[i];
    }
  }

  return closest;
}

/**
 * Derive scale from stored width (legacy content without taskSizeScale).
 *
 * @param {number} width
 * @returns {number}
 */
export function deriveTaskSizeScaleFromWidth(width) {
  if (!width || width <= 0) {
    return TASK_SIZE_SCALE_DEFAULT;
  }

  return normalizeTaskSizeScale(width / TASK_SIZE_BASE_WIDTH);
}

/**
 * Apply taskSizeScale to settings.size (width/height in px, ratio 2:1).
 *
 * @param {Object} settings question.settings
 */
/**
 * @param {Object} settings question.settings
 * @returns {boolean}
 */
export function usesScaledTaskSize(settings) {
  return settings && settings.useScaledTaskSize !== false;
}

export function applyTaskSizeScaleToSettings(settings) {
  if (!settings) {
    return;
  }

  if (!settings.size) {
    settings.size = {
      width: TASK_SIZE_BASE_WIDTH,
      height: TASK_SIZE_BASE_HEIGHT
    };
  }

  if (!usesScaledTaskSize(settings)) {
    if (!settings.size.width) {
      settings.size.width = TASK_SIZE_BASE_WIDTH;
    }
    if (!settings.size.height) {
      settings.size.height = TASK_SIZE_BASE_HEIGHT;
    }
    return;
  }

  var scale;

  if (settings.taskSizeScale !== undefined && settings.taskSizeScale !== null && settings.taskSizeScale !== '') {
    scale = normalizeTaskSizeScale(settings.taskSizeScale);
  }
  else {
    scale = deriveTaskSizeScaleFromWidth(settings.size.width);
  }

  settings.taskSizeScale = scale;
  settings.size.width = Math.round(TASK_SIZE_BASE_WIDTH * scale);
  settings.size.height = Math.round(TASK_SIZE_BASE_HEIGHT * scale);
}

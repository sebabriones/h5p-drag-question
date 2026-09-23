var H5PEditor = H5PEditor || {};
var H5PPresave = H5PPresave || {};

var TASK_SIZE_BASE_WIDTH = 620;
var TASK_SIZE_BASE_HEIGHT = 310;
var TASK_SIZE_SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2];

/**
 * @param {number|string} value
 * @returns {number}
 */
function normalizeTaskSizeScale(value) {
  var scale = parseFloat(value);
  var closest;
  var minDiff;
  var i;
  var diff;

  if (isNaN(scale)) {
    return 1;
  }

  closest = TASK_SIZE_SCALE_STEPS[0];
  minDiff = Math.abs(scale - closest);

  for (i = 1; i < TASK_SIZE_SCALE_STEPS.length; i++) {
    diff = Math.abs(scale - TASK_SIZE_SCALE_STEPS[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = TASK_SIZE_SCALE_STEPS[i];
    }
  }

  return closest;
}

/**
 * @param {Object} settings
 */
function applyTaskSizeScaleToSettings(settings) {
  var scale;

  if (!settings) {
    return;
  }

  if (!settings.size) {
    settings.size = {
      width: TASK_SIZE_BASE_WIDTH,
      height: TASK_SIZE_BASE_HEIGHT
    };
  }

  if (settings.useScaledTaskSize === false) {
    if (!settings.size.width) {
      settings.size.width = TASK_SIZE_BASE_WIDTH;
    }
    if (!settings.size.height) {
      settings.size.height = TASK_SIZE_BASE_HEIGHT;
    }
    return;
  }

  if (settings.useScaledTaskSize === undefined) {
    settings.useScaledTaskSize = true;
  }

  if (settings.taskSizeScale !== undefined && settings.taskSizeScale !== null && settings.taskSizeScale !== '') {
    scale = normalizeTaskSizeScale(settings.taskSizeScale);
  }
  else if (settings.size.width) {
    scale = normalizeTaskSizeScale(settings.size.width / TASK_SIZE_BASE_WIDTH);
  }
  else {
    scale = 1;
  }

  settings.taskSizeScale = String(scale);
  settings.size.width = Math.round(TASK_SIZE_BASE_WIDTH * scale);
  settings.size.height = Math.round(TASK_SIZE_BASE_HEIGHT * scale);
}

/**
 * Ensure task group exists for draft saves and preview (Lumi).
 *
 * @param {Object} content
 */
function ensureQuestionTask(content) {
  if (!content.question) {
    content.question = {};
  }

  if (!content.question.task) {
    content.question.task = {
      elements: [],
      dropZones: []
    };
  }

  if (!Array.isArray(content.question.task.elements)) {
    content.question.task.elements = [];
  }

  if (!Array.isArray(content.question.task.dropZones)) {
    content.question.task.dropZones = [];
  }
}

/**
 * Mirror top-level instructions into question.settings for preview/runtime
 * compatibility. Keep the top-level field as the author-facing source of truth.
 *
 * @param {Object} content
 */
function syncInstructions(content) {
  var rootInstructions;
  var nestedInstructions;

  if (!content || !content.question) {
    return;
  }

  if (!content.question.settings) {
    content.question.settings = {};
  }

  rootInstructions = content.instructions;
  nestedInstructions = content.question.settings.instructions;

  if (rootInstructions && typeof rootInstructions === 'object') {
    content.question.settings.instructions = H5P.jQuery.extend(true, {}, nestedInstructions || {}, rootInstructions);
  }
  else if (nestedInstructions && typeof nestedInstructions === 'object' && !content.instructions) {
    content.instructions = H5P.jQuery.extend(true, {}, nestedInstructions);
  }
}

/**
 * Migrate legacy parameters that upgrades.js could not process (patch-level
 * migrations under 1.0.x are ignored by the H5P core upgrade runner which
 * only iterates major/minor).  Every step is idempotent: if the data already
 * has the new structure the step is a no-op.
 *
 * @param {Object} content – full content parameters
 */
function migrateLegacyParameters(content) {
  var settings;
  var appearance;
  var dropZones;
  var i, key;

  if (!content || !content.question) {
    return;
  }

  settings = content.question.settings;
  if (!settings) {
    content.question.settings = {};
    settings = content.question.settings;
  }

  /* ── Patch 7: create appearance with default colours ── */
  if (!settings.appearance) {
    settings.appearance = {
      canvasBackground: '#ffffff',
      dropZoneBackground: '#f5f5f5',
      dropZoneBorder: '#666666',
      dropZoneHoverBackground: '#edd6e9',
      draggableBackground: '#dddddd',
      draggableBorder: '#c6c6c6',
      draggableHoverBackground: '#edd6e9',
      draggableHoverBorder: '#d4bed8',
      draggableDroppedBackground: '#cee0f4',
      draggableDroppedBorder: '#a9c3d0',
      draggableDroppedColor: '#1a4473',
      draggableCorrectBackground: '#9dd8bb',
      draggableCorrectBorder: '#9dd8bb',
      draggableCorrectColor: '#255c41',
      draggableWrongBackground: '#f7d0d0',
      draggableWrongBorder: '#f7d0d0',
      draggableWrongColor: '#b71c1c',
      dropZoneHoverBorder: '#666666',
      dropZoneLabelColor: '#333333',
      zoneIconColor: '#333333',
      draggableColor: '#333333',
      draggableHoverColor: '#663366'
    };
  }

  appearance = settings.appearance;

  /* ── Patch 16: ensure missing colour defaults ── */
  var colourDefaults = {
    dropZoneHoverBorder: '#666666',
    dropZoneLabelColor: '#333333',
    zoneIconColor: '#333333',
    draggableColor: '#333333',
    draggableHoverColor: '#663366'
  };
  for (key in colourDefaults) {
    if (Object.prototype.hasOwnProperty.call(colourDefaults, key) &&
        (appearance[key] === undefined || appearance[key] === null || appearance[key] === '')) {
      appearance[key] = colourDefaults[key];
    }
  }

  /* ── Patches 8-15: dropZone labelVisual chain ── */
  dropZones = content.question && content.question.task && content.question.task.dropZones;
  if (Array.isArray(dropZones)) {
    for (i = 0; i < dropZones.length; i++) {
      var dz = dropZones[i];

      /* 8: labelPosition default */
      if (!dz.labelPosition && !(dz.labelVisual && dz.labelVisual.labelPosition)) {
        dz.labelPosition = 'outside-top';
      }

      /* 9: labelDisplayMode default */
      if (!dz.labelDisplayMode && !(dz.labelVisual && dz.labelVisual.labelDisplayMode)) {
        dz.labelDisplayMode = 'label-only';
      }

      /* 10: group into labelVisual */
      if (!dz.labelVisual) {
        dz.labelVisual = {
          labelDisplayMode: dz.labelDisplayMode || 'label-only',
          labelPosition: dz.labelPosition || 'outside-top',
          iconSource: dz.iconSource || 'image',
          zoneImage: dz.zoneImage,
          zoneIcon: dz.zoneIcon
        };
        delete dz.iconSource;
        delete dz.zoneIcon;
        delete dz.labelDisplayMode;
        delete dz.labelPosition;
        delete dz.zoneImage;
      }

      var visual = dz.labelVisual;

      /* 11: iconSource default for icon modes */
      if (visual && (visual.labelDisplayMode === 'label-with-icon' || visual.labelDisplayMode === 'icon-only') && !visual.iconSource) {
        visual.iconSource = 'image';
      }

      /* 12: nest icon fields into labelWithIcon */
      if (visual && !visual.labelWithIcon && (visual.iconSource || visual.zoneImage || visual.zoneIcon)) {
        visual.labelWithIcon = {
          iconSource: visual.iconSource || 'image',
          zoneImage: visual.zoneImage
        };
        if (visual.zoneIcon) {
          visual.labelWithIcon.fontawesomeIcon = { zoneIcon: visual.zoneIcon };
        }
        delete visual.iconSource;
        delete visual.zoneImage;
        delete visual.zoneIcon;
      }

      /* 13: zoneIcon string → fontawesomeIcon group */
      if (visual && visual.labelWithIcon) {
        var withIcon = visual.labelWithIcon;
        if (withIcon.zoneIcon !== undefined && !withIcon.fontawesomeIcon) {
          withIcon.fontawesomeIcon = { zoneIcon: withIcon.zoneIcon };
          delete withIcon.zoneIcon;
        }

        /* 14: fontawesomeIcon bare string → object */
        if (typeof withIcon.fontawesomeIcon === 'string' && withIcon.fontawesomeIcon.trim()) {
          withIcon.fontawesomeIcon = { zoneIcon: withIcon.fontawesomeIcon.trim() };
        }

        /* 15: visualScale default */
        if (withIcon.visualScale === undefined || withIcon.visualScale === null || withIcon.visualScale === '') {
          withIcon.visualScale = 100;
        }
      }
    }
  }

  /* ── Patch 17: *BackgroundFill gradient objects ── */
  var fillDefaults = {
    draggableBackgroundFill:        { useGradient: false, gradientColors: { colorStart: '#dddddd', colorEnd: '#bbbbbb', angle: 180 } },
    draggableHoverBackgroundFill:   { useGradient: false, gradientColors: { colorStart: '#edd6e9', colorEnd: '#d4bed8', angle: 180 } },
    draggableDroppedBackgroundFill:  { useGradient: false, gradientColors: { colorStart: '#cee0f4', colorEnd: '#a9c3d0', angle: 180 } },
    draggableCorrectBackgroundFill: { useGradient: false, gradientColors: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8', angle: 180 } },
    draggableWrongBackgroundFill:   { useGradient: false, gradientColors: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8', angle: 180 } }
  };
  for (key in fillDefaults) {
    if (Object.prototype.hasOwnProperty.call(fillDefaults, key) && !appearance[key]) {
      appearance[key] = fillDefaults[key];
    }
  }
  for (key in fillDefaults) {
    if (!Object.prototype.hasOwnProperty.call(fillDefaults, key)) { continue; }
    if (appearance[key] && !appearance[key].gradientColors) {
      appearance[key].gradientColors = fillDefaults[key].gradientColors;
    }
    if (appearance[key] && appearance[key].useGradient === undefined) {
      appearance[key].useGradient = false;
    }
  }

  /* ── Patch 18: restructure into dropZoneColors + draggableColors ── */
  if (!(appearance.dropZoneColors && appearance.draggableColors)) {
    var dropZoneKeys = ['dropZoneBackground', 'dropZoneBorder', 'dropZoneHoverBackground', 'dropZoneHoverBorder', 'dropZoneLabelColor', 'zoneIconColor'];
    var draggableBgKeys = ['draggableBackground', 'draggableHoverBackground', 'draggableDroppedBackground', 'draggableCorrectBackground', 'draggableWrongBackground'];
    var draggableOtherKeys = ['draggableBorder', 'draggableColor', 'draggableHoverBorder', 'draggableHoverColor', 'draggableDroppedBorder', 'draggableDroppedColor', 'draggableCorrectBorder', 'draggableCorrectColor', 'draggableWrongBorder', 'draggableWrongColor'];
    var gradientStates = [
      { stateKey: 'normal',   solidKey: 'draggableBackground',        legacyFillKey: 'draggableBackgroundFill',        defaults: { colorStart: '#dddddd', colorEnd: '#bbbbbb' } },
      { stateKey: 'hover',    solidKey: 'draggableHoverBackground',   legacyFillKey: 'draggableHoverBackgroundFill',   defaults: { colorStart: '#edd6e9', colorEnd: '#d4bed8' } },
      { stateKey: 'dropped',  solidKey: 'draggableDroppedBackground', legacyFillKey: 'draggableDroppedBackgroundFill', defaults: { colorStart: '#cee0f4', colorEnd: '#a9c3d0' } },
      { stateKey: 'correct',  solidKey: 'draggableCorrectBackground', legacyFillKey: 'draggableCorrectBackgroundFill', defaults: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8' } },
      { stateKey: 'wrong',    solidKey: 'draggableWrongBackground',   legacyFillKey: 'draggableWrongBackgroundFill',   defaults: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8' } }
    ];
    var legacyFillKeys = ['draggableBackgroundFill', 'draggableHoverBackgroundFill', 'draggableDroppedBackgroundFill', 'draggableCorrectBackgroundFill', 'draggableWrongBackgroundFill'];

    var useGradient = false;
    var angle = 180;
    var dzColors = {};
    var solidBg = {};
    var spec, fill, gc;

    for (i = 0; i < gradientStates.length; i++) {
      spec = gradientStates[i];
      fill = appearance[spec.legacyFillKey];
      if (fill && fill.useGradient === true) {
        useGradient = true;
        if (fill.gradientColors && fill.gradientColors.angle !== undefined && fill.gradientColors.angle !== null && fill.gradientColors.angle !== '') {
          angle = parseInt(fill.gradientColors.angle, 10);
          if (isNaN(angle)) { angle = 180; }
        }
      }
    }

    for (i = 0; i < dropZoneKeys.length; i++) {
      if (appearance[dropZoneKeys[i]] !== undefined) {
        dzColors[dropZoneKeys[i]] = appearance[dropZoneKeys[i]];
      }
    }

    var dragColors = {
      useGradientBackground: useGradient,
      solidBackgrounds: {},
      gradientBackgrounds: {
        gradientAngle: angle,
        normal:  { colorStart: '#dddddd', colorEnd: '#bbbbbb' },
        hover:   { colorStart: '#edd6e9', colorEnd: '#d4bed8' },
        dropped: { colorStart: '#cee0f4', colorEnd: '#a9c3d0' },
        correct: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8' },
        wrong:   { colorStart: '#f7d0d0', colorEnd: '#e8a8a8' }
      }
    };

    for (i = 0; i < draggableBgKeys.length; i++) {
      if (appearance[draggableBgKeys[i]] !== undefined) {
        solidBg[draggableBgKeys[i]] = appearance[draggableBgKeys[i]];
      }
    }

    for (i = 0; i < gradientStates.length; i++) {
      spec = gradientStates[i];
      fill = appearance[spec.legacyFillKey];
      gc = (fill && fill.gradientColors) ? fill.gradientColors : spec.defaults;
      dragColors.gradientBackgrounds[spec.stateKey] = {
        colorStart: gc.colorStart || spec.defaults.colorStart,
        colorEnd:   gc.colorEnd   || spec.defaults.colorEnd
      };
      if (!solidBg[spec.solidKey] && appearance[spec.solidKey]) {
        solidBg[spec.solidKey] = appearance[spec.solidKey];
      }
    }

    dragColors.solidBackgrounds = solidBg;

    for (i = 0; i < draggableOtherKeys.length; i++) {
      if (appearance[draggableOtherKeys[i]] !== undefined) {
        dragColors[draggableOtherKeys[i]] = appearance[draggableOtherKeys[i]];
      }
    }

    appearance.dropZoneColors = dzColors;
    appearance.draggableColors = dragColors;

    for (i = 0; i < dropZoneKeys.length; i++)      { delete appearance[dropZoneKeys[i]]; }
    for (i = 0; i < draggableBgKeys.length; i++)    { delete appearance[draggableBgKeys[i]]; }
    for (i = 0; i < draggableOtherKeys.length; i++) { delete appearance[draggableOtherKeys[i]]; }
    for (i = 0; i < legacyFillKeys.length; i++)     { delete appearance[legacyFillKeys[i]]; }
  }

  /* ── Patch 19: dropZoneColors.borderSettings ── */
  if (appearance.dropZoneColors) {
    var dzc = appearance.dropZoneColors;
    if (dzc.useDropZoneBorder === undefined) { dzc.useDropZoneBorder = true; }
    if (!dzc.borderSettings) { dzc.borderSettings = {}; }
    var bs = dzc.borderSettings;
    if (bs.borderWidth === undefined || bs.borderWidth === null || bs.borderWidth === '') { bs.borderWidth = 0.1; }
    if (!bs.normal) { bs.normal = {}; }
    if (!bs.hover)  { bs.hover  = {}; }
    if (bs.normal.borderStyle === undefined || bs.normal.borderStyle === null || bs.normal.borderStyle === '') { bs.normal.borderStyle = 'solid'; }
    if (bs.hover.borderStyle  === undefined || bs.hover.borderStyle  === null || bs.hover.borderStyle  === '') { bs.hover.borderStyle  = 'solid'; }
    if ((bs.normal.borderColor === undefined || bs.normal.borderColor === null || bs.normal.borderColor === '') && dzc.dropZoneBorder) {
      bs.normal.borderColor = dzc.dropZoneBorder;
    }
    if (!bs.normal.borderColor) { bs.normal.borderColor = '#666666'; }
    if ((bs.hover.borderColor === undefined || bs.hover.borderColor === null || bs.hover.borderColor === '') && dzc.dropZoneHoverBorder) {
      bs.hover.borderColor = dzc.dropZoneHoverBorder;
    }
    if (!bs.hover.borderColor) { bs.hover.borderColor = '#666666'; }
    delete dzc.dropZoneBorder;
    delete dzc.dropZoneHoverBorder;
  }

  /* ── Patch 20: borderRadius from sub-groups to appearance root ── */
  if (appearance.dropZoneColors || appearance.draggableColors) {
    var dzc2 = appearance.dropZoneColors || {};
    var dc2  = appearance.draggableColors || {};
    if ((appearance.dropZoneBorderRadius === undefined || appearance.dropZoneBorderRadius === null || appearance.dropZoneBorderRadius === '') && dzc2.borderRadius !== undefined && dzc2.borderRadius !== null && dzc2.borderRadius !== '') {
      appearance.dropZoneBorderRadius = dzc2.borderRadius;
    }
    if ((appearance.draggableBorderRadius === undefined || appearance.draggableBorderRadius === null || appearance.draggableBorderRadius === '') && dc2.borderRadius !== undefined && dc2.borderRadius !== null && dc2.borderRadius !== '') {
      appearance.draggableBorderRadius = dc2.borderRadius;
    }
    delete dzc2.borderRadius;
    delete dc2.borderRadius;
  }

  /* ── Patches 53-56: overallFeedback structure ── */
  var of = content.overallFeedback;

  /* 53: array → object with popup colour */
  if (Array.isArray(of)) {
    var normalizeRange53 = function (range) {
      range = range || {};
      if (range.feedbackLeadBold === undefined) { range.feedbackLeadBold = true; }
      if (!range.feedbackTextColor) { range.feedbackTextColor = '#1a73d9'; }
      if (!range.feedbackTextAlign) { range.feedbackTextAlign = 'left'; }
      if (!range.feedbackImagePosition) { range.feedbackImagePosition = 'left'; }
      if (!range.scorebarAlign) { range.scorebarAlign = 'left'; }
      return range;
    };
    content.overallFeedback = {
      popupBackgroundColor: '#ffffff',
      overallFeedback: of.map(normalizeRange53)
    };
    of = content.overallFeedback;
  }
  else if (of && typeof of === 'object') {
    if (!of.popupBackgroundColor) { of.popupBackgroundColor = '#ffffff'; }
    if (Array.isArray(of.overallFeedback)) {
      for (i = 0; i < of.overallFeedback.length; i++) {
        var r53 = of.overallFeedback[i] || {};
        if (r53.feedbackLeadBold === undefined) { r53.feedbackLeadBold = true; }
        if (!r53.feedbackTextColor) { r53.feedbackTextColor = '#1a73d9'; }
        if (!r53.feedbackTextAlign) { r53.feedbackTextAlign = 'left'; }
        if (!r53.feedbackImagePosition) { r53.feedbackImagePosition = 'left'; }
        if (!r53.scorebarAlign) { r53.scorebarAlign = 'left'; }
      }
    }
  }
  else {
    content.overallFeedback = { popupBackgroundColor: '#ffffff', overallFeedback: [] };
    of = content.overallFeedback;
  }

  /* 54: move appearance keys from range root into range.appearance */
  var appearanceRangeKeys = ['feedbackLeadText', 'feedbackLeadBold', 'feedbackTextColor', 'feedbackTextAlign', 'feedbackImage', 'feedbackImagePosition', 'scorebarAlign'];
  var normalizeRangeAppearance = function (range) {
    range = range || {};
    if (!range.appearance) { range.appearance = {}; }
    var ra = range.appearance;
    for (var ai = 0; ai < appearanceRangeKeys.length; ai++) {
      var ak = appearanceRangeKeys[ai];
      if (range[ak] !== undefined) { ra[ak] = range[ak]; delete range[ak]; }
    }
    if (ra.feedbackLeadBold === undefined) { ra.feedbackLeadBold = true; }
    if (!ra.feedbackTextColor) { ra.feedbackTextColor = '#1a73d9'; }
    if (!ra.feedbackTextAlign) { ra.feedbackTextAlign = 'left'; }
    if (!ra.feedbackImagePosition) { ra.feedbackImagePosition = 'left'; }
    if (!ra.scorebarAlign) { ra.scorebarAlign = 'left'; }
    return range;
  };
  if (of && Array.isArray(of.overallFeedback)) {
    for (i = 0; i < of.overallFeedback.length; i++) {
      of.overallFeedback[i] = normalizeRangeAppearance(of.overallFeedback[i]);
    }
  }

  /* 55: feedbackTextColor → feedbackLeadTextColor */
  var migrateRange55 = function (range) {
    range = range || {};
    if (!range.appearance) { range.appearance = {}; }
    var a55 = range.appearance;
    if (!a55.feedbackLeadTextColor) {
      a55.feedbackLeadTextColor = a55.feedbackTextColor || range.feedbackTextColor || '#1a73d9';
    }
    delete a55.feedbackTextColor;
    delete range.feedbackTextColor;
    if (!a55.feedbackLeadTextColor) { a55.feedbackLeadTextColor = '#1a73d9'; }
    return range;
  };
  if (of && Array.isArray(of.overallFeedback)) {
    for (i = 0; i < of.overallFeedback.length; i++) {
      of.overallFeedback[i] = migrateRange55(of.overallFeedback[i]);
    }
    if (!of.feedbackTextColor) { of.feedbackTextColor = '#333333'; }
  }

  /* 56: remove residual scorebarAlign */
  var cleanupRange56 = function (range) {
    range = range || {};
    delete range.scorebarAlign;
    if (range.appearance) { delete range.appearance.scorebarAlign; }
    return range;
  };
  if (of && Array.isArray(of.overallFeedback)) {
    for (i = 0; i < of.overallFeedback.length; i++) {
      of.overallFeedback[i] = cleanupRange56(of.overallFeedback[i]);
    }
  }
}

/**
 * Resolve the presave logic for the content type Drag Question
 *
 * @param {object} content
 * @param finished
 * @constructor
 */
H5PPresave['H5P.DragQuestionCFRD'] = function (content, finished) {
  var presave = H5PEditor.Presave;
  var score = 0;
  var correctDropZones = [];

  ensureQuestionTask(content);
  syncInstructions(content);
  migrateLegacyParameters(content);

  if (content.question && content.question.settings) {
    applyTaskSizeScaleToSettings(content.question.settings);
  }

  if (isContentInvalid()) {
    throw new presave.exceptions.InvalidContentSemanticsException('Invalid Drag and Drop Error');
  }

  if (hasDropZones()) {
    correctDropZones = content.question.task.dropZones
      .map(function (dropzone) {
        return dropzone.correctElements;
      })
      .filter(function (correctElements) {
        return correctElements.length;
      })
      .reduce(function (previous, current, dropZone) {
        current.forEach(function (element) {
          if (!Array.isArray(previous[element])) {
            previous[element] = [];
          }
          previous[element].push(dropZone);
        });
        return previous;
      }, []);
  }


  if (correctDropZones.length === 0 || isSinglePoint()) {
    score = 1;
  }
  else if (hasElements()) {
    score = content.question.task.elements
      .filter(function (element, index) {
        return Array.isArray(correctDropZones[index]) && correctDropZones.length > 0;
      })
      .map(function (element) {
        if (element.multiple === true) {
          return correctDropZones.length;
        }
        return 1;
      })
      .reduce(function (previous, current) {
        return previous + current;
      }, 0);
  }

  presave.validateScore(score);

  finished({maxScore: score});

  /**
   * Check if required parameters is present
   * @return {boolean}
   */
  function isContentInvalid() {
    return !presave.checkNestedRequirements(content, 'content.question.task');
  }

  /**
   * Check if tasks has drop zones
   * @return {boolean}
   */
  function hasDropZones() {
    return presave.checkNestedRequirements(content, 'content.question.task.dropZones') && Array.isArray(content.question.task.dropZones);
  }

  /**
   * Check if tasks has elements
   * @return {boolean}
   */
  function hasElements() {
    return presave.checkNestedRequirements(content, 'content.question.task.elements') && Array.isArray(content.question.task.elements);
  }

  /**
   * Check if task should give 1 point as score
   * @return {boolean}
   */
  function isSinglePoint() {
    return presave.checkNestedRequirements(content, 'content.behaviour.singlePoint') && content.behaviour.singlePoint === true;
  }
};

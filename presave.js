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

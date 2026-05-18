/* global H5P, H5PEditor */
(function ($) {
  'use strict';

  if (typeof H5PEditor === 'undefined') {
    return;
  }

  var BASE_WIDTH = 620;
  var BASE_HEIGHT = 310;
  var SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2];

  /**
   * @param {number|string} value
   * @returns {number}
   */
  function normalizeScale(value) {
    var scale = parseFloat(value);
    var closest;
    var minDiff;
    var i;
    var diff;

    if (isNaN(scale)) {
      return 1;
    }

    closest = SCALE_STEPS[0];
    minDiff = Math.abs(scale - closest);

    for (i = 1; i < SCALE_STEPS.length; i++) {
      diff = Math.abs(scale - SCALE_STEPS[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closest = SCALE_STEPS[i];
      }
    }

    return closest;
  }

  /**
   * @param {number} scale
   * @returns {{width: number, height: number}}
   */
  function getSizeForScale(scale) {
    return {
      width: Math.round(BASE_WIDTH * scale),
      height: Math.round(BASE_HEIGHT * scale)
    };
  }

  /**
   * @param {Object} sizeField H5PEditor dimensions field
   * @param {number} width
   * @param {number} height
   */
  function applySizeToDimensionsField(sizeField, width, height) {
    var value;
    var i;

    if (!sizeField) {
      return;
    }

    value = {
      width: width,
      height: height
    };

    sizeField.params = value;
    sizeField.setValue(sizeField.field, value);

    if (sizeField.$inputs) {
      sizeField.$inputs.filter(':eq(0)').val(width);
      sizeField.$inputs.filter(':eq(1)').val(height);
    }

    if (sizeField.changes) {
      for (i = 0; i < sizeField.changes.length; i++) {
        sizeField.changes[i](width, height);
      }
    }
  }

  /**
   * @param {Object} sizeField
   * @param {boolean} locked
   */
  function setDimensionsLocked(sizeField, locked) {
    if (!sizeField || !sizeField.$inputs) {
      return;
    }

    sizeField.$inputs.prop('disabled', locked);
  }

  /**
   * @param {boolean} value
   * @returns {boolean}
   */
  function isTruthy(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  H5PEditor.widgets.dragQuestionTaskSizeScale = function (parent, field, params, setValue) {
    var self = this;

    this.parent = parent;
    this.field = field;
    this.setValue = setValue;
    this.params = params !== undefined && params !== null ? String(params) : '1';
    this.locked = true;
    this.sizeField = undefined;
  };

  H5PEditor.widgets.dragQuestionTaskSizeScale.prototype.appendTo = function ($wrapper) {
    var self = this;
    var scaleValue;
    var optionsHtml;
    var i;
    var option;

    scaleValue = normalizeScale(this.params);
    this.params = String(scaleValue);

    optionsHtml = '';
    for (i = 0; i < this.field.options.length; i++) {
      option = this.field.options[i];
      optionsHtml += '<option value="' + option.value + '">' + option.label + '</option>';
    }

    this.$item = $('<div>', {
      class: 'field text drag-question-task-size-scale'
    });

    if (this.field.label !== 0) {
      $('<label>', {
        class: 'h5peditor-label-wrapper',
        text: this.field.label,
        for: 'dq-task-size-scale'
      }).appendTo(this.$item);
    }

    this.$select = $('<select>', {
      id: 'dq-task-size-scale',
      html: optionsHtml
    }).val(String(scaleValue));

    this.$select.appendTo(this.$item);
    this.$item.appendTo($wrapper);

    if (this.field.description) {
      $('<div>', {
        class: 'h5peditor-field-description',
        text: this.field.description
      }).appendTo(this.$item);
    }

    this.$select.on('change', function () {
      var scale = normalizeScale(self.$select.val());

      self.$select.val(String(scale));
      self.params = String(scale);
      self.setValue(self.field, self.params);

      if (self.locked) {
        self.applyScale(scale);
      }
    });

    this.parent.ready(function () {
      self.initSizeSync(scaleValue);
    });
  };

  H5PEditor.widgets.dragQuestionTaskSizeScale.prototype.initSizeSync = function (initialScale) {
    var self = this;

    this.sizeField = H5PEditor.findField('size', this.parent);

    if (!this.sizeField) {
      setTimeout(function () {
        self.initSizeSync(initialScale);
      }, 50);
      return;
    }

    if (this.sizeSyncInitialized) {
      return;
    }

    this.sizeSyncInitialized = true;

    H5PEditor.followField(this.parent, 'useScaledTaskSize', function (value) {
      self.setLocked(isTruthy(value));
    });

    this.setLocked(this.parent.params.useScaledTaskSize !== false);

    if (this.locked) {
      this.applyScale(initialScale);
    }
  };

  H5PEditor.widgets.dragQuestionTaskSizeScale.prototype.applyScale = function (scale) {
    var size;

    scale = normalizeScale(scale);
    size = getSizeForScale(scale);
    applySizeToDimensionsField(this.sizeField, size.width, size.height);
  };

  H5PEditor.widgets.dragQuestionTaskSizeScale.prototype.setLocked = function (locked) {
    var scale;

    this.locked = locked;

    if (!this.sizeField) {
      this.sizeField = H5PEditor.findField('size', this.parent);
    }

    setDimensionsLocked(this.sizeField, locked);
    this.updateVisibility(locked);

    if (locked) {
      scale = normalizeScale(this.$select.val());
      this.$select.val(String(scale));
      this.params = String(scale);
      this.setValue(this.field, this.params);
      this.applyScale(scale);
    }
  };

  H5PEditor.widgets.dragQuestionTaskSizeScale.prototype.updateVisibility = function (visible) {
    if (visible) {
      this.$item.show();
    }
    else {
      this.$item.hide();
    }
  };

  H5PEditor.widgets.dragQuestionTaskSizeScale.prototype.remove = function () {
    if (this.$item) {
      this.$item.remove();
    }
  };

})(H5P.jQuery);

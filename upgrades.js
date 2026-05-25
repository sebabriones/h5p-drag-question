var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.DragQuestionCFRD'] = (function () {
  return {
    1: {
      1: {
        contentUpgrade: function (parameters, finished) {
          // Moved all behavioural settings into "behaviour" group.
          parameters.behaviour = {
            enableRetry: parameters.enableTryAgain === undefined ? true : parameters.enableTryAgain,
            preventResize: parameters.preventResize === undefined ? true : parameters.preventResize,
            singlePoint: parameters.singlePoint === undefined ? true : parameters.singlePoint,
            showSolutionsRequiresInput: parameters.showSolutionsRequiresInput === undefined ? true : parameters.showSolutionsRequiresInput
          };
          delete parameters.enableTryAgain;
          delete parameters.preventResize;
          delete parameters.singlePoint;
          delete parameters.showSolutionsRequiresInput;

          finished(null, parameters);
        }
      },

      /**
       * Asynchronous content upgrade hook.
       * Upgrades content parameters to support DQ 1.4.
       *
       * Converts H5P.Text elements into H5P.AdvancedText. This is to support
       * more styling options for text.
       *
       * @params {Object} parameters
       * @params {function} finished
       */
      4: function (parameters, finished) {
        if (parameters.question !== undefined && parameters.question.task !== undefined && parameters.question.task.elements !== undefined) {
          var elements = parameters.question.task.elements;

          // Go through elements
          for (var i = 0; i < elements.length; i++) {
            var element = elements[i];

            // Check if element type is text
            if (element && element.type && element.type.library &&
                element.type.library.split(' ')[0] === 'H5P.Text') {
              element.type.library = 'H5P.AdvancedText 1.0';
            }
          }
        }
        finished(null, parameters);
      },

      /**
       * Asynchronous content upgrade hook.
       * Upgrades content parameters to support Drag Question 1.11
       *
       * 1. Move old feedback message to the new overall feedback system.
       * 2. Group tip with feedback
       * 3. Do not show the new score points for old content being upgraded.
       * 4. Relocate fields in the editor
       *
       * @param {object} parameters
       * @param {function} finished
       */
      11: function (parameters, finished) {

        // Move old feedback message to the new overall feedback system.
        if (parameters && parameters.feedback) {
          parameters.overallFeedback = [
            {
              'from': 0,
              'to': 100,
              'feedback': parameters.feedback
            }
          ];

          delete parameters.feedback;
        }

        // Group tip with feedback
        if (parameters.question !== undefined &&
            parameters.question.task !== undefined &&
            parameters.question.task.dropZones !== undefined ) {

          var dropZones = parameters.question.task.dropZones;
          for (var i = 0; i < dropZones.length; i++) {
            var dropZone = dropZones[i];
            var tip = (dropZone !== undefined && dropZone.tip !== undefined && typeof dropZone.tip === 'string') ? dropZone.tip : '';

            // Create the new group-structure
            delete dropZone.tip;
            dropZone.tipsAndFeedback = {
              tip: tip,
              feedbackOnCorrect: '',
              feedbackOnIncorrect: ''
            };
          }
        }

        // Hide score points for old content
        if (!parameters.behaviour) {
          parameters.behaviour = {};
        }

        // Move fields into behaviour and remove the old values
        parameters.behaviour.backgroundOpacity = parameters.backgroundOpacity;
        delete parameters.backgroundOpacity;
        if (parameters.question !== undefined && parameters.question.settings !== undefined) {
          parameters.behaviour.dropZoneHighlighting = parameters.question.settings.dropZoneHighlighting;
          var legacyAutoAlignSpacing = parameters.question.settings.autoAlignSpacing;
          parameters.behaviour.autoAlignSpacingX = legacyAutoAlignSpacing;
          parameters.behaviour.autoAlignSpacingY = legacyAutoAlignSpacing;
          parameters.behaviour.enableFullScreen = parameters.question.settings.enableFullScreen;
          delete parameters.question.settings.dropZoneHighlighting;
          delete parameters.question.settings.autoAlignSpacing;
          delete parameters.question.settings.enableFullScreen;
        }

        // Done
        finished(null, parameters);
      },
      13: function (parameters, finished, extras) {
        var metadata = extras.metadata || {};
        if (parameters.question && parameters.question.settings) {
          // Set new show title parameter
          if (parameters.behaviour) {
            parameters.behaviour.showTitle = parameters.question.settings.showTitle || false;
          }

          metadata.title = parameters.question.settings.questionTitle || ((extras && extras.metadata) ? extras.metadata.title : undefined);

          // Remove old parameter
          delete parameters.question.settings.questionTitle;
          delete parameters.question.settings.showTitle;
        }
        extras.metadata = metadata;

        finished(null, parameters, extras);
      },
      14: function (parameters, finished, extras) {
        const taskParams = parameters.question.task;
        if (taskParams.dropZones && taskParams.elements) {
          const dropZones = taskParams.dropZones;
          // Go through and check if there are any draggables that should not be
          // there.
          const draggables = taskParams.elements;
          dropZones.forEach((dropzone, index) => {
            dropzone.correctElements = dropzone.correctElements.filter((draggableId) => {
              // Check for existence first
              const draggableExists = draggables.length > parseInt(draggableId);
              if (!draggableExists) {
                return false;
              }

              // Check if the draggable can be dropped in the dropzone
              const draggableParams = draggables[parseInt(draggableId)];
              const canBeDropped = draggableParams.dropZones.includes(index.toString());
              return canBeDropped;
            });
          });
        }

        finished(null, parameters, extras);
      },
      /**
       * Split legacy autoAlignSpacing into horizontal and vertical values.
       */
      0: {
        2: function (parameters, finished) {
          if (parameters.behaviour) {
            var legacy = parameters.behaviour.autoAlignSpacing;

            if (parameters.behaviour.autoAlignSpacingX === undefined) {
              parameters.behaviour.autoAlignSpacingX = legacy !== undefined ? legacy : 2;
            }
            if (parameters.behaviour.autoAlignSpacingY === undefined) {
              parameters.behaviour.autoAlignSpacingY = legacy !== undefined ? legacy : 2;
            }
            delete parameters.behaviour.autoAlignSpacing;
          }

          finished(null, parameters);
        },
        4: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;
          var scaleSteps = [1, 1.25, 1.5, 1.75, 2];
          var baseWidth = 620;
          var baseHeight = 310;
          var scale;
          var closest;
          var minDiff;
          var i;
          var diff;

          if (!settings) {
            finished(null, parameters);
            return;
          }

          if (!settings.size) {
            settings.size = { width: baseWidth, height: baseHeight };
          }

          if (settings.taskSizeScale !== undefined && settings.taskSizeScale !== null && settings.taskSizeScale !== '') {
            scale = parseFloat(settings.taskSizeScale);
          }
          else if (settings.size.width) {
            scale = settings.size.width / baseWidth;
          }
          else {
            scale = 1;
          }

          if (isNaN(scale)) {
            scale = 1;
          }

          closest = scaleSteps[0];
          minDiff = Math.abs(scale - closest);
          for (i = 1; i < scaleSteps.length; i++) {
            diff = Math.abs(scale - scaleSteps[i]);
            if (diff < minDiff) {
              minDiff = diff;
              closest = scaleSteps[i];
            }
          }

          settings.taskSizeScale = closest;
          settings.size.width = Math.round(baseWidth * closest);
          settings.size.height = Math.round(baseHeight * closest);

          finished(null, parameters);
        },
        5: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;

          if (settings && settings.useScaledTaskSize === undefined) {
            settings.useScaledTaskSize = true;
          }

          finished(null, parameters);
        },
        6: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;
          var task = parameters.question && parameters.question.task;
          var scale;

          if (!parameters.question) {
            finished(null, parameters);
            return;
          }

          if (!task) {
            parameters.question.task = {
              elements: [],
              dropZones: []
            };
          }
          else {
            if (!Array.isArray(task.elements)) {
              task.elements = [];
            }
            if (!Array.isArray(task.dropZones)) {
              task.dropZones = [];
            }
          }

          if (settings && settings.taskSizeScale !== undefined && settings.taskSizeScale !== null && settings.taskSizeScale !== '') {
            scale = parseFloat(settings.taskSizeScale);
            if (!isNaN(scale)) {
              settings.taskSizeScale = String(scale);
            }
          }

          finished(null, parameters);
        },
        7: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;

          if (!settings) {
            finished(null, parameters);
            return;
          }

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

          finished(null, parameters);
        },
        8: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              if (!dropZone.labelPosition) {
                dropZone.labelPosition = 'outside-top';
              }
            });
          }

          finished(null, parameters);
        },
        9: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              if (!dropZone.labelDisplayMode) {
                dropZone.labelDisplayMode = 'label-only';
              }
            });
          }

          finished(null, parameters);
        },
        10: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              if (!dropZone.labelVisual) {
                dropZone.labelVisual = {
                  labelDisplayMode: dropZone.labelDisplayMode || 'label-only',
                  labelPosition: dropZone.labelPosition || 'outside-top',
                  iconSource: dropZone.iconSource || 'image',
                  zoneImage: dropZone.zoneImage,
                  zoneIcon: dropZone.zoneIcon
                };

                delete dropZone.iconSource;
                delete dropZone.zoneIcon;

                delete dropZone.labelDisplayMode;
                delete dropZone.labelPosition;
                delete dropZone.zoneImage;
              }
            });
          }

          finished(null, parameters);
        },
        11: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              var visual = dropZone.labelVisual;

              if (visual && visual.labelDisplayMode === 'label-with-icon' && !visual.iconSource) {
                visual.iconSource = 'image';
              }
            });
          }

          finished(null, parameters);
        },
        12: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              var visual = dropZone.labelVisual;

              if (!visual) {
                return;
              }

              if (!visual.labelWithIcon && (visual.iconSource || visual.zoneImage || visual.zoneIcon)) {
                visual.labelWithIcon = {
                  iconSource: visual.iconSource || 'image',
                  zoneImage: visual.zoneImage
                };

                if (visual.zoneIcon) {
                  visual.labelWithIcon.fontawesomeIcon = {
                    zoneIcon: visual.zoneIcon
                  };
                }

                delete visual.iconSource;
                delete visual.zoneImage;
                delete visual.zoneIcon;
              }
            });
          }

          finished(null, parameters);
        },
        13: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              var visual = dropZone.labelVisual;
              var withIcon;

              if (!visual || !visual.labelWithIcon) {
                return;
              }

              withIcon = visual.labelWithIcon;

              if (withIcon.zoneIcon !== undefined && !withIcon.fontawesomeIcon) {
                withIcon.fontawesomeIcon = {
                  zoneIcon: withIcon.zoneIcon
                };
                delete withIcon.zoneIcon;
              }
            });
          }

          finished(null, parameters);
        },
        14: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              var withIcon = dropZone.labelVisual && dropZone.labelVisual.labelWithIcon;
              var fa;

              if (!withIcon || !withIcon.fontawesomeIcon) {
                return;
              }

              fa = withIcon.fontawesomeIcon;

              if (typeof fa === 'string' && fa.trim()) {
                withIcon.fontawesomeIcon = {
                  zoneIcon: fa.trim()
                };
              }
            });
          }

          finished(null, parameters);
        },
        15: function (parameters, finished) {
          var dropZones = parameters.question &&
            parameters.question.task &&
            parameters.question.task.dropZones;

          if (Array.isArray(dropZones)) {
            dropZones.forEach(function (dropZone) {
              var withIcon = dropZone.labelVisual && dropZone.labelVisual.labelWithIcon;

              if (!withIcon) {
                return;
              }

              if (withIcon.visualScale === undefined || withIcon.visualScale === null || withIcon.visualScale === '') {
                withIcon.visualScale = 100;
              }
            });
          }

          finished(null, parameters);
        },
        16: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;
          var appearance;
          var defaults = {
            dropZoneHoverBorder: '#666666',
            dropZoneLabelColor: '#333333',
            zoneIconColor: '#333333',
            draggableColor: '#333333',
            draggableHoverColor: '#663366'
          };
          var key;

          if (!settings) {
            finished(null, parameters);
            return;
          }

          if (!settings.appearance) {
            settings.appearance = {};
          }

          appearance = settings.appearance;

          for (key in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, key) &&
                (appearance[key] === undefined || appearance[key] === null || appearance[key] === '')) {
              appearance[key] = defaults[key];
            }
          }

          finished(null, parameters);
        },
        17: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;
          var appearance;
          var defaults = {
            draggableBackgroundFill: {
              useGradient: false,
              gradientColors: { colorStart: '#dddddd', colorEnd: '#bbbbbb', angle: 180 }
            },
            draggableHoverBackgroundFill: {
              useGradient: false,
              gradientColors: { colorStart: '#edd6e9', colorEnd: '#d4bed8', angle: 180 }
            },
            draggableDroppedBackgroundFill: {
              useGradient: false,
              gradientColors: { colorStart: '#cee0f4', colorEnd: '#a9c3d0', angle: 180 }
            },
            draggableCorrectBackgroundFill: {
              useGradient: false,
              gradientColors: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8', angle: 180 }
            },
            draggableWrongBackgroundFill: {
              useGradient: false,
              gradientColors: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8', angle: 180 }
            }
          };
          var key;
          var fillKey;

          if (!settings) {
            finished(null, parameters);
            return;
          }

          if (!settings.appearance) {
            settings.appearance = {};
          }

          appearance = settings.appearance;

          for (key in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, key) && !appearance[key]) {
              appearance[key] = defaults[key];
            }
          }

          for (fillKey in defaults) {
            if (!Object.prototype.hasOwnProperty.call(defaults, fillKey)) {
              continue;
            }

            if (!appearance[fillKey].gradientColors) {
              appearance[fillKey].gradientColors = defaults[fillKey].gradientColors;
            }

            if (appearance[fillKey].useGradient === undefined) {
              appearance[fillKey].useGradient = false;
            }
          }

          finished(null, parameters);
        },
        18: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;
          var appearance;
          var dropZoneKeys = [
            'dropZoneBackground',
            'dropZoneBorder',
            'dropZoneHoverBackground',
            'dropZoneHoverBorder',
            'dropZoneLabelColor',
            'zoneIconColor'
          ];
          var draggableBgKeys = [
            'draggableBackground',
            'draggableHoverBackground',
            'draggableDroppedBackground',
            'draggableCorrectBackground',
            'draggableWrongBackground'
          ];
          var draggableOtherKeys = [
            'draggableBorder',
            'draggableColor',
            'draggableHoverBorder',
            'draggableHoverColor',
            'draggableDroppedBorder',
            'draggableDroppedColor',
            'draggableCorrectBorder',
            'draggableCorrectColor',
            'draggableWrongBorder',
            'draggableWrongColor'
          ];
          var gradientStates = [
            {
              stateKey: 'normal',
              solidKey: 'draggableBackground',
              legacyFillKey: 'draggableBackgroundFill',
              defaults: { colorStart: '#dddddd', colorEnd: '#bbbbbb' }
            },
            {
              stateKey: 'hover',
              solidKey: 'draggableHoverBackground',
              legacyFillKey: 'draggableHoverBackgroundFill',
              defaults: { colorStart: '#edd6e9', colorEnd: '#d4bed8' }
            },
            {
              stateKey: 'dropped',
              solidKey: 'draggableDroppedBackground',
              legacyFillKey: 'draggableDroppedBackgroundFill',
              defaults: { colorStart: '#cee0f4', colorEnd: '#a9c3d0' }
            },
            {
              stateKey: 'correct',
              solidKey: 'draggableCorrectBackground',
              legacyFillKey: 'draggableCorrectBackgroundFill',
              defaults: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8' }
            },
            {
              stateKey: 'wrong',
              solidKey: 'draggableWrongBackground',
              legacyFillKey: 'draggableWrongBackgroundFill',
              defaults: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8' }
            }
          ];
          var legacyFillKeys = [
            'draggableBackgroundFill',
            'draggableHoverBackgroundFill',
            'draggableDroppedBackgroundFill',
            'draggableCorrectBackgroundFill',
            'draggableWrongBackgroundFill'
          ];
          var useGradient = false;
          var angle = 180;
          var dropZoneColors = {};
          var draggableColors;
          var solidBackgrounds = {};
          var gradientBackgrounds;
          var i;
          var key;
          var spec;
          var fill;
          var gc;

          if (!settings) {
            finished(null, parameters);
            return;
          }

          if (!settings.appearance) {
            settings.appearance = {};
          }

          appearance = settings.appearance;

          if (appearance.dropZoneColors && appearance.draggableColors) {
            finished(null, parameters);
            return;
          }

          for (i = 0; i < gradientStates.length; i++) {
            spec = gradientStates[i];
            fill = appearance[spec.legacyFillKey];

            if (fill && fill.useGradient === true) {
              useGradient = true;

              if (fill.gradientColors && fill.gradientColors.angle !== undefined &&
                  fill.gradientColors.angle !== null && fill.gradientColors.angle !== '') {
                angle = parseInt(fill.gradientColors.angle, 10);

                if (isNaN(angle)) {
                  angle = 180;
                }
              }
            }
          }

          for (i = 0; i < dropZoneKeys.length; i++) {
            key = dropZoneKeys[i];

            if (appearance[key] !== undefined) {
              dropZoneColors[key] = appearance[key];
            }
          }

          draggableColors = {
            useGradientBackground: useGradient,
            solidBackgrounds: {},
            gradientBackgrounds: {
              gradientAngle: angle,
              normal: { colorStart: '#dddddd', colorEnd: '#bbbbbb' },
              hover: { colorStart: '#edd6e9', colorEnd: '#d4bed8' },
              dropped: { colorStart: '#cee0f4', colorEnd: '#a9c3d0' },
              correct: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8' },
              wrong: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8' }
            }
          };

          for (i = 0; i < draggableBgKeys.length; i++) {
            key = draggableBgKeys[i];

            if (appearance[key] !== undefined) {
              solidBackgrounds[key] = appearance[key];
            }
          }

          for (i = 0; i < gradientStates.length; i++) {
            spec = gradientStates[i];
            fill = appearance[spec.legacyFillKey];
            gc = (fill && fill.gradientColors) ? fill.gradientColors : spec.defaults;

            draggableColors.gradientBackgrounds[spec.stateKey] = {
              colorStart: gc.colorStart || spec.defaults.colorStart,
              colorEnd: gc.colorEnd || spec.defaults.colorEnd
            };

            if (!solidBackgrounds[spec.solidKey] && appearance[spec.solidKey]) {
              solidBackgrounds[spec.solidKey] = appearance[spec.solidKey];
            }
          }

          draggableColors.solidBackgrounds = solidBackgrounds;

          for (i = 0; i < draggableOtherKeys.length; i++) {
            key = draggableOtherKeys[i];

            if (appearance[key] !== undefined) {
              draggableColors[key] = appearance[key];
            }
          }

          appearance.dropZoneColors = dropZoneColors;
          appearance.draggableColors = draggableColors;

          for (i = 0; i < dropZoneKeys.length; i++) {
            delete appearance[dropZoneKeys[i]];
          }

          for (i = 0; i < draggableBgKeys.length; i++) {
            delete appearance[draggableBgKeys[i]];
          }

          for (i = 0; i < draggableOtherKeys.length; i++) {
            delete appearance[draggableOtherKeys[i]];
          }

          for (i = 0; i < legacyFillKeys.length; i++) {
            delete appearance[legacyFillKeys[i]];
          }

          finished(null, parameters);
        },
        19: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;
          var appearance;
          var dropZoneColors;
          var borderSettings;
          var normal;
          var hover;

          if (!settings) {
            finished(null, parameters);
            return;
          }

          if (!settings.appearance) {
            settings.appearance = {};
          }

          appearance = settings.appearance;
          if (!appearance.dropZoneColors) {
            appearance.dropZoneColors = {};
          }

          dropZoneColors = appearance.dropZoneColors;
          if (dropZoneColors.useDropZoneBorder === undefined) {
            dropZoneColors.useDropZoneBorder = true;
          }

          if (!dropZoneColors.borderSettings) {
            dropZoneColors.borderSettings = {};
          }

          borderSettings = dropZoneColors.borderSettings;
          if (borderSettings.borderWidth === undefined || borderSettings.borderWidth === null || borderSettings.borderWidth === '') {
            borderSettings.borderWidth = 0.1;
          }

          if (!borderSettings.normal) {
            borderSettings.normal = {};
          }
          if (!borderSettings.hover) {
            borderSettings.hover = {};
          }

          normal = borderSettings.normal;
          hover = borderSettings.hover;

          if (normal.borderStyle === undefined || normal.borderStyle === null || normal.borderStyle === '') {
            normal.borderStyle = 'solid';
          }
          if (hover.borderStyle === undefined || hover.borderStyle === null || hover.borderStyle === '') {
            hover.borderStyle = 'solid';
          }

          if ((normal.borderColor === undefined || normal.borderColor === null || normal.borderColor === '') &&
              dropZoneColors.dropZoneBorder !== undefined && dropZoneColors.dropZoneBorder !== null && dropZoneColors.dropZoneBorder !== '') {
            normal.borderColor = dropZoneColors.dropZoneBorder;
          }
          if (normal.borderColor === undefined || normal.borderColor === null || normal.borderColor === '') {
            normal.borderColor = '#666666';
          }

          if ((hover.borderColor === undefined || hover.borderColor === null || hover.borderColor === '') &&
              dropZoneColors.dropZoneHoverBorder !== undefined && dropZoneColors.dropZoneHoverBorder !== null && dropZoneColors.dropZoneHoverBorder !== '') {
            hover.borderColor = dropZoneColors.dropZoneHoverBorder;
          }
          if (hover.borderColor === undefined || hover.borderColor === null || hover.borderColor === '') {
            hover.borderColor = '#666666';
          }

          delete dropZoneColors.dropZoneBorder;
          delete dropZoneColors.dropZoneHoverBorder;

          finished(null, parameters);
        },
        20: function (parameters, finished) {
          var settings = parameters.question && parameters.question.settings;
          var appearance;
          var dropZoneColors;
          var draggableColors;

          if (!settings || !settings.appearance) {
            finished(null, parameters);
            return;
          }

          appearance = settings.appearance;
          dropZoneColors = appearance.dropZoneColors || {};
          draggableColors = appearance.draggableColors || {};

          if ((appearance.dropZoneBorderRadius === undefined || appearance.dropZoneBorderRadius === null || appearance.dropZoneBorderRadius === '') &&
              dropZoneColors.borderRadius !== undefined && dropZoneColors.borderRadius !== null && dropZoneColors.borderRadius !== '') {
            appearance.dropZoneBorderRadius = dropZoneColors.borderRadius;
          }

          if ((appearance.draggableBorderRadius === undefined || appearance.draggableBorderRadius === null || appearance.draggableBorderRadius === '') &&
              draggableColors.borderRadius !== undefined && draggableColors.borderRadius !== null && draggableColors.borderRadius !== '') {
            appearance.draggableBorderRadius = draggableColors.borderRadius;
          }

          delete dropZoneColors.borderRadius;
          delete draggableColors.borderRadius;

          finished(null, parameters);
        }
      }
    }
  };
})();

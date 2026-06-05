import DragUtils from './drag-utils';
import {
  getFaIconClassAttr,
  getLabelVisualFromDropZone,
  getVisualStackScaleStyle,
  normalizeLabelDisplayMode,
  normalizeVisualScale,
  resolveIconSource,
  usesLabelVisualStack
} from './label-visual';

const $ = H5P.jQuery;

const LABEL_POSITION_DEFAULT = 'outside-top';
const LABEL_POSITIONS = [
  'outside-top',
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center-center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
];

/**
 * @param {string} [position]
 * @returns {string}
 */
function normalizeLabelPosition(position) {
  if (LABEL_POSITIONS.indexOf(position) !== -1) {
    return position;
  }

  return LABEL_POSITION_DEFAULT;
}

export default class DropZone {
  /**
   * Creates a new drop zone instance.
   *
   * @param {Object} dropZone
   * @param {Number} id
   * @param {string[]} l10n
   */
  constructor(dropZone, id, l10n) {
    var self = this;
    H5P.EventDispatcher.call(self);

    const behaviour = dropZone.behaviour ?? {};
    const labelVisual = getLabelVisualFromDropZone(dropZone);

    self.id = id;
    self.showLabel = dropZone.showLabel;
    self.label = dropZone.label;
    self.labelDisplayMode = normalizeLabelDisplayMode(labelVisual.labelDisplayMode);
    self.labelPosition = normalizeLabelPosition(labelVisual.labelPosition);
    self.iconSource = resolveIconSource(labelVisual.iconSource, labelVisual.zoneImage, labelVisual.zoneIcon);
    self.zoneImage = labelVisual.zoneImage;
    self.zoneIcon = labelVisual.zoneIcon;
    self.visualScale = normalizeVisualScale(labelVisual.visualScale);
    self.x = dropZone.x;
    self.y = dropZone.y;
    self.width = dropZone.width;
    self.height = dropZone.height;
    self.backgroundOpacity = dropZone.backgroundOpacity;
    self.tip = dropZone.tipsAndFeedback.tip || '';
    self.single = dropZone.single;
    self.autoAlignable = dropZone.autoAlign;
    self.useBackgroundHover =
      behaviour.dropZoneHighlighting === 'always' ||
      behaviour.dropZoneHighlighting === 'dragging';
    self.alignables = [];
    self.l10n = l10n;
  }

  /**
   * @param {number} contentId
   * @returns {string}
   */
  getIconHtml(contentId) {
    var faClasses;
    var alt = DragUtils.strip(this.label);

    if (this.iconSource === 'fontawesome') {
      faClasses = getFaIconClassAttr(this.zoneIcon);

      if (faClasses) {
        return '<span class="h5p-dz-icon h5p-dz-fa ' + faClasses + '" aria-hidden="true"></span>';
      }
    }
    else if (this.zoneImage && this.zoneImage.path) {
      return '<img class="h5p-dz-icon" src="' + H5P.getPath(this.zoneImage.path, contentId) + '" alt="' + alt + '"/>';
    }

    return '';
  }

  /**
   * @param {number} contentId
   * @returns {string}
   */
  getLabelVisualHtml(contentId) {
    var iconHtml;
    var stackOpen = '<div class="h5p-dz-visual-stack"' + getVisualStackScaleStyle(this.visualScale) + '>';
    var stackClose = '</div>';

    if (this.labelDisplayMode === 'label-only') {
      return '<div class="h5p-label h5p-label-pos-' + this.labelPosition + '">' + this.label + '<span class="h5p-hidden-read"></span></div>';
    }

    iconHtml = this.getIconHtml(contentId);

    if (this.labelDisplayMode === 'icon-only') {
      if (!iconHtml) {
        return '';
      }

      return stackOpen + iconHtml + stackClose;
    }

    return stackOpen + iconHtml + '<div class="h5p-label h5p-label-pos-stack-bottom">' + this.label + '<span class="h5p-hidden-read"></span></div>' + stackClose;
  }

  /**
   * @param {jQuery} $container
   * @param {Array} draggables
   * @param {number} contentId
   */
  appendTo($container, draggables, contentId) {
    var self = this;
    var containerClasses = '';
    var labelHtml = '';
    var useSimpleAreaLabel = false;

    if (self.showLabel) {
      labelHtml = self.getLabelVisualHtml(contentId);
      containerClasses = 'h5p-has-label';

      if (usesLabelVisualStack(self.labelDisplayMode)) {
        containerClasses += ' h5p-has-visual-stack h5p-has-label-inside';

        if (self.labelDisplayMode === 'icon-only') {
          containerClasses += ' h5p-has-icon-only';
        }
      }
      else if (self.labelPosition === 'outside-top') {
        containerClasses += ' h5p-has-label-outside';
      }
      else {
        containerClasses += ' h5p-has-label-inside';
      }

      useSimpleAreaLabel = self.labelDisplayMode === 'label-only';
    }

    self.$dropZone = $(
      H5P.Components.Dropzone({
        variant: 'area',
        containerClasses: containerClasses,
        classes: 'h5p-inner',
        tolerance: 'intersect',
        role: 'button',
        backgroundOpacity: this.backgroundOpacity,
        ariaDisabled: true,
        ariaLabel: self.showLabel && !useSimpleAreaLabel
          ? undefined
          : `${self.l10n.prefix.replace('{num}', self.id + 1)} ${DragUtils.strip(self.label)}`,
        areaLabel: useSimpleAreaLabel ? self.label : undefined,
        handleAcceptEvent: (element) => {
          const result = DragUtils.elementToDraggable(draggables, element);

          if (!result) {
            return false;
          }

          return this.accepts(result.draggable, draggables);
        },
        handleDropEvent: (event, ui) => {
          const $this = this.$dropZone;
          DragUtils.setOpacity($this.children('.h5p-inner').removeClass('h5p-over'), 'background', this.backgroundOpacity);
          ui.draggable.data('addToZone', this.id);

          if (this.getIndexOf(ui.draggable) === -1) {
            this.alignables.push(ui.draggable);
          }

          if (this.autoAlignable.enabled) {
            this.autoAlign();
          }
        },
        handleDropOverEvent: () => {
          if (this.useBackgroundHover) {
            DragUtils.setOpacity(this.$dropZone.children('.h5p-inner').addClass('h5p-over'), 'background', this.backgroundOpacity);
          }
        },
        handleDropOutEvent: () => {
          if (this.useBackgroundHover) {
            DragUtils.setOpacity(this.$dropZone.children('.h5p-inner').removeClass('h5p-over'), 'background', this.backgroundOpacity);
          }
        },
      })
    )
      .css({
        left: self.x + '%',
        top: self.y + '%',
        width: self.width + 'em',
        height: self.height + 'em',
      })
      .appendTo($container)
      .focus(function () {
        if ($tip instanceof H5P.jQuery) {
          $tip.attr('tabindex', '0');
        }
      })
      .blur(function () {
        if ($tip instanceof H5P.jQuery) {
          $tip.attr('tabindex', '-1');
        }
      });

    if (labelHtml) {
      self.$dropZone.prepend(labelHtml);
    }

    var $tip = H5P.JoubelUICFRD.createTip(self.tip, {
      tipLabel: self.l10n.tipLabel,
      tabcontrol: true,
    });
    if ($tip instanceof H5P.jQuery) {
      $('<span/>', {
        class: 'h5p-dq-tipwrap',
        'aria-label': self.l10n.tipAvailable,
        append: $tip,
        appendTo: self.$dropZone,
      });
    }

    draggables.forEach(function (draggable) {
      var dragEl = draggable.element.$;

      if (draggable.isInDropZone(self.id) && self.getIndexOf(dragEl) === -1) {
        self.alignables.push(dragEl);
      }
    });
    if (self.autoAlignable.enabled) {
      self.autoAlign();
    }

    setTimeout(function () {
      self.updateBackgroundOpacity();
    }, 0);
  }

  updateBackgroundOpacity() {
    DragUtils.setOpacity(this.$dropZone.children('.h5p-label'), 'background', this.backgroundOpacity);
    DragUtils.setOpacity(this.$dropZone.children('.h5p-dropzone_label'), 'background', this.backgroundOpacity);
    DragUtils.setOpacity(this.$dropZone.children('.h5p-inner'), 'background', this.backgroundOpacity);
  }

  accepts(draggable, draggables) {
    var self = this;
    if (!draggable.hasDropZone(self.id)) {
      return false;
    }

    if (self.single) {
      for (var i = 0; i < draggables.length; i++) {
        if (draggables[i] && draggables[i].isInDropZone(self.id)) {
          return false;
        }
      }
    }

    return true;
  }

  getIndexOf($alignable) {
    for (var i = 0; i < this.alignables.length; i++) {
      if (this.alignables[i][0] === $alignable[0]) {
        return i;
      }
    }

    return -1;
  }

  removeAlignable($alignable) {
    var index = this.getIndexOf($alignable);
    if (index !== -1) {
      this.alignables.splice(index, 1);

      if (this.autoAlignTimer === undefined && this.autoAlignable.enabled) {
        this.autoAlignTimer = setTimeout(() => {
          delete this.autoAlignTimer;
          this.autoAlign();
        }, 1);
      }
    }
  }

  autoAlign() {
    var self = this;
    var containerSize = self.$dropZone.parent()[0].getBoundingClientRect();
    var spacingPx = self.autoAlignable.spacing;
    var spacing = {
      x: (spacingPx.x / self.autoAlignable.size.width) * 100,
      y: (spacingPx.y / self.autoAlignable.size.height) * 100,
    };
    var pos = {
      x: self.x + spacing.x,
      y: self.y + spacing.y,
    };
    var dropZoneSize = self.$dropZone[0].getBoundingClientRect();
    var space = {
      x: dropZoneSize.width - spacing.x * 2,
      y: dropZoneSize.height - spacing.y * 2,
    };
    var spaceLeft = {
      x: space.x,
      y: space.y,
    };
    var currentRowHeight = 0;
    var $alignable;
    var alignableSize;

    var alignElement = function () {
      $alignable.css({
        left: pos.x + '%',
        top: pos.y + '%',
      });
      self.trigger('elementaligned', $alignable);

      var spaceDiffX = alignableSize.width + spacingPx.x;
      spaceLeft.x -= spaceDiffX;
      pos.x += (spaceDiffX / containerSize.width) * 100;

      var spaceDiffY = alignableSize.height + spacingPx.y;
      if (spaceDiffY > currentRowHeight) {
        currentRowHeight = spaceDiffY;
      }
    };

    for (var i = 0; i < self.alignables.length; i++) {
      $alignable = self.alignables[i];
      alignableSize = $alignable[0].getBoundingClientRect();

      if (spaceLeft.x >= alignableSize.width) {
        alignElement();
      }
      else {
        spaceLeft.x = space.x;
        pos.x = self.x + spacing.x;

        if (currentRowHeight) {
          spaceLeft.y -= currentRowHeight;
          pos.y += (currentRowHeight / containerSize.height) * 100;
          currentRowHeight = 0;
        }
        if (spaceLeft.y <= 0) {
          return;
        }
        alignElement();
      }
    }
  }

  highlight() {
    this.$dropZone
      .attr('aria-disabled', 'false')
      .children('.h5p-inner')
      .addClass('h5p-dropzone--active');
  }

  dehighlight() {
    this.$dropZone
      .attr('aria-disabled', 'true')
      .children('.h5p-inner')
      .removeClass('h5p-dropzone--active');
    this.$dropZone.attr('tabindex', '-1');
  }

  reset() {
    this.alignables = [];
    DragUtils.setOpacity(this.$dropZone.children('.h5p-inner').removeClass('h5p-over'), 'background', this.backgroundOpacity);
  }
}

/*!
 * Font Awesome Icon Picker - lightweight position adapter
 * https://github.com/DikaArdnt/fontawesome-iconpicker
 *
 * Copyright (c) 2026 DikaArdnt
 * @license MIT
 */
(function(factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof window !== 'undefined' && window.jQuery) {
        factory(window.jQuery);
    }
}(function($) {
    'use strict';

    function parseAlignment(value) {
        var parts = String(value || 'center center').trim().split(/\s+/);
        return {
            x: parts[0] || 'center',
            y: parts[1] || 'center'
        };
    }

    function axisOffset(alignment, size) {
        if (alignment === 'right' || alignment === 'bottom') {
            return size;
        }
        if (alignment === 'center') {
            return size / 2;
        }
        return 0;
    }

    function opposite(alignment) {
        return {
            left: 'right',
            right: 'left',
            top: 'bottom',
            bottom: 'top'
        }[alignment] || alignment;
    }

    function calculate(target, element, my, at) {
        var offset = target.offset() || { left: 0, top: 0 };
        var targetWidth = target.outerWidth() || 0;
        var targetHeight = target.outerHeight() || 0;
        var width = element.outerWidth() || 0;
        var height = element.outerHeight() || 0;

        return {
            left: offset.left + axisOffset(at.x, targetWidth) - axisOffset(my.x, width),
            top: offset.top + axisOffset(at.y, targetHeight) - axisOffset(my.y, height)
        };
    }

    function viewportBounds() {
        var left = $(window).scrollLeft();
        var top = $(window).scrollTop();
        return {
            left: left,
            top: top,
            right: left + $(window).width(),
            bottom: top + $(window).height()
        };
    }

    function fitsX(position, width, viewport) {
        return position.left >= viewport.left && position.left + width <= viewport.right;
    }

    function fitsY(position, height, viewport) {
        return position.top >= viewport.top && position.top + height <= viewport.bottom;
    }

    $.fn.iconpickerPosition = function(options) {
        options = options || {};
        var target = $(options.of || window).first();
        if (!target.length) {
            return this;
        }

        return this.each(function() {
            var element = $(this);
            var my = parseAlignment(options.my);
            var at = parseAlignment(options.at);
            var collision = String(options.collision || 'none').toLowerCase();
            var width = element.outerWidth() || 0;
            var height = element.outerHeight() || 0;
            var position = calculate(target, element, my, at);

            if (collision !== 'none') {
                var viewport = viewportBounds();

                if (collision.indexOf('flip') !== -1) {
                    if (!fitsX(position, width, viewport)) {
                        var flippedX = calculate(
                            target,
                            element,
                            { x: opposite(my.x), y: my.y },
                            { x: opposite(at.x), y: at.y }
                        );
                        if (fitsX(flippedX, width, viewport)) {
                            position.left = flippedX.left;
                        }
                    }

                    if (!fitsY(position, height, viewport)) {
                        var flippedY = calculate(
                            target,
                            element,
                            { x: my.x, y: opposite(my.y) },
                            { x: at.x, y: opposite(at.y) }
                        );
                        if (fitsY(flippedY, height, viewport)) {
                            position.top = flippedY.top;
                        }
                    }
                }

                if (collision.indexOf('fit') !== -1 || collision.indexOf('flip') !== -1) {
                    position.left = Math.max(viewport.left, Math.min(position.left, viewport.right - width));
                    position.top = Math.max(viewport.top, Math.min(position.top, viewport.bottom - height));
                }
            }

            element.offset(position);
        });
    };
}));

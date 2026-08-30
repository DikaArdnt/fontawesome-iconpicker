/*!
 * Font Awesome Icon Picker
 * https://github.com/DikaArdnt/fontawesome-iconpicker
 * Copyright (c) 2026 DikaArdnt
 * @license MIT
 */
(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof window !== "undefined" && window.jQuery) {
        factory(window.jQuery);
    }
})(function($) {
    "use strict";
    function parseAlignment(value) {
        var parts = String(value || "center center").trim().split(/\s+/);
        return {
            x: parts[0] || "center",
            y: parts[1] || "center"
        };
    }
    function axisOffset(alignment, size) {
        if (alignment === "right" || alignment === "bottom") {
            return size;
        }
        if (alignment === "center") {
            return size / 2;
        }
        return 0;
    }
    function opposite(alignment) {
        return {
            left: "right",
            right: "left",
            top: "bottom",
            bottom: "top"
        }[alignment] || alignment;
    }
    function calculate(target, element, my, at) {
        var offset = target.offset() || {
            left: 0,
            top: 0
        };
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
            var collision = String(options.collision || "none").toLowerCase();
            var width = element.outerWidth() || 0;
            var height = element.outerHeight() || 0;
            var position = calculate(target, element, my, at);
            if (collision !== "none") {
                var viewport = viewportBounds();
                if (collision.indexOf("flip") !== -1) {
                    if (!fitsX(position, width, viewport)) {
                        var flippedX = calculate(target, element, {
                            x: opposite(my.x),
                            y: my.y
                        }, {
                            x: opposite(at.x),
                            y: at.y
                        });
                        if (fitsX(flippedX, width, viewport)) {
                            position.left = flippedX.left;
                        }
                    }
                    if (!fitsY(position, height, viewport)) {
                        var flippedY = calculate(target, element, {
                            x: my.x,
                            y: opposite(my.y)
                        }, {
                            x: at.x,
                            y: opposite(at.y)
                        });
                        if (fitsY(flippedY, height, viewport)) {
                            position.top = flippedY.top;
                        }
                    }
                }
                if (collision.indexOf("fit") !== -1 || collision.indexOf("flip") !== -1) {
                    position.left = Math.max(viewport.left, Math.min(position.left, viewport.right - width));
                    position.top = Math.max(viewport.top, Math.min(position.top, viewport.bottom - height));
                }
            }
            element.offset(position);
        });
    };
});

(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof window !== "undefined" && window.jQuery) {
        factory(window.jQuery);
    }
})(function($) {
    "use strict";
    var DATA_KEY = "iconpicker";
    var EVENT_NS = ".iconpicker";
    var GLOBAL_EVENT_NS = ".iconpickerGlobal";
    var EMPTY_PACK = {
        icons: [],
        lookup: Object.create(null)
    };
    var INSTANCE_SEQ = 0;
    function isString(value) {
        return typeof value === "string" || value instanceof String;
    }
    function isArray(value) {
        return Array.isArray ? Array.isArray(value) : $.isArray(value);
    }
    function trim(value) {
        return String(value == null ? "" : value).trim();
    }
    function isEmpty(value) {
        return value === false || value === "" || value == null;
    }
    function hasElement(value) {
        if (!value) {
            return false;
        }
        return $(value).length > 0;
    }
    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    function safeClassName(value) {
        return trim(value).replace(/[^a-zA-Z0-9_\-\s]/g, "");
    }
    function nextTick(fn, delay) {
        return window.setTimeout(fn, delay || 0);
    }
    var IconStore = {
        globalIcons: [],
        urlCache: Object.create(null),
        objectCache: typeof WeakMap !== "undefined" ? new WeakMap() : null,
        normalize: function(source, useCache) {
            source = source || [];
            if (useCache !== false && this.objectCache && source && typeof source === "object") {
                var cached = this.objectCache.get(source);
                if (cached) {
                    return cached;
                }
            }
            var icons = [];
            var lookup = Object.create(null);
            for (var i = 0; i < source.length; i++) {
                var item = source[i];
                var title = "";
                var searchTerms = "";
                if (isString(item)) {
                    title = trim(item);
                } else if (isArray(item)) {
                    title = trim(item[0]);
                    searchTerms = item.length > 1 ? item[1] : "";
                } else if (item && typeof item === "object") {
                    title = trim(item.title);
                    searchTerms = item.searchTerms || "";
                }
                if (!title || lookup[title]) {
                    continue;
                }
                if (isArray(searchTerms)) {
                    searchTerms = searchTerms.join(" ");
                }
                var normalized = {
                    title: title,
                    searchTerms: String(searchTerms || ""),
                    search: (title + " " + String(searchTerms || "")).toLowerCase()
                };
                icons.push(normalized);
                lookup[title] = normalized;
            }
            var pack = {
                icons: icons,
                lookup: lookup
            };
            if (useCache !== false && this.objectCache && source && typeof source === "object") {
                this.objectCache.set(source, pack);
                this.objectCache.set(icons, pack);
            }
            return pack;
        },
        setGlobal: function(icons) {
            this.globalIcons = icons || [];
            this.normalize(this.globalIcons, true);
            return this.globalIcons;
        },
        clearUrlCache: function(url) {
            if (!url) {
                this.urlCache = Object.create(null);
                return;
            }
            var prefix = String(url) + "|";
            for (var key in this.urlCache) {
                if (Object.prototype.hasOwnProperty.call(this.urlCache, key) && (key === url || key.indexOf(prefix) === 0)) {
                    delete this.urlCache[key];
                }
            }
        },
        search: function(pack, query, maxResults) {
            pack = pack || EMPTY_PACK;
            query = trim(query).toLowerCase();
            var tokens = query ? query.split(/\s+/) : [];
            var limit = parseInt(maxResults, 10);
            var unlimited = !limit || limit < 1;
            var output = [];
            for (var i = 0; i < pack.icons.length; i++) {
                var icon = pack.icons[i];
                var matched = true;
                for (var j = 0; j < tokens.length; j++) {
                    if (icon.search.indexOf(tokens[j]) === -1) {
                        matched = false;
                        break;
                    }
                }
                if (!matched) {
                    continue;
                }
                output.push(icon);
                if (!unlimited && output.length >= limit) {
                    break;
                }
            }
            return output;
        },
        load: function(url, dataKey, cacheEnabled) {
            var self = this;
            var key = String(url) + "|" + String(dataKey || "icons");
            var cached = cacheEnabled !== false ? this.urlCache[key] : null;
            if (cached) {
                return cached;
            }
            var deferred = $.Deferred();
            var request = deferred.promise();
            if (cacheEnabled !== false) {
                this.urlCache[key] = request;
            }
            $.ajax({
                url: url,
                dataType: "json",
                cache: true
            }).done(function(data) {
                var raw = isArray(data) ? data : data && data[dataKey || "icons"] || [];
                deferred.resolve(self.normalize(raw, cacheEnabled !== false));
            }).fail(function(xhr, status, error) {
                if (cacheEnabled !== false) {
                    delete self.urlCache[key];
                }
                deferred.reject(error || status || new Error("Unable to load icon metadata"));
            });
            return request;
        }
    };
    var Renderer = {
        createPopover: function(options) {
            var popover = $(options.templates.popover).first();
            if (!popover.length) {
                popover = $('<div class="iconpicker-popover popover"><div class="arrow"></div><div class="popover-title"></div><div class="popover-content"></div></div>');
            }
            popover.removeClass("in inline topLeftCorner topLeft top topRight topRightCorner rightTop right rightBottom bottomRight bottomRightCorner bottom bottomLeft bottomLeftCorner leftBottom left leftTop");
            popover.css("display", "none");
            if (options.animation) {
                popover.addClass("fade");
            } else {
                popover.removeClass("fade");
            }
            var title = popover.find(".popover-title").first();
            title.empty();
            if (options.title) {
                $('<div class="popover-title-text"></div>').text(options.title).appendTo(title);
            }
            if (options.templates.search !== false && !options.inputSearch && !options.searchInFooter) {
                title.append($(options.templates.search));
            }
            if (!options.title && (options.templates.search === false || options.inputSearch || options.searchInFooter)) {
                title.remove();
            }
            popover.find(".popover-footer").remove();
            if (options.showFooter && options.templates.footer) {
                var footer = $(options.templates.footer).first();
                if (options.templates.search !== false && !options.inputSearch && options.searchInFooter) {
                    footer.append($(options.templates.search));
                }
                if (options.templates.buttons) {
                    footer.append($(options.templates.buttons));
                }
                popover.append(footer);
            }
            var picker = $(options.templates.iconpicker).first();
            if (!picker.length) {
                picker = $('<div class="iconpicker"><div class="iconpicker-items"></div></div>');
            }
            if (!picker.find(".iconpicker-items").length) {
                picker.append('<div class="iconpicker-items"></div>');
            }
            var content = popover.find(".popover-content").first();
            if (!content.length) {
                content = $('<div class="popover-content"></div>').appendTo(popover);
            }
            content.empty().append(picker);
            return {
                popover: popover,
                picker: picker
            };
        },
        renderIcons: function(instance, query) {
            if (!instance.iconpicker || !instance.iconpicker.length) {
                return $();
            }
            var results = IconStore.search(instance._pack, query, instance.options.maxResults);
            var itemsNode = instance.iconpicker.find(".iconpicker-items").get(0);
            if (!itemsNode) {
                return $();
            }
            var template = $(instance.options.templates.iconpickerItem).first().get(0);
            var fragment = document.createDocumentFragment();
            var selected = instance.iconpickerValue || "";
            for (var i = 0; i < results.length; i++) {
                var icon = results[i];
                var item = template ? template.cloneNode(true) : document.createElement("a");
                if (!item.getAttribute("href")) {
                    item.setAttribute("href", "#");
                }
                if (!item.getAttribute("role")) {
                    item.setAttribute("role", "button");
                }
                if ((" " + item.className + " ").indexOf(" iconpicker-item ") === -1) {
                    item.className += (item.className ? " " : "") + "iconpicker-item";
                }
                item.setAttribute("data-iconpicker-value", icon.title);
                item.setAttribute("title", "." + icon.title);
                if (selected === icon.title) {
                    item.className += " iconpicker-selected " + instance.options.selectedCustomClass;
                }
                var glyph = item.querySelector ? item.querySelector("i") : null;
                if (!glyph) {
                    glyph = document.createElement("i");
                    item.appendChild(glyph);
                }
                glyph.className = safeClassName(instance.options.fullClassFormatter(icon.title));
                fragment.appendChild(item);
            }
            while (itemsNode.firstChild) {
                itemsNode.removeChild(itemsNode.firstChild);
            }
            itemsNode.appendChild(fragment);
            instance._lastFilter = trim(query).toLowerCase();
            instance._rendered = true;
            return instance.iconpicker.find(".iconpicker-item");
        },
        clearIcons: function(instance) {
            if (!instance.iconpicker || !instance.iconpicker.length) {
                return;
            }
            instance.iconpicker.find(".iconpicker-items").empty();
            instance._rendered = false;
        },
        updateSelection: function(instance) {
            if (!instance.iconpicker || !instance.iconpicker.length) {
                return;
            }
            var selectedClass = "iconpicker-selected " + instance.options.selectedCustomClass;
            instance.iconpicker.find(".iconpicker-item").removeClass(selectedClass);
            if (!instance.iconpickerValue) {
                return;
            }
            instance.iconpicker.find(".iconpicker-item").filter(function() {
                return $(this).attr("data-iconpicker-value") === instance.iconpickerValue;
            }).addClass(selectedClass);
        }
    };
    var Positioner = {
        classes: "inline topLeftCorner topLeft top topRight topRightCorner rightTop right rightBottom bottomRight bottomRightCorner bottom bottomLeft bottomLeftCorner leftBottom left leftTop",
        map: {
            topLeftCorner: {
                my: "right bottom",
                at: "left top"
            },
            topLeft: {
                my: "left bottom",
                at: "left top"
            },
            top: {
                my: "center bottom",
                at: "center top"
            },
            topRight: {
                my: "right bottom",
                at: "right top"
            },
            topRightCorner: {
                my: "left bottom",
                at: "right top"
            },
            rightTop: {
                my: "left bottom",
                at: "right center"
            },
            right: {
                my: "left center",
                at: "right center"
            },
            rightBottom: {
                my: "left top",
                at: "right center"
            },
            bottomRightCorner: {
                my: "left top",
                at: "right bottom"
            },
            bottomRight: {
                my: "right top",
                at: "right bottom"
            },
            bottom: {
                my: "center top",
                at: "center bottom"
            },
            bottomLeft: {
                my: "left top",
                at: "left bottom"
            },
            bottomLeftCorner: {
                my: "right top",
                at: "left bottom"
            },
            leftBottom: {
                my: "right top",
                at: "left center"
            },
            left: {
                my: "right center",
                at: "left center"
            },
            leftTop: {
                my: "right bottom",
                at: "left center"
            }
        },
        apply: function(instance, placement, collision) {
            if (!instance.popover || !instance.popover.length) {
                return false;
            }
            placement = placement || instance.options.placement;
            collision = collision == null ? instance.options.collision : collision;
            collision = collision === true ? "flip" : collision;
            instance.options.placement = placement;
            instance.popover.removeClass(this.classes);
            if (placement === "inline") {
                instance.popover.addClass("inline").css({
                    display: "",
                    top: "auto",
                    right: "auto",
                    bottom: "auto",
                    left: "auto",
                    maxWidth: "none"
                });
                return true;
            }
            var target = instance.hasInput() && !instance.isInputGroup() ? instance.input : instance.container;
            var position = {
                my: "right top",
                at: "right bottom",
                of: target,
                collision: collision || "none",
                within: window
            };
            if (typeof placement === "object") {
                position = $.extend(position, placement);
            } else if (this.map[placement]) {
                position = $.extend(position, this.map[placement]);
            } else {
                return false;
            }
            instance.popover.css("display", "block");
            if ($.fn.iconpickerPosition) {
                instance.popover.iconpickerPosition(position);
            } else if ($.fn.pos) {
                instance.popover.pos(position);
            } else {
                var offset = target.offset() || {
                    left: 0,
                    top: 0
                };
                instance.popover.offset({
                    left: offset.left,
                    top: offset.top + (target.outerHeight() || 0)
                });
            }
            if (typeof placement === "string") {
                instance.popover.addClass(placement);
            }
            var containerOffset = instance.container.offset() || {
                left: 0
            };
            instance.popover.css("maxWidth", Math.max(0, $(window).width() - containerOffset.left - 5));
            return true;
        }
    };
    var SharedPopover = {
        owner: null,
        popover: $(),
        picker: $(),
        searchTimer: null,
        signature: null,
        uiSignature: function(instance) {
            var options = instance.options;
            var templates = options.templates;
            return [ templates.popover, templates.footer, templates.buttons, templates.search, templates.iconpicker, templates.iconpickerItem, options.title, options.showFooter, options.searchInFooter, options.inputSearch, options.animation ].join("||");
        },
        acquire: function(instance) {
            if (this.owner && this.owner !== instance) {
                this.owner._hideFromSharedSwap();
            }
            var signature = this.uiSignature(instance);
            if (!this.popover.length || this.signature !== signature) {
                this.rebuild(instance, signature);
            } else {
                this.owner = instance;
                instance.popover = this.popover;
                instance.iconpicker = this.picker;
                this.attach(instance);
                instance._normalizeMustAccept();
            }
            return this.popover;
        },
        rebuild: function(instance, signature) {
            if (this.popover.length) {
                this.popover.off(EVENT_NS).remove();
            }
            var ui = Renderer.createPopover(instance.options);
            this.popover = ui.popover;
            this.picker = ui.picker;
            this.owner = instance;
            this.signature = signature || this.uiSignature(instance);
            instance.popover = this.popover;
            instance.iconpicker = this.picker;
            this.bindUiEvents();
            this.attach(instance);
            instance._normalizeMustAccept();
            return this.popover;
        },
        attach: function(instance) {
            var destination = instance.isInputGroup() ? instance.container.parent() : instance.container;
            if (!this.popover.parent().is(destination)) {
                destination.append(this.popover);
            }
        },
        bindUiEvents: function() {
            var self = this;
            this.popover.off(EVENT_NS).on("click" + EVENT_NS, ".iconpicker-item", function(event) {
                event.preventDefault();
                if (self.owner) {
                    self.owner._selectItem($(this));
                }
            }).on("input" + EVENT_NS, ".iconpicker-search", function() {
                var input = this;
                window.clearTimeout(self.searchTimer);
                self.searchTimer = nextTick(function() {
                    if (self.owner) {
                        self.owner.filter($(input).val());
                    }
                }, self.owner ? self.owner.options.searchDebounce : 100);
            }).on("click" + EVENT_NS, ".iconpicker-btn-accept", function(event) {
                event.preventDefault();
                if (self.owner) {
                    self.owner._acceptSelection();
                }
            }).on("click" + EVENT_NS, ".iconpicker-btn-cancel", function(event) {
                event.preventDefault();
                if (self.owner) {
                    self.owner._cancelSelection();
                }
            });
        },
        release: function(instance, silent) {
            if (this.owner !== instance) {
                return;
            }
            window.clearTimeout(this.searchTimer);
            this.searchTimer = null;
            if (this.popover.length) {
                this.popover.removeClass("in").css("display", "none");
                this.popover.find(".iconpicker-search").val("");
                this.picker.find(".iconpicker-items").empty();
                this.popover.detach();
            }
            instance._lastFilter = "";
            instance._rendered = false;
            instance.popover = $();
            instance.iconpicker = $();
            this.owner = null;
            if (!silent) {
                instance._trigger("iconpickerHidden", {
                    iconpickerValue: instance.iconpickerValue
                });
            }
        },
        destroy: function() {
            window.clearTimeout(this.searchTimer);
            this.searchTimer = null;
            if (this.popover.length) {
                this.popover.off(EVENT_NS).remove();
            }
            this.owner = null;
            this.popover = $();
            this.picker = $();
            this.signature = null;
        }
    };
    var GlobalEventManager = {
        bound: false,
        registrations: 0,
        openInstances: Object.create(null),
        register: function() {
            this.registrations++;
            this.ensure();
        },
        unregister: function() {
            this.registrations = Math.max(0, this.registrations - 1);
            if (this.registrations !== 0) {
                return;
            }
            $(window).off(GLOBAL_EVENT_NS);
            $(document).off(GLOBAL_EVENT_NS);
            this.openInstances = Object.create(null);
            this.bound = false;
            SharedPopover.destroy();
        },
        ensure: function() {
            if (this.bound) {
                return;
            }
            this.bound = true;
            var self = this;
            $(window).on("resize" + GLOBAL_EVENT_NS + " orientationchange" + GLOBAL_EVENT_NS, function() {
                self.eachOpen(function(instance) {
                    if (!instance.isInline()) {
                        instance.updatePlacement();
                    }
                });
            });
            $(document).on("mousedown" + GLOBAL_EVENT_NS, function(event) {
                var open = [];
                self.eachOpen(function(instance) {
                    open.push(instance);
                });
                for (var i = 0; i < open.length; i++) {
                    if (!open[i]._containsEvent(event)) {
                        open[i].hide();
                    }
                }
            });
        },
        add: function(instance) {
            this.openInstances[instance._id] = instance;
        },
        remove: function(instance) {
            delete this.openInstances[instance._id];
        },
        eachOpen: function(callback) {
            for (var key in this.openInstances) {
                if (Object.prototype.hasOwnProperty.call(this.openInstances, key)) {
                    var instance = this.openInstances[key];
                    if (instance) {
                        callback(instance);
                    }
                }
            }
        }
    };
    function IconPicker(element, options) {
        this._id = ++INSTANCE_SEQ;
        this.element = $(element);
        var dataOptions = this.element.data() || {};
        var userOptions = options || {};
        this.options = $.extend({}, IconPicker.defaults, dataOptions, userOptions);
        this.options.templates = $.extend({}, IconPicker.defaults.templates, dataOptions.templates || {}, userOptions.templates || {});
        this.options.originalPlacement = this.options.placement;
        this.iconpickerValue = "";
        this._pack = EMPTY_PACK;
        this._iconsLoaded = false;
        this._iconsLoading = null;
        this._lastFilter = "";
        this._rendered = false;
        this._visible = false;
        this._destroyed = false;
        this._hideSequence = 0;
        this._inputSearchTimer = null;
        this.container = this._resolveContainer();
        if (this.isDropdownMenu()) {
            this.options.placement = "inline";
        }
        this.input = this._resolveInput();
        this.component = this._resolveComponent();
        this._shared = this.options.sharedPopover !== false && this.options.placement !== "inline";
        this.popover = $();
        this.iconpicker = $();
        this.element.addClass("iconpicker-element");
        this.container.addClass("iconpicker-container");
        if (this.input) {
            this.input.addClass("iconpicker-input");
        }
        if (this.component) {
            this.component.find("i").addClass("iconpicker-component");
        }
        this._applyInitialIconPack();
        this._trigger("iconpickerCreate", {
            iconpickerValue: this.iconpickerValue
        });
        if (!this._shared) {
            this._createPrivateUi();
        }
        this._bindElementEvents();
        GlobalEventManager.register();
        this.update(this.options.selected);
        if (this.isInline()) {
            this.show();
        }
        this._trigger("iconpickerCreated", {
            iconpickerValue: this.iconpickerValue
        });
    }
    IconPicker.defaults = {
        title: false,
        selected: false,
        defaultValue: false,
        placement: "bottom",
        collision: "none",
        animation: true,
        hideOnSelect: false,
        showFooter: false,
        searchInFooter: false,
        mustAccept: false,
        selectedCustomClass: "bg-primary",
        icons: [],
        iconsUrl: false,
        iconsDataKey: "icons",
        maxResults: 100,
        searchDebounce: 120,
        renderOnInit: false,
        sharedPopover: true,
        clearOnHide: true,
        cacheIcons: true,
        fullClassFormatter: function(value) {
            return value;
        },
        input: "input,.iconpicker-input",
        inputSearch: false,
        container: false,
        component: ".input-group-addon,.iconpicker-component",
        templates: {
            popover: '<div class="iconpicker-popover popover"><div class="arrow"></div><div class="popover-title"></div><div class="popover-content"></div></div>',
            footer: '<div class="popover-footer"></div>',
            buttons: '<button type="button" class="iconpicker-btn iconpicker-btn-cancel btn btn-default btn-sm">Cancel</button> <button type="button" class="iconpicker-btn iconpicker-btn-accept btn btn-primary btn-sm">Accept</button>',
            search: '<input type="search" class="form-control iconpicker-search" placeholder="Type to filter">',
            iconpicker: '<div class="iconpicker"><div class="iconpicker-items"></div></div>',
            iconpickerItem: '<a role="button" href="#" class="iconpicker-item"><i></i></a>'
        }
    };
    IconPicker.prototype = {
        constructor: IconPicker,
        _resolveContainer: function() {
            if (hasElement(this.options.container)) {
                return $(this.options.container).first();
            }
            if (this.element.is(".dropdown-toggle")) {
                var menu = this.element.siblings(".dropdown-menu").first();
                if (menu.length) {
                    return menu;
                }
            }
            if (this.element.is("input,textarea,button,.btn")) {
                return this.element.parent();
            }
            return this.element;
        },
        _resolveInput: function() {
            if (this.element.is("input,textarea")) {
                return this.element;
            }
            var input = this.container.find(this.options.input).first();
            return input.is("input,textarea") ? input : false;
        },
        _resolveComponent: function() {
            var component = this.isDropdownMenu() ? this.container.parent().find(this.options.component).first() : this.container.find(this.options.component).first();
            return component.length ? component : false;
        },
        _applyInitialIconPack: function() {
            var source = this.options.icons && this.options.icons.length ? this.options.icons : IconStore.globalIcons.length ? IconStore.globalIcons : typeof window !== "undefined" && window.FontAwesomeIconPickerIcons || [];
            this._usePack(IconStore.normalize(source, this.options.cacheIcons !== false));
            this._iconsLoaded = this._pack.icons.length > 0 || !this.options.iconsUrl;
        },
        _usePack: function(pack) {
            this._pack = pack || EMPTY_PACK;
            this.options.icons = this._pack.icons;
            this._rendered = false;
            return this._pack.icons;
        },
        _trigger: function(name, extra) {
            this.element.trigger($.extend({
                type: name,
                iconpickerInstance: this
            }, extra || {}));
        },
        _createPrivateUi: function() {
            var ui = Renderer.createPopover(this.options);
            this.popover = ui.popover;
            this.iconpicker = ui.picker;
            var destination = this.isInputGroup() ? this.container.parent() : this.container;
            destination.append(this.popover);
            this._bindPrivateUiEvents();
            this._normalizeMustAccept();
            if (this.options.renderOnInit) {
                this.filter("");
            }
        },
        _bindPrivateUiEvents: function() {
            var self = this;
            var searchTimer = null;
            this.popover.on("click" + EVENT_NS, ".iconpicker-item", function(event) {
                event.preventDefault();
                self._selectItem($(this));
            }).on("input" + EVENT_NS, ".iconpicker-search", function() {
                var input = this;
                window.clearTimeout(searchTimer);
                searchTimer = nextTick(function() {
                    self.filter($(input).val());
                }, self.options.searchDebounce);
            }).on("click" + EVENT_NS, ".iconpicker-btn-accept", function(event) {
                event.preventDefault();
                self._acceptSelection();
            }).on("click" + EVENT_NS, ".iconpicker-btn-cancel", function(event) {
                event.preventDefault();
                self._cancelSelection();
            });
        },
        _normalizeMustAccept: function() {
            if (!this.getAcceptButton().length) {
                this.options.mustAccept = false;
            }
        },
        _ensureUi: function() {
            if (this._shared) {
                SharedPopover.acquire(this);
                this.popover = SharedPopover.popover;
                this.iconpicker = SharedPopover.picker;
            } else if (!this.popover.length) {
                this._createPrivateUi();
            }
        },
        _selectItem: function(item) {
            var value = item.attr("data-iconpicker-value") || "";
            this._trigger("iconpickerSelect", {
                iconpickerItem: item,
                iconpickerValue: this.iconpickerValue
            });
            if (this.options.mustAccept) {
                this.update(value, true);
            } else {
                this.update(value);
                this._trigger("iconpickerSelected", {
                    iconpickerItem: item.get(0),
                    iconpickerValue: this.iconpickerValue
                });
                if (this.options.hideOnSelect) {
                    this.hide();
                }
            }
        },
        _acceptSelection: function() {
            var selectedItem = this.iconpicker.find(".iconpicker-item.iconpicker-selected").get(0) || null;
            this.update(this.iconpickerValue);
            this._trigger("iconpickerSelected", {
                iconpickerItem: selectedItem,
                iconpickerValue: this.iconpickerValue
            });
            if (!this.isInline()) {
                this.hide();
            }
        },
        _cancelSelection: function() {
            this.update(this.getSourceValue(this.options.defaultValue), true);
            if (!this.isInline()) {
                this.hide();
            }
        },
        _bindElementEvents: function() {
            var self = this;
            this.element.on("focus" + EVENT_NS, function(event) {
                self.show();
                event.stopPropagation();
            });
            if (this.hasComponent()) {
                this.component.on("click" + EVENT_NS, function(event) {
                    event.preventDefault();
                    self.toggle();
                });
            }
            if (this.hasInput()) {
                this.input.on("input" + EVENT_NS + " change" + EVENT_NS, function() {
                    var current = $(this).val();
                    self.update(current, true);
                    self._updateFormGroupStatus(self.getValid(current) !== false);
                    if (self.options.inputSearch && (self._visible || self.isInline())) {
                        window.clearTimeout(self._inputSearchTimer);
                        self._inputSearchTimer = nextTick(function() {
                            self.filter(current);
                        }, self.options.searchDebounce);
                    }
                });
            }
        },
        _containsEvent: function(event) {
            var target = event.target;
            if (!target) {
                return false;
            }
            if (this.element.is(target) || this.element.has(target).length) {
                return true;
            }
            if (this.container.is(target) || this.container.has(target).length) {
                return true;
            }
            if (this.popover && this.popover.length && (this.popover.is(target) || this.popover.has(target).length)) {
                return true;
            }
            return false;
        },
        _loadIcons: function() {
            var self = this;
            if (!this.options.iconsUrl || this._iconsLoaded || this._iconsLoading) {
                return this._iconsLoading;
            }
            this._iconsLoading = IconStore.load(this.options.iconsUrl, this.options.iconsDataKey, this.options.cacheIcons !== false);
            this._iconsLoading.done(function(pack) {
                if (self._destroyed) {
                    return;
                }
                self._usePack(pack);
                self._iconsLoaded = true;
                self._iconsLoading = null;
                if (self.isInline() || self._visible) {
                    self.filter(self._lastFilter);
                }
                self._updateComponents();
                self._trigger("iconpickerIconsLoaded", {
                    iconCount: self._pack.icons.length
                });
            }).fail(function(error) {
                if (self._destroyed) {
                    return;
                }
                self._iconsLoading = null;
                self._trigger("iconpickerIconsLoadError", {
                    error: error
                });
            });
            return this._iconsLoading;
        },
        _hideFromSharedSwap: function() {
            if (!this._visible) {
                this._hideSequence++;
                SharedPopover.release(this, false);
                return;
            }
            this._hideSequence++;
            this._trigger("iconpickerHide", {
                iconpickerValue: this.iconpickerValue
            });
            this._visible = false;
            GlobalEventManager.remove(this);
            SharedPopover.release(this, false);
        },
        _updateComponents: function() {
            Renderer.updateSelection(this);
            if (!this.hasComponent()) {
                return;
            }
            var icon = this.component.find("i").first();
            if (icon.length) {
                icon.attr("class", safeClassName(this.options.fullClassFormatter(this.iconpickerValue)));
            } else {
                this.component.html(this.getHtml());
            }
        },
        _updateFormGroupStatus: function(valid) {
            if (!this.hasInput()) {
                return false;
            }
            this.input.parents(".form-group:first").toggleClass("has-error", valid === false);
            return true;
        },
        setIcons: function(icons) {
            this._usePack(IconStore.normalize(icons || [], this.options.cacheIcons !== false));
            this._iconsLoaded = true;
            if (this.isInline() || this._visible || this.options.renderOnInit) {
                this.filter(this._lastFilter);
            }
            this._updateComponents();
            return this._pack.icons;
        },
        filter: function(query) {
            this._ensureUi();
            return Renderer.renderIcons(this, query);
        },
        getValid: function(value) {
            if (!isString(value)) {
                value = "";
            }
            value = trim(value);
            if (!value) {
                return "";
            }
            if (this._pack.lookup[value]) {
                return value;
            }
            if (this.options.iconsUrl && !this._iconsLoaded) {
                return value;
            }
            return false;
        },
        setValue: function(value) {
            var valid = this.getValid(value);
            if (valid === false) {
                this._trigger("iconpickerInvalid", {
                    iconpickerValue: value
                });
                return false;
            }
            this.iconpickerValue = valid;
            this._trigger("iconpickerSetValue", {
                iconpickerValue: valid
            });
            return valid;
        },
        getHtml: function() {
            return '<i class="' + escapeHtml(safeClassName(this.options.fullClassFormatter(this.iconpickerValue))) + '"></i>';
        },
        setSourceValue: function(value) {
            var valid = this.setValue(value);
            if (valid === false) {
                return false;
            }
            if (this.hasInput()) {
                this.input.val(valid);
            } else {
                this.element.data("iconpickerValue", valid);
            }
            this._trigger("iconpickerSetSourceValue", {
                iconpickerValue: valid
            });
            return valid;
        },
        getSourceValue: function(defaultValue) {
            var fallback = defaultValue;
            if (fallback === undefined) {
                fallback = this.options.defaultValue;
            }
            var value = this.hasInput() ? this.input.val() : this.element.data("iconpickerValue");
            return isEmpty(value) ? fallback : value;
        },
        hasInput: function() {
            return !!(this.input && this.input.length);
        },
        isInputSearch: function() {
            return this.hasInput() && this.options.inputSearch === true;
        },
        isInputGroup: function() {
            return this.container.is(".input-group");
        },
        isDropdownMenu: function() {
            return this.container.is(".dropdown-menu");
        },
        hasSeparatedSearchInput: function() {
            return this.options.templates.search !== false && !this.isInputSearch();
        },
        hasComponent: function() {
            return !!(this.component && this.component.length);
        },
        hasContainer: function() {
            return !!(this.container && this.container.length);
        },
        getAcceptButton: function() {
            return this.popover && this.popover.length ? this.popover.find(".iconpicker-btn-accept") : $();
        },
        getCancelButton: function() {
            return this.popover && this.popover.length ? this.popover.find(".iconpicker-btn-cancel") : $();
        },
        getSearchInput: function() {
            return this.popover && this.popover.length ? this.popover.find(".iconpicker-search") : $();
        },
        show: function() {
            if (this._destroyed || this.isDisabled()) {
                return false;
            }
            if (this._visible && (!this._shared || SharedPopover.owner === this)) {
                return false;
            }
            this._ensureUi();
            this._hideSequence++;
            this._trigger("iconpickerShow", {
                iconpickerValue: this.iconpickerValue
            });
            if (!this._rendered) {
                this.filter(this._lastFilter);
            }
            this._loadIcons();
            this.updatePlacement();
            this.popover.addClass("in").css("display", this.isInline() ? "" : "block");
            this._visible = true;
            if (!this.isInline()) {
                GlobalEventManager.add(this);
            }
            var self = this;
            var sequence = this._hideSequence;
            nextTick(function() {
                if (self._destroyed || sequence !== self._hideSequence || !self._visible) {
                    return;
                }
                self._trigger("iconpickerShown", {
                    iconpickerValue: self.iconpickerValue
                });
            }, this.options.animation ? 300 : 0);
            return true;
        },
        hide: function() {
            if (this._destroyed || !this._visible) {
                return false;
            }
            if (this._shared && SharedPopover.owner !== this) {
                this._visible = false;
                GlobalEventManager.remove(this);
                return false;
            }
            this._hideSequence++;
            var sequence = this._hideSequence;
            var self = this;
            this._trigger("iconpickerHide", {
                iconpickerValue: this.iconpickerValue
            });
            this._visible = false;
            GlobalEventManager.remove(this);
            this.popover.removeClass("in");
            nextTick(function() {
                if (self._destroyed || sequence !== self._hideSequence || self._visible) {
                    return;
                }
                if (self._shared) {
                    SharedPopover.release(self, false);
                    return;
                }
                self.popover.css("display", "none");
                self.getSearchInput().val("");
                self._lastFilter = "";
                if (self.options.clearOnHide) {
                    Renderer.clearIcons(self);
                }
                self._trigger("iconpickerHidden", {
                    iconpickerValue: self.iconpickerValue
                });
            }, this.options.animation ? 300 : 0);
            return true;
        },
        toggle: function() {
            return this._visible ? this.hide() : this.show();
        },
        updatePlacement: function(placement, collision) {
            return Positioner.apply(this, placement, collision);
        },
        update: function(value, updateOnlyInternal) {
            if (value === undefined || value === null || value === false) {
                value = this.getSourceValue(this.iconpickerValue);
            }
            this._trigger("iconpickerUpdate", {
                iconpickerValue: this.iconpickerValue
            });
            var result = updateOnlyInternal === true ? this.setValue(value) : this.setSourceValue(value);
            if (updateOnlyInternal !== true) {
                this._updateFormGroupStatus(result !== false);
            }
            if (result !== false) {
                this._updateComponents();
            }
            this._trigger("iconpickerUpdated", {
                iconpickerValue: this.iconpickerValue
            });
            return result;
        },
        disable: function() {
            if (!this.hasInput()) {
                return false;
            }
            this.input.prop("disabled", true);
            return true;
        },
        enable: function() {
            if (!this.hasInput()) {
                return false;
            }
            this.input.prop("disabled", false);
            return true;
        },
        isDisabled: function() {
            return this.hasInput() ? this.input.prop("disabled") === true : false;
        },
        isInline: function() {
            return this.options.placement === "inline" || this.popover && this.popover.hasClass("inline");
        },
        destroy: function() {
            if (this._destroyed) {
                return;
            }
            this._trigger("iconpickerDestroy", {
                iconpickerValue: this.iconpickerValue
            });
            this._destroyed = true;
            this._visible = false;
            this._hideSequence++;
            window.clearTimeout(this._inputSearchTimer);
            GlobalEventManager.remove(this);
            GlobalEventManager.unregister();
            this.element.off(EVENT_NS).removeClass("iconpicker-element").removeData(DATA_KEY).removeData("iconpickerValue");
            if (this.hasInput()) {
                this.input.off(EVENT_NS).removeClass("iconpicker-input");
            }
            if (this.hasComponent()) {
                this.component.off(EVENT_NS);
            }
            if (this._shared) {
                if (SharedPopover.owner === this) {
                    SharedPopover.release(this, true);
                }
            } else if (this.popover && this.popover.length) {
                this.popover.off(EVENT_NS).remove();
            }
            this._trigger("iconpickerDestroyed", {
                iconpickerValue: this.iconpickerValue
            });
        }
    };
    IconPicker.defaultOptions = IconPicker.defaults;
    IconPicker.icons = IconStore.globalIcons;
    IconPicker.setIcons = function(icons) {
        IconPicker.icons = IconStore.setGlobal(icons || []);
        IconPicker.defaults.icons = IconPicker.icons;
        return IconPicker.icons;
    };
    IconPicker.clearIconCache = function(url) {
        IconStore.clearUrlCache(url);
    };
    IconPicker.batch = function(selector, method) {
        var args = Array.prototype.slice.call(arguments, 2);
        return $(selector).each(function() {
            var instance = $(this).data(DATA_KEY);
            if (instance && typeof instance[method] === "function") {
                instance[method].apply(instance, args);
            }
        });
    };
    $.iconpicker = IconPicker;
    $.fn.iconpicker = function(option) {
        var args = Array.prototype.slice.call(arguments, 1);
        var collection = this;
        var returnValue;
        this.each(function(index) {
            var element = $(this);
            var instance = element.data(DATA_KEY);
            if (!instance) {
                if (typeof option === "string") {
                    return;
                }
                instance = new IconPicker(this, option || {});
                element.data(DATA_KEY, instance);
            }
            if (typeof option === "string" && typeof instance[option] === "function") {
                var result = instance[option].apply(instance, args);
                if (index === 0 && result !== undefined && result !== instance) {
                    returnValue = result;
                }
            }
        });
        return returnValue === undefined ? collection : returnValue;
    };
    if (typeof window !== "undefined" && window.FontAwesomeIconPickerIcons) {
        IconPicker.setIcons(window.FontAwesomeIconPickerIcons);
    }
});
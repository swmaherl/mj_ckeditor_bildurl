/**
 * @file
 * Corrects CKEditor 5 toolbar checks in Backdrop 1.35.2.
 * No saved settings, editor runtime, or rendered content are changed here.
 */
(function ($, Backdrop) {
  'use strict';

  var filters = Backdrop.filterConfiguration;
  var admin = Backdrop.behaviors.ckeditor5Admin;
  if (!filters || !admin || admin.mjBildurlToolbarFix) {
    return;
  }
  admin.mjBildurlToolbarFix = true;

  var originalAll = filters.getAllFilterRules;
  var originalCombined = filters.getCombinedFilterRules;
  var originalAttach = admin.attach;

  function isCKEditor5Form() {
    return $('.ckeditor5-toolbar-configuration').length > 0;
  }

  function isActive(name) {
    // Read current form values, including changes since the last attach.
    // Status objects can still be uninitialized on the first attach.
    var inputs = document.getElementsByName('filters[' + name + '][status]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].type === 'checkbox') {
        return inputs[i].checked;
      }
    }
    return !!(filters.statuses[name] && filters.statuses[name].active);
  }

  filters.getAllFilterRules = function () {
    if (!isCKEditor5Form()) {
      return originalAll.apply(this, arguments);
    }
    var rules = [];
    var parsers = this.liveSettingParsers;
    Object.keys(parsers).forEach(function (name) {
      if (isActive(name)) {
        $.merge(rules, parsers[name].getRules());
      }
    });
    // Keep rules supplied by active filters without a live parser as well.
    Object.keys(this.statuses).forEach(function (name) {
      if (!parsers[name] && isActive(name)) {
        $.merge(rules, filters.statuses[name].rules);
      }
    });
    return rules;
  };

  filters.getCombinedFilterRules = function (rules) {
    if (!isCKEditor5Form()) {
      return originalCombined.apply(this, arguments);
    }
    rules = rules || this.getAllFilterRules();
    var combined = originalCombined.call(this, rules);
    // No allowlist means tags need no explicit permission. Preserve all deny
    // rules and attribute restrictions; an active empty allowlist stays empty.
    var hasAllowlist = rules.some(function (rule) {
      return rule.allow === true;
    });
    if (!hasAllowlist) {
      combined.allowedTags = ['*'];
    }
    return combined;
  };

  function normalizeRequirements(context) {
    $(context).find('.ckeditor5-toolbar-configuration [data-button-name]')
      .add($(context).filter('.ckeditor5-toolbar-configuration').find('[data-button-name]'))
      .each(function () {
        var $button = $(this);
        ['required-html', 'optional-html'].forEach(function (key) {
          // jQuery already parses normal JSON Unicode escapes. Do not decode
          // the raw attribute a second time or modify global jQuery.data().
          var value = $button.data(key);
          if (!Array.isArray(value)) {
            return;
          }
          var changed = false;
          var normalized = value.map(function (tag) {
            if (typeof tag !== 'string') {
              return tag;
            }
            var result = tag.replace(/\\u(003c|003e|0022|0027|0026)/gi, function (match, hex) {
              return String.fromCharCode(parseInt(hex, 16));
            });
            changed = changed || result !== tag;
            return result;
          });
          if (changed) {
            // Update both the data cache read by core and the attribute copied
            // by toolbar cloning. Never insert the decoded string as DOM HTML.
            $button.attr('data-' + key, JSON.stringify(normalized)).data(key, normalized);
          }
        });
      });
  }

  admin.attach = function (context, settings) {
    // Core creates the buttons synchronously, then checks them in a 10 ms
    // timer. Normalize immediately after creation, before that initial check.
    var result = originalAttach.apply(this, arguments);
    normalizeRequirements(context);
    return result;
  };
})(jQuery, Backdrop);

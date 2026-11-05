/** Regression tests against unmodified Backdrop 1.35.2 admin scripts.
 * npm install --prefix /tmp/mj-toolbar-tests jsdom jquery@3.7.1
 * NODE_PATH=/tmp/mj-toolbar-tests/node_modules node tests/toolbar-admin.test.cjs /path/to/core-scripts
 * Supply filter.admin.js, filter.filtered_html.admin.js and ckeditor5.admin.js.
 * DOM tests use jsdom; drag/drop layout and a running PHP CMS are not simulated.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const dir = process.argv[2];
if (!dir) throw Error('Supply a directory containing the Backdrop 1.35.2 admin scripts.');
const core = ['filter.admin.js', 'filter.filtered_html.admin.js', 'ckeditor5.admin.js'].map(f => fs.readFileSync(path.join(dir, f), 'utf8'));
const fix = fs.readFileSync(path.join(__dirname, '../js/toolbar-admin.js'), 'utf8');
let checks = 0;
function check(name, run) { run(); checks++; console.log('PASS ' + name); }
function env({ enabled = false, fixEnabled = true, doubled = false, aggregate = false, allowed = '<p> <img> <strong> <em>', names = ['fontColor', 'alignment:right', 'backdropImage'] } = {}) {
  const dom = new JSDOM('<form id="filter-admin-format-form"><div id="filter-order"><input class="form-checkbox" type="checkbox" name="filters[filter_html][status]"></div><input id="allowed-html"><div id="editor-settings-wrapper" class="ckeditor5-toolbar-configuration"><div class="form-item-editor-settings-toolbar"><textarea></textarea></div></div></form>', { runScripts: 'outside-only' });
  const w = dom.window, $ = jquery(w), timers = [], features = {};
  w.jQuery = $;
  w.Backdrop = { behaviors: {}, t: s => s, theme: function () {} };
  $.fn.once = function (id, cb) { const els = this.filter(function () { return !this.classList.contains(id + '-processed'); }).addClass(id + '-processed'); if (cb) els.each(cb); return els; };
  // jQuery UI supplies interaction only; core move handlers are tested separately.
  $.fn.sortable = $.fn.draggable = function () { return this; };
  w.setTimeout = cb => timers.push(cb);
  $('[name="filters[filter_html][status]"]').prop('checked', enabled);
  $('#allowed-html').val(allowed);
  function requirement(tag) {
    if (doubled) tag = tag.replace(/</g, '\\u003C').replace(/>/g, '\\u003E');
    return JSON.stringify([tag]);
  }
  const defs = { fontColor: '<span>', 'alignment:right': '<p class="text-align-right">', backdropImage: '<img src alt height width data-file-id>', bold: '<strong>', italic: '<em>' };
  const toolbar = $('<div class="ckeditor5-toolbar-active ckeditor5-active-toolbar-configuration"><div class="ckeditor5-row"><ul class="ckeditor5-buttons"></ul></div></div><div class="ckeditor5-toolbar-disabled"><ul class="ckeditor5-buttons"></ul></div>');
  names.forEach(name => toolbar.find('ul').first().append($('<li class="ckeditor5-button" tabindex="0">').attr('data-button-name', name).attr('data-required-html', requirement(defs[name]))));
  const settings = { ckeditor5: { toolbarAdmin: $('<div>').append(toolbar).html() } };
  $('textarea').val(JSON.stringify(names));
  const scripts = core.concat(fixEnabled ? [fix] : []);
  if (aggregate) w.eval(scripts.join('\n;\n')); else scripts.forEach(s => w.eval(s));
  const B = w.Backdrop;
  $(w.document).on('backdropEditorFeatureInit.test', (e, feature) => { features[feature.name] = feature; });
  function attach(context = w.document) { Object.values(B.behaviors).forEach(b => b.attach && b.attach(context, settings)); }
  function flush() { while (timers.length) timers.shift()(); }
  function active() { return $('.ckeditor5-toolbar-active [data-button-name]').map(function () { return $(this).data('button-name'); }).get(); }
  return { w, $, B, settings, attach, flush, active, features, timers, close: () => w.close() };
}
check('Normal JSON Unicode escapes are already decoded by jQuery', () => {
  const e = env();
  const b = e.$('<i>').attr('data-required-html', '["\\u003Cspan\\u003E"]');
  assert.equal(b.data('required-html')[0], '<span>'); e.close();
});
check('Unpatched core reproduces disabled-filter rules and lost fontColor', () => {
  const e = env({ fixEnabled: false }); e.attach(); e.flush();
  assert.ok(e.B.filterConfiguration.getCombinedFilterRules().properties['*'].forbidden.attributes.includes('style'));
  assert.ok(!e.active().includes('fontColor')); e.close();
});
check('Unpatched core rejects requirements with literal remaining Unicode escapes', () => {
  const e = env({ fixEnabled: false, doubled: true, allowed: '<p> <img> <span>' }); e.attach(); e.flush();
  assert.equal(e.active().length, 0); e.close();
});
for (const aggregate of [false, true]) for (const doubled of [false, true]) {
  check(`Disabled HTML filter preserves all three buttons (aggregate=${aggregate}, doubled=${doubled})`, () => {
    const e = env({ aggregate, doubled }); e.attach(); e.flush();
    assert.deepEqual(e.active(), ['fontColor', 'alignment:right', 'backdropImage']);
    assert.deepEqual(Object.keys(e.B.filterConfiguration.getCombinedFilterRules().properties), []);
    assert.equal(e.features.fontColor.rules[0].tags[0], 'span');
    assert.equal(e.features['alignment:right'].rules[0].tags[0], 'p');
    const saved = JSON.parse(e.$('textarea').val());
    const next = env({ names: saved, aggregate, doubled }); next.attach(); next.flush();
    assert.deepEqual(next.active(), saved); next.close(); e.close();
  });
}
check('Active HTML allowlist still removes span and p buttons, keeps image', () => {
  const e = env({ enabled: true, doubled: true, allowed: '<img>' }); e.attach(); e.flush();
  assert.deepEqual(e.active(), ['backdropImage']); e.close();
});
check('Active empty allowlist permits no required tags', () => {
  const e = env({ enabled: true, allowed: '' }); e.attach(); e.flush();
  assert.equal(e.active().length, 0); e.close();
});
check('Active HTML filter still rejects required style attributes', () => {
  const e = env({ enabled: true, allowed: '<span>' }); e.attach(); e.flush();
  const feature = new e.B.EditorFeature('needsStyle');
  feature.addHTMLRule(new e.B.EditorFeatureHTMLRule({ required: true, tags: ['span'], attributes: ['style'] }));
  assert.equal(e.B.editorConfiguration.featureIsAllowed(feature, e.B.filterConfiguration.getCombinedFilterRules()), false); e.close();
});
check('Checkbox changes immediately change collected rules', () => {
  const e = env(); e.attach(); e.flush();
  assert.deepEqual(Array.from(e.B.filterConfiguration.getCombinedFilterRules().allowedTags), ['*']);
  e.$('[name="filters[filter_html][status]"]').prop('checked', true);
  assert.ok(e.B.filterConfiguration.getCombinedFilterRules().properties['*']);
  e.$('[name="filters[filter_html][status]"]').prop('checked', false);
  assert.equal(e.B.filterConfiguration.getAllFilterRules().length, 0); e.close();
});
check('Active third-party deny rules remain effective without an allowlist', () => {
  const e = env(); e.attach(); e.flush();
  const s = new e.B.FilterStatus('custom'); s.active = true;
  const rule = new e.B.FilterHTMLRule(); rule.tags = ['span']; rule.allow = false; s.addHTMLRule(rule);
  e.B.filterConfiguration.statuses.custom = s;
  assert.equal(e.B.editorConfiguration.featureIsAllowed(e.features.fontColor, e.B.filterConfiguration.getCombinedFilterRules()), false);
  assert.equal(e.B.editorConfiguration.featureIsAllowed(e.features.backdropImage, e.B.filterConfiguration.getCombinedFilterRules()), true); e.close();
});
check('Repeated behavior attachment and script evaluation do not duplicate initialization', () => {
  const e = env({ doubled: true }); let count = 0;
  e.$(e.w.document).on('backdropEditorFeatureInit.counter', () => count++);
  e.attach(); e.flush(); const before = count;
  const attach = e.B.behaviors.ckeditor5Admin.attach;
  e.w.eval(fix); assert.equal(e.B.behaviors.ckeditor5Admin.attach, attach);
  e.attach(); e.flush(); assert.equal(count, before);
  assert.equal(e.$('.ckeditor5-toolbar-active').length, 1); e.close();
});
check('AJAX replacement initializes and normalizes a new editor-settings subtree', () => {
  const e = env({ doubled: true }); e.attach(); e.flush();
  e.$('#editor-settings-wrapper').replaceWith('<div id="editor-settings-wrapper"><div class="ckeditor5-toolbar-configuration"><div class="form-item-editor-settings-toolbar"><textarea></textarea></div></div></div>');
  e.attach(e.$('#editor-settings-wrapper')[0]); e.flush();
  assert.deepEqual(e.active(), ['fontColor', 'alignment:right', 'backdropImage']); e.close();
});
check('Keyboard move updates the textarea and survives simulated reload', () => {
  const e = env({ names: ['bold', 'italic', 'fontColor'] }); e.attach(); e.flush();
  e.w.document.documentElement.dir = 'ltr';
  e.$('[data-button-name="italic"]').trigger(e.$.Event('keydown', { key: 'ArrowLeft' }));
  const saved = JSON.parse(e.$('textarea').val()); assert.deepEqual(saved, ['italic', 'bold', 'fontColor']);
  const next = env({ names: saved }); next.attach(); next.flush(); assert.deepEqual(next.active(), saved); next.close(); e.close();
});
check('Optional double-escaped requirements are normalized as well', () => {
  const e = env(); e.attach(); e.flush();
  const b = e.$('[data-button-name="fontColor"]'); b.attr('data-optional-html', JSON.stringify(['\\u003Cspan\\u003E']));
  e.attach(); assert.equal(b.data('optional-html')[0], '<span>'); e.close();
});
check('Outside CKEditor 5 configuration, original rule collection is used', () => {
  const e = env(); e.attach(); e.flush(); e.$('.ckeditor5-toolbar-configuration').remove();
  assert.ok(e.B.filterConfiguration.getCombinedFilterRules().properties['*']); e.close();
});
console.log(`${checks} checks passed. No live Backdrop/PHP integration test performed.`);

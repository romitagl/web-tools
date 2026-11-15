import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { transformWithOxc } from 'vite';
import { readFileSync } from 'node:fs';
import React, { act } from 'react';

import { MemoryRouter } from 'react-router-dom';

let createRoot;
let bootstrap;
let Home;
let Navigation;
let Layout;
async function component(name) {
  const filename = new URL(`../../src/components/${name}.jsx`, import.meta.url);
  const result = await transformWithOxc(readFileSync(filename, 'utf8'), filename.pathname, { jsx: { runtime: 'automatic' } });
  const code = result.code.replace(/from (['"])([^'"]+)\1/g, (_, quote, specifier) => {
    const resolved = specifier.startsWith('.')
      ? new URL(specifier.endsWith('.js') ? specifier : `${specifier}.js`, filename).href
      : import.meta.resolve(specifier);
    return `from ${quote}${resolved}${quote}`;
  });
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
}
before(async () => {
  // Initialize React's DOM event plugins against a DOM, as in the browser.
  bootstrap = new JSDOM('<!doctype html><body></body>');
  globalThis.window = bootstrap.window;
  globalThis.document = bootstrap.window.document;
  ({ createRoot } = await import('react-dom/client'));
  Home = await component('Home');
  Navigation = await component('SiteNavigation');
  Layout = await component('Layout');
});
after(() => { bootstrap?.window.close(); });

async function mount(element) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(MemoryRouter, null, element)));
  return {
    doc: dom.window.document,
    win: dom.window,
    async close() {
      await act(async () => root.unmount());
      dom.window.close();
      delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    },
  };
}

test('catalog search and category filters preserve recovery from an empty result', async () => {
  const view = await mount(React.createElement(Home));
  try {
    assert.equal(view.doc.querySelectorAll('.catalog-card').length, 9);
    const documents = [...view.doc.querySelectorAll('.catalog-filters button')].find(button => button.textContent.startsWith('Documents'));
    await act(async () => documents.click());
    assert.equal(view.doc.querySelectorAll('.catalog-card').length, 2);
    const input = view.doc.querySelector('input[type=search]');
    // Use the native setter so React's input tracking receives a real edit.
    await act(async () => {
      Object.getOwnPropertyDescriptor(view.win.HTMLInputElement.prototype, 'value').set.call(input, 'not-a-tool');
      input.dispatchEvent(new view.win.Event('input', { bubbles: true }));
    });
    assert.equal(view.doc.querySelectorAll('.catalog-card').length, 0);
    assert.ok(view.doc.querySelector('.catalog-empty'));
    assert.equal(documents.getAttribute('aria-pressed'), 'true');
    await act(async () => view.doc.querySelector('.catalog-empty button').click());
    assert.equal(view.doc.querySelectorAll('.catalog-card').length, 9);
  } finally { await view.close(); }
});

test('tool navigation exposes all routes and closes its mobile menu on selection', async () => {
  const view = await mount(React.createElement(Navigation));
  try {
    const toggle = view.doc.querySelector('.tools-menu-toggle');
    await act(async () => toggle.click());
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    const nav = view.doc.querySelector('[aria-label="Tool navigation"]');
    const routes = [...nav.querySelectorAll('a')].filter(link => link.getAttribute('href').startsWith('/') && link.getAttribute('href') !== '/');
    assert.equal(routes.length, 9);
    await act(async () => routes[0].click());
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(routes[0].getAttribute('aria-current'), 'page');
    await act(async () => toggle.click());
    await act(async () => view.doc.dispatchEvent(new view.win.KeyboardEvent('keydown', { key: 'Escape' })));
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  } finally { await view.close(); }
});

test('shared tool layout provides one main landmark, one heading, and a working return link', async () => {
  const view = await mount(React.createElement(Layout, { title: 'Example tool', description: React.createElement('p', null, 'Tool instructions') }, React.createElement('button', null, 'Run task')));
  try {
    assert.equal(view.doc.querySelectorAll('main').length, 1);
    assert.equal(view.doc.querySelectorAll('h1').length, 1);
    assert.equal(view.doc.querySelector('h1').textContent, 'Example tool');
    assert.equal(view.doc.querySelector('.back-link').getAttribute('href'), '/');
    assert.ok(view.doc.querySelector('#main-content button'));
    assert.equal(view.doc.querySelectorAll('iframe').length, 0);
  } finally { await view.close(); }
});

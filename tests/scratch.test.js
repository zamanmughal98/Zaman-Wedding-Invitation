import test from 'node:test';
import assert from 'node:assert/strict';
import { initScratch } from '../src/features/scratch.js';
import { wedding } from '../config/wedding.js';

/** Small canvas model: resizing clears pixels and copying zero-size sources throws. */
function fixture(t, { width = 320, height = 200, canvasWidth = 300, canvasHeight = 150 } = {}) {
  const classes = new Set();
  const card = {
    clientWidth: width,
    clientHeight: height,
    classList: { add: (value) => classes.add(value), contains: (value) => classes.has(value) },
  };
  const canvases = [];
  class Canvas extends EventTarget {
    constructor(initialWidth = 300, initialHeight = 150) {
      super();
      this._width = initialWidth;
      this._height = initialHeight;
      this.coverage = 0;
      this.text = [];
      this.copies = 0;
      this.strokes = 0;
      const canvas = this;
      this.context = {
        globalCompositeOperation: 'source-over',
        setTransform() {},
        createLinearGradient: () => ({ addColorStop() {} }),
        fillRect() { canvas.coverage = 1; },
        strokeRect() {},
        fillText(text) { canvas.text.push({ text, direction: this.direction }); },
        save() { this.savedOperation = this.globalCompositeOperation; },
        restore() { this.globalCompositeOperation = this.savedOperation; },
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {
          canvas.strokes++;
          if (this.globalCompositeOperation === 'destination-out') canvas.coverage -= 0.1;
        },
        drawImage(source) {
          if (!source.width || !source.height)
            throw new DOMException('Canvas source has zero size.', 'InvalidStateError');
          canvas.copies++;
          canvas.coverage = this.globalCompositeOperation === 'destination-in'
            ? canvas.coverage * source.coverage : source.coverage;
        },
        getImageData(_x, _y, imageWidth, imageHeight) {
          if (!imageWidth || !imageHeight)
            throw new DOMException('Canvas has zero size.', 'IndexSizeError');
          const data = new Uint8ClampedArray(6400);
          for (let index = 0; index < 100; index++)
            data[index * 64 + 3] = index < Math.round(canvas.coverage * 100) ? 255 : 0;
          return { data };
        },
      };
      canvases.push(this);
    }
    get width() { return this._width; }
    set width(value) { this._width = value; this.coverage = 0; }
    get height() { return this._height; }
    set height(value) { this._height = value; this.coverage = 0; }
    getContext() { return this.context; }
    closest() { return card; }
    getBoundingClientRect() { return { left: 0, top: 0 }; }
    setPointerCapture() {}
  }
  const canvas = new Canvas(canvasWidth, canvasHeight);
  const button = new EventTarget();
  const status = { textContent: '' };
  const fonts = new EventTarget();
  fonts.ready = Promise.resolve();
  const doc = new EventTarget();
  doc.documentElement = { lang: 'en' };
  doc.fonts = fonts;
  doc.getElementById = () => canvas;
  doc.querySelector = (selector) => selector === '[data-reveal-date]' ? button : status;
  doc.createElement = () => new Canvas();
  const observers = [];
  class Observer {
    constructor(callback) { observers.push(callback); }
    observe() {}
  }
  const globals = {
    document: doc,
    ResizeObserver: Observer,
    getComputedStyle: () => ({ getPropertyValue: () => '#aa8866' }),
  };
  for (const [name, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => previous
      ? Object.defineProperty(globalThis, name, previous) : Reflect.deleteProperty(globalThis, name));
  }
  initScratch(wedding);
  function pointer(type) {
    const event = new Event(type);
    Object.assign(event, { clientX: 10, clientY: 10, pointerId: 1 });
    canvas.dispatchEvent(event);
  }
  return {
    canvas, card, button, status, fonts, doc, canvases, pointer,
    resize() { for (const callback of observers) callback(); },
  };
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('an initially hidden scratch card waits for a usable size through font and resize events', async (t) => {
  const f = fixture(t, { width: 0, height: 0, canvasWidth: 0, canvasHeight: 0 });
  await flush();
  f.resize();
  f.fonts.dispatchEvent(new Event('loadingdone'));
  f.pointer('pointerdown');
  f.pointer('pointerup');
  assert.equal(f.canvas.width, 0);
  assert.equal(f.canvas.height, 0);
  assert.equal(f.canvas.strokes, 0);
  assert.equal(f.canvases.length, 1);
  f.card.clientWidth = 320;
  f.card.clientHeight = 200;
  f.resize();
  assert.equal(f.canvas.width, 640);
  assert.equal(f.canvas.height, 400);
  assert.equal(f.canvas.coverage, 1);
});

test('hidden and later font redraws preserve scratched progress and Urdu rendering', async (t) => {
  const f = fixture(t);
  await flush();
  f.pointer('pointerdown');
  f.pointer('pointerup');
  const coverage = f.canvas.coverage;
  const size = [f.canvas.width, f.canvas.height];
  assert.equal(coverage, 0.9);
  assert.equal(f.card.classList.contains('is-revealed'), false);
  f.card.clientWidth = 0;
  f.card.clientHeight = 0;
  f.resize();
  f.fonts.dispatchEvent(new Event('loadingdone'));
  f.doc.documentElement.lang = 'ur';
  f.doc.dispatchEvent(new Event('wedding:language'));
  assert.deepEqual([f.canvas.width, f.canvas.height], size);
  assert.equal(f.canvas.coverage, coverage);
  f.card.clientWidth = 280;
  f.card.clientHeight = 200;
  f.resize();
  f.fonts.dispatchEvent(new Event('loadingdone'));
  assert.equal(f.canvas.width, 560);
  assert.equal(f.canvas.coverage, coverage);
  assert.ok(f.canvas.text.some(({ text, direction }) => direction === 'rtl' && /[\u0600-\u06ff]/.test(text)));
  // Previously erased pixels still count toward the reveal threshold.
  f.pointer('pointerdown');
  f.pointer('pointermove');
  f.pointer('pointerup');
  assert.equal(f.card.classList.contains('is-revealed'), true);
  assert.equal(f.button.disabled, true);
  assert.match(f.status.textContent, /2026/);
});

test('a canvas cleared externally to zero size can repaint without copying an invalid source', async (t) => {
  const f = fixture(t);
  await flush();
  f.canvas.width = 0;
  assert.doesNotThrow(() => f.resize());
  assert.equal(f.canvas.width, 640);
  assert.equal(f.canvas.height, 400);
  assert.equal(f.canvas.coverage, 1);
});

test('the tap-to-reveal alternative remains available while the scratch section is hidden', async (t) => {
  const f = fixture(t, { width: 0, height: 0 });
  await flush();
  f.button.dispatchEvent(new Event('click'));
  f.fonts.dispatchEvent(new Event('loadingdone'));
  assert.equal(f.card.classList.contains('is-revealed'), true);
  assert.equal(f.button.disabled, true);
  assert.match(f.status.textContent, /2026/);
});

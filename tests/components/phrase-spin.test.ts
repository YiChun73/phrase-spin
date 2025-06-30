import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitFor } from '@testing-library/dom';
import { PhraseSpinElement } from '../../src/components/phrase-spin';

describe('PhraseSpinElement', () => {
  function createElement(attrs: Record<string, string> = {}) {
    const el = new PhraseSpinElement();
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.body.appendChild(el);
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('should instantiate with default values', () => {
    const el = createElement();
    expect(el.phrases).toEqual([]);
    expect(el.animation).toBe('bounceIn');
    expect(el.speed).toBe(2000);
  });

  it('should accept phrases as comma-separated string', () => {
    const el = createElement({ phrases: 'A,B,C' });
    expect(el.phrases).toEqual(['A', 'B', 'C']);
  });

  it('should accept phrases as JSON string', () => {
    const el = createElement({ phrases: '["X","Y"]' });
    expect(el.phrases).toEqual(['X', 'Y']);
  });

  it('should fallback to comma-split if JSON is valid but not an array (string)', () => {
    const el = createElement({ phrases: '"foo,bar,baz"' }); // JSON string
    expect(el.phrases).toEqual(['foo', 'bar', 'baz']);
  });

  it('should fallback to empty array if JSON is valid but wrong type (object)', () => {
    const el = createElement({ phrases: '{"a": 1}' }); // JSON object
    expect(el.phrases).toEqual([]); // 因為不是 array 或 string
  });

  it('should fallback to comma-split if JSON parse fails (invalid JSON)', () => {
    const el = createElement({ phrases: 'foo,bar,baz' }); // 不是 JSON，直接 fallback
    expect(el.phrases).toEqual(['foo', 'bar', 'baz']);
  });

  it('should fallback to comma split if JSON parse fails', () => {
    const el = createElement({ phrases: '[not,json]' });
    expect(el.phrases).toEqual(['[not', 'json]']);
  });

  it('should accept animation and speed attributes', () => {
    const el = createElement({ animation: 'fadeIn', speed: '1234', phrases: 'A,B' });
    expect(el.animation).toBe('fadeIn');
    expect(el.speed).toBe(1234);
  });

  it('should cycle through phrases and dispatch event', async () => {
    vi.useFakeTimers();
    const el = createElement({ phrases: 'A,B' });
    const handler = vi.fn();
    el.addEventListener('animation-complete', handler);

    vi.runOnlyPendingTimers();
    await waitFor(() => expect(handler).toHaveBeenCalled());

    el['playAnimation']();
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));

    expect(['A', 'B']).toContain(el.phrases[el['currentIndex']]);
  });

  it('should not throw or dispatch if phrases is empty', () => {
    const el = createElement();
    const handler = vi.fn();
    el.addEventListener('animation-complete', handler);
    el['playAnimation']();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear interval on disconnectedCallback', () => {
    const el = createElement({ phrases: 'A,B' });
    const stopSpy = vi.spyOn(el, 'stop');
    el.disconnectedCallback();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should reset interval when start is called multiple times', () => {
    const el = createElement({ phrases: 'A,B' });
    const stopSpy = vi.spyOn(el, 'stop');
    el.start();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should update span text and add animation class on phrase change', async () => {
    const el = createElement({ phrases: 'Hello,World' });
    el.stop(); // 防止 interval 影響
    el['currentIndex'] = -1;

    el['playAnimation'](); // 第一次 → Hello
    await el.updateComplete;

    const span = el.shadowRoot?.querySelector('span');
    expect(span?.textContent).toBe('Hello');
    expect(span?.classList.contains('bounceIn')).toBe(true);

    el['playAnimation'](); // 第二次 → World
    await el.updateComplete;
    expect(span?.textContent).toBe('World');
  });
});
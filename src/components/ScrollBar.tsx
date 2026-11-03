'use client';

import { useEffect, useRef } from 'react';

// The page's own scrollbar: no track, a thin rounded thumb that fades out when idle and follows the theme. The browser's
// bar is hidden in globals.css (scrollbar-width: none), but native scrolling is untouched: wheel, touch, keyboard and
// find-in-page all work as before. This only draws the position and lets you drag it. Not shown on touch devices.
export function ScrollBar() {
  const bar = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const b = bar.current!;
    const t = thumb.current!;
    let frame = 0;
    let hide: ReturnType<typeof setTimeout>;
    let dragging = false;
    let startY = 0;
    let startTop = 0;

    const draw = () => {
      frame = 0;
      const view = root.clientHeight;
      const total = root.scrollHeight;
      const scrollable = total > view + 1;
      b.dataset.on = scrollable ? '1' : '0';
      if (!scrollable) return;
      const h = Math.max(44, (view * view) / total);
      const y = (root.scrollTop / (total - view)) * (view - h);
      t.style.height = `${h}px`;
      t.style.transform = `translateY(${y}px)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const reveal = () => {
      b.classList.add('live');
      clearTimeout(hide);
      hide = setTimeout(() => { if (!dragging) b.classList.remove('live'); }, 1200);
    };

    const onScroll = () => { schedule(); reveal(); };
    const onMove = (e: PointerEvent) => { if (innerWidth - e.clientX < 28) reveal(); }; // pointer near the right edge
    const down = (e: PointerEvent) => {
      dragging = true;
      startY = e.clientY;
      startTop = root.scrollTop;
      try { t.setPointerCapture(e.pointerId); } catch {} // keeps the drag going outside the thumb; not essential
      b.classList.add('live', 'drag');
      e.preventDefault();
    };
    const drag = (e: PointerEvent) => {
      if (!dragging) return;
      const view = root.clientHeight;
      const range = root.scrollHeight - view;
      const room = view - t.offsetHeight;
      if (room > 0) window.scrollTo({ top: startTop + ((e.clientY - startY) * range) / room, behavior: 'instant' });
    };
    const up = () => { dragging = false; b.classList.remove('drag'); reveal(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pointermove', onMove, { passive: true });
    const resize = new ResizeObserver(schedule); // content grows and shrinks (filters, accordions, route changes)
    resize.observe(document.body);
    t.addEventListener('pointerdown', down);
    t.addEventListener('pointermove', drag);
    t.addEventListener('pointerup', up);
    t.addEventListener('pointercancel', up);
    draw();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(hide);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pointermove', onMove);
      resize.disconnect();
      t.removeEventListener('pointerdown', down);
      t.removeEventListener('pointermove', drag);
      t.removeEventListener('pointerup', up);
      t.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <div ref={bar} className="sb" data-on="0" aria-hidden="true">
      <div ref={thumb} className="sb-thumb" />
    </div>
  );
}

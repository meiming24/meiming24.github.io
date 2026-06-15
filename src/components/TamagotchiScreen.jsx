import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import manifest from '../tamagotchi/p1DisplayManifest.json';
import { DISPLAY_OVERLAY_URL } from '../tamagotchi/paths';
import { isSegmentLit, VRAM_SIZE } from '../tamagotchi/vram';

const { lcd, segments } = manifest;

function segmentId(b, t) {
  return `${b}_${t}`;
}

const TamagotchiScreen = forwardRef(function TamagotchiScreen(_props, ref) {
  const hostRef = useRef(null);
  const segmentNodesRef = useRef(new Map());
  const latestVramRef = useRef(null);

  function applyVram(vram) {
    if (!vram || vram.length < VRAM_SIZE) {
      return;
    }

    const nodes = segmentNodesRef.current;
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i];
      const id = segmentId(seg.b, seg.t);
      const node = nodes.get(id);
      if (!node) {
        continue;
      }
      node.style.opacity = isSegmentLit(vram, seg.b, seg.t) ? '1' : '0';
    }
  }

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    async function loadOverlay() {
      const response = await fetch(DISPLAY_OVERLAY_URL);
      if (!response.ok || cancelled) {
        return;
      }

      const markup = await response.text();
      if (cancelled) {
        return;
      }

      host.innerHTML = markup;
      const svg = host.querySelector('svg');
      if (!svg) {
        return;
      }

      const nodes = new Map();
      for (let i = 0; i < segments.length; i += 1) {
        const seg = segments[i];
        const id = segmentId(seg.b, seg.t);
        const node = svg.querySelector(`#${CSS.escape(id)}`);
        if (node) {
          node.style.opacity = '0';
          nodes.set(id, node);
        }
      }
      segmentNodesRef.current = nodes;
      if (latestVramRef.current) {
        applyVram(latestVramRef.current);
      }
    }

    loadOverlay();

    return () => {
      cancelled = true;
      host.innerHTML = '';
      segmentNodesRef.current = new Map();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    drawVram(vram) {
      latestVramRef.current = vram;
      applyVram(vram);
    },
  }));

  return (
    <div
      ref={hostRef}
      className="tamagotchi-display-overlay"
      style={{ aspectRatio: `${lcd.w} / ${lcd.h}` }}
      aria-label="Tamagotchi screen"
    />
  );
});

export default TamagotchiScreen;

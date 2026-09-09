import {
  OVERLAY_DESIGN_W,
  OVERLAY_DESIGN_H,
  clampOverlayGeometry,
  defaultOverlayGeometry,
  fitOverlayBoxForIcons,
  overlayBoxPlacement,
  overlayDrawOrigin,
  geometryPxFromPreviewOffsets,
  isRightPlacement,
  placementFromPreviewOffsets,
  placementToDesignPx,
  previewOffsetsFromGeometryPx,
  resolveOverlayGeometry,
} from './placement';

describe('overlay placement + geometry', () => {
  it('maps top_right + 160×160 onto the backend 1920×1080 corner', () => {
    expect(placementToDesignPx('top_right', 160, 160)).toEqual({ x: 1696, y: 64 });
    expect(OVERLAY_DESIGN_W - 160 - 64).toBe(1696);
  });

  it('keeps explicit geometry_px when both x and y are present', () => {
    expect(
      resolveOverlayGeometry(
        { x: 1696, y: 64, width: 160, height: 160 },
        'top_right',
        { x: 64, y: 360, width: 160, height: 160 },
      ),
    ).toEqual({ x: 1696, y: 64, width: 160, height: 160 });
  });

  it('fills missing x/y from placement so icon_pop_in still lands top-right', () => {
    expect(
      resolveOverlayGeometry({ width: 160, height: 160 }, 'top_right', {
        x: 64,
        y: 360,
        width: 160,
        height: 160,
      }),
    ).toEqual({ x: 1696, y: 64, width: 160, height: 160 });
  });

  it('does not treat center/full_frame as a pin for icon overlays', () => {
    expect(overlayBoxPlacement('center', 'icon_pop_in')).toBeUndefined();
    expect(overlayBoxPlacement('full_frame', 'icon_sequence')).toBeUndefined();
    expect(overlayBoxPlacement('top_right', 'icon_pop_in')).toBe('top_right');
  });

  it('draws from motion when geometry resolved to the frame center', () => {
    const origin = overlayDrawOrigin(
      { x: 700, y: 460, width: 520, height: 160 },
      { startX: 1696, startY: 64, endX: 1696, endY: 64 },
      0,
    );
    expect(origin).toEqual({ x: 1696, y: 64 });
  });

  it('widens a single-icon box so 3 icons stay on the 1920 frame', () => {
    const fitted = fitOverlayBoxForIcons({ x: 1696, y: 64, width: 160, height: 160 }, 3);
    expect(fitted.width).toBeGreaterThanOrEqual(160 * 2);
    expect(fitted.x + fitted.width).toBeLessThanOrEqual(OVERLAY_DESIGN_W);
    expect(fitted.y).toBe(64);
  });

  it('treats top_right as a right-growing placement', () => {
    expect(isRightPlacement('top_right')).toBe(true);
    expect(isRightPlacement('top_left')).toBe(false);
  });

  it('maps preview offsets onto backend placement names', () => {
    expect(placementFromPreviewOffsets(50, 12)).toBe('bottom');
    expect(placementFromPreviewOffsets(84, 82)).toBe('top_right');
    expect(placementFromPreviewOffsets(16, 50)).toBe('center_left');
    expect(placementFromPreviewOffsets(50, 50)).toBe('center');
  });

  it('converts centered preview offsets into 1920×1080 geometry_px', () => {
    const geo = geometryPxFromPreviewOffsets(50, 12, 520, 160);
    expect(geo.width).toBe(520);
    expect(geo.height).toBe(160);
    expect(geo.x).toBe(Math.round(OVERLAY_DESIGN_W / 2 - 260));
    expect(geo.y).toBe(Math.round(OVERLAY_DESIGN_H - 0.12 * OVERLAY_DESIGN_H - 160));
  });

  it('converts geometry_px back into preview left/bottom percentages', () => {
    const offsets = previewOffsetsFromGeometryPx({ x: 800, y: 400, width: 320, height: 160 });
    expect(offsets.offsetX).toBeCloseTo(((800 + 160) / OVERLAY_DESIGN_W) * 100, 5);
    expect(offsets.offsetY).toBeCloseTo(((OVERLAY_DESIGN_H - (400 + 80)) / OVERLAY_DESIGN_H) * 100, 5);
  });

  it('clamps overlay geometry inside the design frame', () => {
    expect(clampOverlayGeometry({ x: -40, y: -20, width: 80, height: 60 })).toEqual({
      x: 0,
      y: 0,
      width: 80,
      height: 60,
    });
    const huge = clampOverlayGeometry({ x: 1800, y: 1000, width: 400, height: 300 });
    expect(huge.x + huge.width).toBeLessThanOrEqual(OVERLAY_DESIGN_W);
    expect(huge.y + huge.height).toBeLessThanOrEqual(OVERLAY_DESIGN_H);
  });
});

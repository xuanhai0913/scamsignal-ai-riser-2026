import {describe, expect, it} from 'vitest';
import {boundedImageDimensions, MAX_IMAGE_EDGE, MAX_IMAGE_PIXELS} from './image-privacy.js';

describe('image privacy bounds', () => {
  it('keeps small images and bounds large screenshots before provider transmission', () => {
    expect(boundedImageDimensions(800, 600)).toEqual({width: 800, height: 600});
    const large = boundedImageDimensions(6000, 4000);
    expect(Math.max(large.width, large.height)).toBeLessThanOrEqual(MAX_IMAGE_EDGE);
    expect(large.width * large.height).toBeLessThanOrEqual(MAX_IMAGE_PIXELS);
  });

  it('rejects invalid image dimensions', () => {
    expect(() => boundedImageDimensions(0, 100)).toThrow('Kích thước ảnh');
  });
});

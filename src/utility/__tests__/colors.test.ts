import { hexToRgba } from '../color';

it('returns the correct rgb color definition from a hex color', () => {
  expect(hexToRgba('F0F0F0')).toEqual('rgba(240,240,240,1)');
  expect(hexToRgba('F0F0F0', 10)).toEqual('rgba(240,240,240,10)');
});

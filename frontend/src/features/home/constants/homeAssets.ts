import shoppingScene from '../../../assets/images/home/shopping-scene.svg';

export const homeAssets = { hero: shoppingScene } as const;

// Presentation only: the API supplies category names/IDs but no artwork or stable slug.
// Unknown or renamed categories retain a neutral icon; links always use backend IDs.
export function categoryIcon(name: string): string {
  const label = name.toLocaleLowerCase('vi-VN');
  if (/công nghệ|điện tử/.test(label)) return 'headphones';
  if (/quần áo|thời trang/.test(label)) return 'handbag';
  if (/giày/.test(label)) return 'bag';
  if (/sưu tầm|nghệ thuật/.test(label)) return 'palette';
  if (/nhà cửa|đời sống/.test(label)) return 'house';
  if (/thể thao/.test(label)) return 'bicycle';
  if (/xe cộ/.test(label)) return 'car-front';
  return 'grid';
}

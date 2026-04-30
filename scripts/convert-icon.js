/**
 * Icon Conversion Script
 * 
 * This script provides instructions for converting the SVG icon to PNG.
 * Since we don't want to add heavy dependencies just for icon conversion,
 * this script guides the user through manual conversion options.
 */

const fs = require('fs');
const path = require('path');

const iconSvgPath = path.join(__dirname, '..', 'media', 'icon.svg');
const iconPngPath = path.join(__dirname, '..', 'media', 'icon.png');

console.log('=== 修仙模拟器图标转换工具 ===\n');

// Check if SVG exists
if (!fs.existsSync(iconSvgPath)) {
  console.error('❌ 错误: 找不到 icon.svg 文件');
  process.exit(1);
}

console.log('✅ 找到 SVG 图标:', iconSvgPath);

// Check if PNG exists
if (fs.existsSync(iconPngPath)) {
  console.log('✅ PNG 图标已存在:', iconPngPath);
  console.log('\n如需重新生成，请先删除现有的 icon.png 文件。\n');
} else {
  console.log('⚠️  PNG 图标不存在:', iconPngPath);
  console.log('\n请使用以下方法之一转换 SVG 到 PNG (128x128):\n');
  
  console.log('方法 1: 在线转换工具');
  console.log('  访问: https://cloudconvert.com/svg-to-png');
  console.log('  上传: media/icon.svg');
  console.log('  设置: 128x128 像素');
  console.log('  保存: media/icon.png\n');
  
  console.log('方法 2: 使用 Inkscape (如已安装)');
  console.log('  inkscape media/icon.svg --export-type=png --export-width=128 --export-height=128 --export-filename=media/icon.png\n');
  
  console.log('方法 3: 使用 ImageMagick (如已安装)');
  console.log('  convert -background none -resize 128x128 media/icon.svg media/icon.png\n');
  
  console.log('方法 4: 使用 VSCode');
  console.log('  1. 在 VSCode 中打开 icon.svg');
  console.log('  2. 使用 SVG 预览插件查看');
  console.log('  3. 截图并调整为 128x128 像素');
  console.log('  4. 保存为 icon.png\n');
  
  console.log('转换完成后，运行 npm run verify-icon 验证图标。\n');
}

// Provide icon requirements
console.log('图标要求:');
console.log('  - 格式: PNG');
console.log('  - 尺寸: 128x128 像素');
console.log('  - 背景: 透明或深色 (#1e1e1e)');
console.log('  - 文件大小: < 1MB (建议 < 100KB)\n');

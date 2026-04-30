# 图标说明

## 当前图标

- **icon.svg** - SVG 矢量图标（用于开发和设计）
- **icon.png** - PNG 位图图标（用于 VSCode 插件发布）

## 图标要求

VSCode Marketplace 要求：
- 格式：PNG
- 尺寸：128x128 像素（推荐）
- 背景：建议使用透明背景或与主题匹配的背景色

## 转换 SVG 到 PNG

如果需要重新生成 PNG 图标，可以使用以下方法：

### 方法 1：使用在线工具
1. 访问 https://cloudconvert.com/svg-to-png
2. 上传 icon.svg
3. 设置宽度和高度为 128 像素
4. 下载转换后的 icon.png

### 方法 2：使用 Inkscape（命令行）
```bash
inkscape icon.svg --export-type=png --export-width=128 --export-height=128 --export-filename=icon.png
```

### 方法 3：使用 ImageMagick
```bash
convert -background none -resize 128x128 icon.svg icon.png
```

### 方法 4：使用 Node.js (sharp)
```bash
npm install sharp
node -e "require('sharp')('icon.svg').resize(128, 128).png().toFile('icon.png')"
```

## 图标设计说明

当前图标设计元素：
- **背景**：深色圆形 (#1e1e1e)，与 VSCode 暗色主题匹配
- **主图案**：太极图案，象征修仙中的阴阳平衡
- **装饰**：剑的图案，代表修仙中的武力元素
- **文字**：底部的"修"字，直接表明修仙主题
- **配色**：青色 (#4ec9b0) 作为主色调，与 VSCode 的配色方案协调

## 修改图标

如需修改图标：
1. 编辑 icon.svg 文件
2. 使用上述方法重新生成 icon.png
3. 确保新图标在浅色和深色主题下都清晰可见
4. 测试不同尺寸下的显示效果（16x16, 32x32, 64x64, 128x128）

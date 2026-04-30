/**
 * 手动打包脚本
 * 由于 vsce 安装失败，使用此脚本手动创建 .vsix 包
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('🎁 开始手动打包插件...\n');

// 读取 package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const name = packageJson.name;
const vsixName = `${name}-${version}.vsix`;

console.log(`📦 插件名称: ${name}`);
console.log(`📌 版本号: ${version}`);
console.log(`📄 输出文件: ${vsixName}\n`);

// 检查必需文件
const requiredFiles = [
  'out/extension.js',
  'package.json',
  'README.md'
];

console.log('✅ 检查必需文件...');
let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} (缺失)`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n❌ 缺少必需文件！请先运行: npm run compile');
  process.exit(1);
}

// 创建 .vsix 文件（实际上是 ZIP 格式）
console.log('\n📦 正在创建 .vsix 文件...');

const output = fs.createWriteStream(vsixName);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\n✅ 打包完成！`);
  console.log(`📦 文件: ${vsixName}`);
  console.log(`📊 大小: ${sizeMB} MB`);
  console.log(`\n🎮 安装方法:`);
  console.log(`   code --install-extension ${vsixName}`);
  console.log(`\n或在 VSCode 中:`);
  console.log(`   1. 打开扩展面板 (Ctrl+Shift+X)`);
  console.log(`   2. 点击右上角 "..." 菜单`);
  console.log(`   3. 选择 "从 VSIX 安装..."`);
  console.log(`   4. 选择 ${vsixName}`);
});

archive.on('error', function(err) {
  console.error('❌ 打包失败:', err);
  process.exit(1);
});

archive.pipe(output);

// 添加文件到归档
console.log('\n📁 添加文件到包中...');

// 添加 extension 目录
if (fs.existsSync('out')) {
  archive.directory('out/', 'extension/out/');
  console.log('  ✓ out/');
}

// 添加 media 目录
if (fs.existsSync('media')) {
  archive.directory('media/', 'extension/media/');
  console.log('  ✓ media/');
}

// 添加 data 目录
if (fs.existsSync('data')) {
  archive.directory('data/', 'extension/data/');
  console.log('  ✓ data/');
}

// 添加必需文件
archive.file('package.json', { name: 'extension/package.json' });
console.log('  ✓ package.json');

if (fs.existsSync('README.md')) {
  archive.file('README.md', { name: 'extension/README.md' });
  console.log('  ✓ README.md');
}

if (fs.existsSync('CHANGELOG.md')) {
  archive.file('CHANGELOG.md', { name: 'extension/CHANGELOG.md' });
  console.log('  ✓ CHANGELOG.md');
}

if (fs.existsSync('LICENSE')) {
  archive.file('LICENSE', { name: 'extension/LICENSE' });
  console.log('  ✓ LICENSE');
}

// 创建 [Content_Types].xml
const contentTypes = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json"/>
  <Default Extension="vsixmanifest" ContentType="text/xml"/>
</Types>`;

archive.append(contentTypes, { name: '[Content_Types].xml' });

// 创建 extension.vsixmanifest
const manifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="zh-CN" Id="${name}" Version="${version}" Publisher="${packageJson.publisher || 'unknown'}"/>
    <DisplayName>${packageJson.displayName || name}</DisplayName>
    <Description>${packageJson.description || ''}</Description>
    <Tags></Tags>
    <Categories>${(packageJson.categories || []).join(',')}</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <License>extension/LICENSE</License>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code"/>
  </Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json"/>
  </Assets>
</PackageManifest>`;

archive.append(manifest, { name: 'extension.vsixmanifest' });

// 完成打包
archive.finalize();

/**
 * 清理脚本 - v2.6.0版本更新
 * 清除所有存档和缓存，确保新版本正常运行
 */

const fs = require('fs');
const path = require('path');

console.log('=== 修仙模拟器 v2.6.0 清理脚本 ===\n');

// VSCode的globalState存储在用户目录下
// 但我们无法直接访问，需要用户手动清理或通过扩展API清理

console.log('📋 清理说明：');
console.log('');
console.log('由于版本更新到 v2.6.0，建议清理旧版本的存档和缓存。');
console.log('');
console.log('清理方法：');
console.log('1. 在VSCode中打开命令面板（Ctrl+Shift+P 或 Cmd+Shift+P）');
console.log('2. 输入 "Developer: Reload Window" 重新加载窗口');
console.log('3. 如果仍有问题，可以尝试：');
console.log('   - 卸载扩展');
console.log('   - 删除 ~/.vscode/extensions 中的旧版本文件夹');
console.log('   - 重新安装扩展');
console.log('');
console.log('⚠️  注意：清理后所有存档将丢失！');
console.log('');

// 清理本地缓存文件（如果有）
const cacheDir = path.join(__dirname, '..', '.cache');
if (fs.existsSync(cacheDir)) {
  console.log('🗑️  清理本地缓存目录...');
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ 本地缓存已清理');
} else {
  console.log('ℹ️  没有找到本地缓存目录');
}

console.log('');
console.log('=== 清理完成 ===');
console.log('');
console.log('现在可以重新编译和测试扩展了。');
console.log('运行命令: npm run compile');

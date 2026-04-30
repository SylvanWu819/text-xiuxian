/**
 * 清理缓存和存档脚本
 * 用于版本更新后清理旧数据
 */

const fs = require('fs');
const path = require('path');

console.log('=== 开始清理缓存和存档 ===');

// 清理 out 目录（编译输出）
const outDir = path.join(__dirname, '..', 'out');
if (fs.existsSync(outDir)) {
  console.log('清理 out 目录...');
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log('✅ out 目录已清理');
} else {
  console.log('ℹ️  out 目录不存在，跳过');
}

// 清理 node_modules/.cache（如果存在）
const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  console.log('清理 node_modules/.cache 目录...');
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ node_modules/.cache 目录已清理');
} else {
  console.log('ℹ️  node_modules/.cache 目录不存在，跳过');
}

console.log('=== 清理完成 ===');
console.log('');
console.log('注意：VSCode 扩展的存档数据存储在 VSCode 的 globalState 中，');
console.log('需要在 VSCode 中手动清理或通过扩展的"重置成就"功能清理。');
console.log('');
console.log('如需完全清理，请：');
console.log('1. 在 VSCode 中卸载扩展');
console.log('2. 重新安装扩展');
console.log('或者在游戏中使用"重置成就"功能。');

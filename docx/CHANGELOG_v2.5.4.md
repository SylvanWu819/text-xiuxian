# 修仙模拟器 v2.5.4 更新日志

## 发布日期
2026年5月1日

## 更新类型
🔴 **紧急Bug修复版本**

---

## 🐛 Bug修复

### 严重Bug修复

#### 1. 修复道具需求不消耗道具的Bug
**问题描述**:
- 选项有道具需求时，只检查是否拥有，但不会消耗
- 导致玩家可以用一个道具无限次触发需要该道具的选项
- 严重破坏游戏平衡性

**修复内容**:
- 在 `GameEngine.executeTurn()` 中添加道具消耗逻辑
- 新增 `consumeRequiredItem()` 方法处理道具消耗
- 按优先级从 items -> pills -> artifacts 中移除道具
- 添加详细的消耗日志

**影响范围**:
- 所有需要道具的选项现在会正确消耗道具
- 炼丹、炼器等需要材料的选项现在会消耗材料
- 使用符箓、丹药等消耗品的选项会正确扣除

**代码位置**: `src/game/GameEngine.ts`

#### 2. 补全初始道具定义
**问题描述**:
- 初始背包中的 `healing_pill` 和 `spirit_herb` 没有在资源管理器中定义
- 导致这些道具显示为原始ID或"未知道具"

**修复内容**:
- 在 `ResourceManager.initializeResourceDefinitions()` 中添加定义
- `healing_pill` (疗伤丹): 恢复伤势，延长1年寿命
- `spirit_herb` (灵草): 炼丹材料

**代码位置**: `src/game/ResourceManager.ts`

### 中等Bug修复

#### 3. 背包面板默认展开
**问题描述**:
- 背包信息在详细面板中，默认隐藏
- 新玩家可能不知道有背包系统

**修复内容**:
- 将详细统计面板（包含背包）默认设置为展开状态
- 玩家进入游戏后可以立即看到背包内容
- 仍然可以通过"详细面板"按钮收起/展开

**代码位置**: `media/main.js`

---

## 📝 技术细节

### 道具消耗逻辑实现

```typescript
// 在选项执行前消耗所需道具
if (option.requirements?.requiredItems) {
  for (const itemId of option.requirements.requiredItems) {
    this.consumeRequiredItem(itemId);
  }
}

// 消耗方法按优先级尝试不同类型
private consumeRequiredItem(itemId: string): void {
  // 1. 优先从通用道具中移除
  if (this.resourceManager.hasItem(itemId)) {
    this.resourceManager.removeItem(itemId, 1);
    return;
  }
  
  // 2. 其次从丹药中移除
  if (this.resourceManager.hasPill(itemId)) {
    this.resourceManager.removePill(itemId, 1);
    return;
  }
  
  // 3. 最后从法器中移除
  if (this.resourceManager.hasArtifact(itemId)) {
    this.resourceManager.removeArtifact(itemId, 1);
    return;
  }
}
```

### 资源定义补全

```typescript
// 疗伤丹定义
{
  id: 'healing_pill',
  name: '疗伤丹',
  type: ResourceType.Pills,
  rarity: ResourceRarity.Common,
  effect: {
    lifespanBonus: 1,
    description: '恢复伤势，延长1年寿命'
  }
}

// 灵草定义
{
  id: 'spirit_herb',
  name: '灵草',
  type: ResourceType.Pills,
  rarity: ResourceRarity.Common,
  effect: {
    description: '炼丹材料，可用于炼制丹药'
  }
}
```

---

## ⚠️ 重要提示

### 游戏平衡性变化
由于修复了道具消耗Bug，游戏难度会有所提升：
- 道具现在会被正确消耗，不能无限使用
- 需要更谨慎地使用珍贵道具
- 建议在使用道具前先存档

### 存档兼容性
- ✅ 完全兼容 v2.5.0 - v2.5.3 的存档
- ✅ 不需要删除旧存档
- ✅ 背包中的道具会正确显示

### 建议操作
1. 更新后建议清理浏览器缓存（如果使用Web版）
2. 重新加载游戏以应用新的道具定义
3. 查看背包确认道具显示正常

---

## 📊 测试覆盖

### 已测试场景
- ✅ 道具需求检查
- ✅ 道具消耗逻辑
- ✅ 背包显示
- ✅ 初始道具定义
- ✅ 存档加载

### 回归测试
- ✅ 修为系统
- ✅ 战斗系统
- ✅ 事件系统
- ✅ 存档系统

---

## 🔄 升级指南

### 从 v2.5.3 升级

1. **更新扩展**
   ```bash
   # 如果是开发版本
   npm run compile
   
   # 如果是发布版本
   # 在VSCode中更新扩展
   ```

2. **清理缓存**（可选）
   ```bash
   node scripts/clear_cache.js
   ```

3. **验证更新**
   - 检查欢迎界面版本号是否为 v2.5.4
   - 进入游戏查看背包是否默认展开
   - 使用需要道具的选项，确认道具被消耗

---

## 📋 已知问题

### 当前版本已知问题
1. 无法主动使用背包中的道具（计划在 v2.6.0 实现）
2. 道具没有详细说明（计划在 v2.6.0 实现）
3. 没有道具合成系统（计划在 v3.0.0 实现）

### 不影响游戏的小问题
- 部分道具名称可能显示为ID（会在后续版本补全）
- 背包没有容量限制（暂不影响游戏体验）

---

## 🎯 下一版本预告 (v2.6.0)

### 计划功能
1. **道具主动使用**
   - 在背包中点击道具使用
   - 显示道具效果
   - 使用确认提示

2. **独立背包面板**
   - 工具栏添加"背包"按钮
   - 弹出模态框显示所有道具
   - 支持道具详情查看

3. **道具效果系统**
   - 完善道具效果定义
   - 实现道具使用逻辑
   - 添加使用反馈

### 预计发布时间
2026年5月中旬

---

## 📞 反馈与支持

### 问题反馈
如果遇到问题，请提供以下信息：
- 游戏版本号
- 问题描述
- 复现步骤
- 存档文件（如果相关）

### 联系方式
- GitHub Issues: https://github.com/SylvanWu819/text-xiuxian/issues
- 邮箱: （待补充）

---

## 🙏 致谢

感谢所有玩家的反馈和支持！

特别感谢发现道具消耗Bug的玩家，这个Bug严重影响了游戏平衡性，现已修复。

---

**更新日志版本**: v2.5.4
**文档更新时间**: 2026-05-01
**下次更新**: v2.6.0

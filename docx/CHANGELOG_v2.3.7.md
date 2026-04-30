# 修仙模拟器 v2.3.7 更新日志

## 发布日期
2026-05-01

## 改进内容

### 🌏 中文化增强
1. **添加更多中文化辅助函数**
   - 新增`getCultivationPathName()`：修行方向名称转换
   - 新增`getEventTypeName()`：事件类型名称转换
   - 新增`getFactionName()`：势力名称转换
   - 确保所有英文标识符都能正确显示为中文

2. **完善名称映射**
   - 修行方向：sword→剑修, body→体修, alchemy→丹修, formation→阵修
   - 事件类型：fortune→机缘, crisis→危机, npc→NPC遭遇, quest→任务, story→剧情
   - 势力：righteous_sect→正道宗门, demonic_sect→魔道宗门

### 🔧 技术改进
- 统一的中文化处理机制
- 防止英文标识符直接显示给用户
- 提供默认值处理，避免undefined显示

## 下一步计划
- 实现日志功能
- 优化面板显示（折叠功能）
- 增加更多消耗寿命的内容
- 实现背包和道具系统

# 调试：选项ID不匹配问题

## 问题描述
点击选项按钮后显示："无效的选项，请输入有效的选项编号"

## 可能的原因

### 1. 选项ID格式不匹配
前端发送的选项ID与后端生成的选项ID格式不一致。

### 2. 选项缓存失效
后端生成的选项没有正确缓存，导致验证时找不到选项。

### 3. 选项ID传递错误
前端在传递选项ID时可能有额外的空格或特殊字符。

## 调试步骤

### 步骤 1：查看浏览器控制台
1. 在 VSCode 中按 F5 启动调试
2. 在新窗口中打开"修仙模拟器"侧边栏
3. 按 F12 打开开发者工具
4. 切换到 Console 标签
5. 点击一个选项按钮
6. 查看控制台输出

**期望看到的日志：**
```
=== selectOption 被调用 ===
选择选项 ID: cultivate
选项 ID 类型: string
选项 ID 长度: 9
消息已发送到后端
```

### 步骤 2：查看 VSCode 调试控制台
1. 在原 VSCode 窗口中查看"调试控制台"
2. 查找以 `[GameEngine]` 开头的日志

**期望看到的日志：**
```
[GameEngine] executeTurn: 收到选项ID = "cultivate"
[GameEngine] 找到选项: 闭关修炼
```

**如果看到：**
```
[GameEngine] executeTurn: 收到选项ID = "cultivate"
[GameEngine] 选项未缓存，重新生成选项
[GameEngine] 生成了 6 个选项: ['cultivate', 'explore', 'view_status', ...]
[GameEngine] 找到选项: 闭关修炼
```

这说明选项缓存有问题。

**如果看到：**
```
[GameEngine] executeTurn: 收到选项ID = "cultivate"
[GameEngine] 选项未缓存，重新生成选项
[GameEngine] 生成了 6 个选项: ['cultivate', 'explore', 'view_status', ...]
[GameEngine] 找不到选项: "cultivate"
```

这说明选项ID不匹配。

### 步骤 3：检查选项渲染
在浏览器控制台中查看渲染的选项：

```javascript
// 查看所有选项按钮
document.querySelectorAll('.option-button').forEach(btn => {
  console.log('按钮:', btn.textContent.trim(), 'ID:', btn.getAttribute('data-option-id'));
});
```

**期望输出：**
```
按钮: 1 闭关修炼 ... ID: cultivate
按钮: 2 外出探索 ... ID: explore
按钮: 3 查看详细状态 ... ID: view_status
```

## 常见问题和解决方案

### 问题 1：选项ID有额外空格
**症状：** 日志显示 `选项ID = " cultivate "` （有空格）

**解决方案：** 在前端发送前 trim：
```javascript
vscode.postMessage({
  type: 'action',
  payload: { actionId: optionId.trim() }
});
```

### 问题 2：选项未缓存
**症状：** 每次点击都显示"选项未缓存，重新生成选项"

**解决方案：** 确保在游戏初始化后立即生成并缓存选项：
```typescript
// 在 initializeNewGame 中
this.gameEngine.generateOptions();
```

### 问题 3：选项ID大小写不匹配
**症状：** 前端发送 `Cultivate`，后端期望 `cultivate`

**解决方案：** 统一使用小写：
```javascript
const optionId = button.getAttribute('data-option-id').toLowerCase();
```

### 问题 4：选项在事件后未重新生成
**症状：** 触发事件后，选项缓存失效

**解决方案：** 在事件处理后重新生成选项：
```typescript
// 在 handleAction 中
const options = this.gameEngine.generateOptions();
this.messageBridge.sendToWebview({
  type: 'options',
  payload: options
});
```

## 验证修复

运行以下测试确认问题已解决：

```bash
# 运行选项系统测试
npm test -- --testNamePattern="OptionSystem"

# 运行游戏引擎测试
npm test -- --testNamePattern="GameEngine"
```

## 临时解决方案

如果问题仍然存在，可以尝试以下临时方案：

1. **重启调试会话**
   - 停止当前调试
   - 重新按 F5 启动

2. **清除缓存**
   - 在开发者工具中右键刷新按钮
   - 选择"清空缓存并硬性重新加载"

3. **检查编译输出**
   ```bash
   npm run compile
   ```
   确保没有编译错误

## 需要的信息

如果问题仍未解决，请提供：
1. 浏览器控制台的完整日志
2. VSCode 调试控制台的完整日志
3. 点击的是哪个选项按钮
4. 游戏当前状态（修为、时间等）

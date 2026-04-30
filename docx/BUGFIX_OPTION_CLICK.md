# Bug 修复：选项点击无响应

## 问题描述

用户点击游戏选项按钮后，无法进入下一步。选项按钮没有响应。

## 问题原因

在 `media/main.js` 的 `UIRenderer.renderOptions()` 方法中，选项按钮使用了内联事件处理器：

```javascript
<button class="option-button" 
        onclick="selectOption('${option.id}')" 
        ...>
```

由于 VSCode Webview 的 Content Security Policy (CSP) 限制，内联事件处理器（如 `onclick`）可能无法正常工作。CSP 策略在 `extension.ts` 中定义：

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               style-src ${webview.cspSource} 'unsafe-inline'; 
               script-src ${webview.cspSource};">
```

注意：`script-src` 中没有 `'unsafe-inline'`，这意味着内联事件处理器被禁止。

## 解决方案

将内联事件处理器改为使用事件委托（Event Delegation）：

### 修改前：

```javascript
return `
  <button class="option-button ${disabledClass}" 
          onclick="selectOption('${option.id}')" 
          ${disabledAttr}
          title="${disabled ? '不满足要求' : option.text}">
    ...
  </button>
`;
```

### 修改后：

```javascript
return `
  <button class="option-button ${disabledClass}" 
          data-option-id="${option.id}" 
          ${disabledAttr}
          title="${disabled ? '不满足要求' : option.text}">
    ...
  </button>
`;

// 在渲染完成后，使用事件委托添加事件监听器
const buttons = optionsSection.querySelectorAll('.option-button');
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const optionId = button.getAttribute('data-option-id');
    if (optionId && !button.disabled) {
      selectOption(optionId);
    }
  });
});
```

## 修改的文件

1. **media/main.js** - `UIRenderer.renderOptions()` 方法
   - 移除 `onclick` 内联事件处理器
   - 添加 `data-option-id` 属性存储选项 ID
   - 在渲染完成后使用 `addEventListener` 添加点击事件监听器

2. **media/test-uirenderer.html** - 测试文件
   - 更新 `selectOption` 函数定义，确保与新的事件委托方式兼容

## 优势

1. **符合 CSP 安全策略** - 不使用内联事件处理器
2. **更好的可维护性** - 事件处理逻辑与 HTML 结构分离
3. **更灵活** - 可以轻松添加更多事件处理逻辑
4. **更安全** - 避免潜在的 XSS 攻击风险

## 测试验证

运行以下命令验证修复：

```bash
# 编译代码
npm run compile

# 运行选项系统测试
npm test -- --testNamePattern="OptionSystem"
```

测试结果：✅ 所有测试通过（37 个测试）

## 使用说明

修复后，用户点击选项按钮时：

1. 点击事件被 `addEventListener` 捕获
2. 从 `data-option-id` 属性获取选项 ID
3. 检查按钮是否被禁用
4. 如果未禁用，调用 `selectOption(optionId)` 函数
5. `selectOption` 函数通过 `vscode.postMessage` 发送消息到后端
6. 后端处理选项选择并返回新的游戏状态

## 相关文件

- `media/main.js` - 前端主脚本
- `src/extension.ts` - 后端扩展入口
- `media/test-uirenderer.html` - UI 渲染器测试页面

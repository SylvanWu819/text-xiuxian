# Bug 修复：UI布局和显示问题

## 问题描述

从用户反馈的截图发现以下问题：

1. **修为显示错误**：显示 `qi_refining` 而不是中文"炼气期"
2. **开局剧情文字过长**：占据大量空间，阻挡选项按钮
3. **重复选择时文字不变**：一直选"闭关修炼"，开局剧情文字不变，观感不好
4. **滚动问题**：需要滚动到下面才能看到选项按钮

## 解决方案

### 1. 修复修为显示问题

**问题原因**：`state.cultivation.level` 返回的是枚举值（如 `qi_refining`）而不是中文名称。

**解决方法**：添加境界名称转换函数。

**文件：`media/main.js`**

```javascript
const UIRenderer = {
  /**
   * 获取修为境界中文名称
   */
  getCultivationLevelName(level) {
    const levelNames = {
      'qi_refining': '炼气期',
      'foundation_establishment': '筑基期',
      'golden_core': '金丹期',
      'nascent_soul': '元婴期',
      'soul_formation': '化神期',
      'void': '返虚期',
      'integration': '合体期',
      'mahayana': '大乘期',
      'tribulation': '渡劫期',
      'ascension': '飞升境界'
    };
    return levelNames[level] || level || '炼气期';
  },
  
  // 在 renderStats 中使用
  renderStats(state) {
    if (state.cultivation) {
      const level = this.getCultivationLevelName(state.cultivation.level);
      // ...
    }
  }
}
```

**效果**：
- ✅ 修为显示为 "炼气期 30/100" 而不是 "qi_refining 30/100"
- ✅ 所有境界都正确显示中文名称

### 2. 添加事件描述折叠功能

**问题原因**：开局剧情文字过长（超过200字符），占据大量空间。

**解决方法**：
1. 检测描述长度，超过200字符自动折叠
2. 添加"展开/收起"按钮
3. 折叠状态下限制高度为120px
4. 添加渐变遮罩效果

**文件：`media/main.js`**

```javascript
renderEvent(event) {
  // ...
  const isLongDescription = event.description.length > 200;
  
  if (isLongDescription) {
    descriptionElement.innerHTML = `
      <div class="event-description-content collapsed" id="event-desc-content">
        ${formattedDescription}
      </div>
      <button class="toggle-description-btn" id="toggle-desc-btn">
        <span class="toggle-icon">▼</span> 展开完整描述
      </button>
    `;
    
    // 添加折叠/展开功能
    toggleBtn?.addEventListener('click', () => {
      const isCollapsed = content.classList.contains('collapsed');
      if (isCollapsed) {
        content.classList.remove('collapsed');
        toggleBtn.innerHTML = '<span class="toggle-icon">▲</span> 收起描述';
      } else {
        content.classList.add('collapsed');
        toggleBtn.innerHTML = '<span class="toggle-icon">▼</span> 展开完整描述';
      }
    });
  }
}
```

**效果**：
- ✅ 长文本自动折叠，只显示前120px高度
- ✅ 底部渐变遮罩提示有更多内容
- ✅ 点击按钮可展开/收起
- ✅ 短文本（≤200字符）不显示折叠按钮

### 3. 选择选项后自动收起描述

**问题原因**：用户选择选项后，描述仍然展开，重复看到相同内容。

**解决方法**：在 `selectOption` 函数中自动收起描述。

**文件：`media/main.js`**

```javascript
function selectOption(optionId) {
  // 自动收起事件描述（如果是展开状态）
  const descContent = document.getElementById('event-desc-content');
  const toggleBtn = document.getElementById('toggle-desc-btn');
  if (descContent && !descContent.classList.contains('collapsed')) {
    descContent.classList.add('collapsed');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<span class="toggle-icon">▼</span> 展开完整描述';
    }
  }
  
  // 发送消息到后端
  vscode.postMessage({
    type: 'action',
    payload: { actionId: optionId }
  });
}
```

**效果**：
- ✅ 选择选项后，描述自动收起
- ✅ 避免重复看到相同的长文本
- ✅ 界面更简洁，选项更突出

### 4. 优化CSS布局

**文件：`media/style.css`**

#### 4.1 内容区域滚动

```css
.content {
  padding: 16px;
  flex: 1;
  max-width: 100%;
  overflow-y: auto;  /* 允许内容滚动 */
  overflow-x: hidden;
}
```

#### 4.2 减小事件描述间距

```css
.event-description {
  font-size: 14px;
  color: #d4d4d4;
  line-height: 1.6;  /* 从1.8减小到1.6 */
  margin-bottom: 8px;  /* 从12px减小到8px */
}
```

#### 4.3 折叠样式优化

```css
.event-description-content.collapsed {
  max-height: 120px;  /* 从150px减小到120px */
  overflow: hidden;
  position: relative;
}

.event-description-content.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;  /* 从50px减小到40px */
  background: linear-gradient(to bottom, transparent, #2d2d30);
  pointer-events: none;
}
```

#### 4.4 折叠按钮样式

```css
.toggle-description-btn {
  background-color: transparent;
  color: #4ec9b0;
  border: 1px solid #3e3e42;
  padding: 4px 10px;  /* 减小按钮大小 */
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;  /* 减小字体 */
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  width: fit-content;  /* 按钮宽度自适应 */
}

.toggle-description-btn:hover {
  background-color: #37373d;
  border-color: #4ec9b0;
}
```

**效果**：
- ✅ 内容区域可以滚动
- ✅ 减小行高和间距，更紧凑
- ✅ 折叠按钮更小巧
- ✅ 渐变遮罩匹配背景色

## 修改的文件

1. ✅ **media/main.js**
   - 添加 `getCultivationLevelName()` 方法
   - 修改 `renderStats()` 使用中文境界名称
   - 修改 `renderEvent()` 添加折叠功能
   - 修改 `selectOption()` 自动收起描述

2. ✅ **media/style.css**
   - 添加 `.event-description-content` 样式
   - 添加 `.event-description-content.collapsed` 样式
   - 添加 `.toggle-description-btn` 样式
   - 优化 `.content` 添加滚动
   - 优化 `.event-description` 减小间距

## 用户体验改进

### 修复前 ❌

- 修为显示为 "qi_refining 30/100"（不直观）
- 开局剧情占据大量空间，阻挡选项
- 需要滚动才能看到选项按钮
- 重复选择时看到相同的长文本

### 修复后 ✅

- 修为显示为 "炼气期 30/100"（清晰直观）
- 长文本自动折叠，只显示前120px
- 底部渐变提示有更多内容
- 点击按钮可展开/收起
- 选择选项后自动收起描述
- 界面更紧凑，选项更突出
- 内容区域可滚动

## 功能特性

### 1. 智能折叠

- 自动检测描述长度
- 超过200字符自动折叠
- 短文本不显示折叠按钮

### 2. 交互优化

- 点击按钮展开/收起
- 图标动画（▼ ↔ ▲）
- 选择选项后自动收起

### 3. 视觉优化

- 渐变遮罩提示
- 紧凑的间距
- 小巧的按钮
- 流畅的动画

## 测试建议

### 1. 修为显示测试

```bash
# 1. 启动游戏（F5）
# 2. 创建角色
# 3. 验证修为显示为 "炼气期 0/100"
# 4. 进行几回合修炼
# 5. 验证修为正确显示中文名称
```

### 2. 折叠功能测试

```bash
# 1. 开始新游戏
# 2. 查看开局剧情（长文本）
# 3. 验证：
#    - 文本自动折叠
#    - 显示"展开完整描述"按钮
#    - 底部有渐变遮罩
# 4. 点击按钮展开
# 5. 验证：
#    - 文本完全展开
#    - 按钮变为"收起描述"
# 6. 点击按钮收起
# 7. 验证文本重新折叠
```

### 3. 自动收起测试

```bash
# 1. 展开开局剧情
# 2. 选择一个选项（如"闭关修炼"）
# 3. 验证：
#    - 描述自动收起
#    - 新事件显示
# 4. 重复选择相同选项
# 5. 验证描述保持折叠状态
```

### 4. 短文本测试

```bash
# 1. 触发短文本事件（<200字符）
# 2. 验证：
#    - 文本完全显示
#    - 没有折叠按钮
#    - 没有渐变遮罩
```

## 技术细节

### 折叠逻辑

```javascript
// 检测长度
const isLongDescription = event.description.length > 200;

// 长文本：添加折叠功能
if (isLongDescription) {
  // 创建折叠容器和按钮
  // 绑定展开/收起事件
}

// 短文本：直接显示
else {
  descriptionElement.innerHTML = `<div class="event-description-content">${formattedDescription}</div>`;
}
```

### CSS渐变遮罩

```css
.event-description-content.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #2d2d30);
  pointer-events: none;  /* 不阻挡点击 */
}
```

### 自动收起逻辑

```javascript
function selectOption(optionId) {
  // 查找折叠元素
  const descContent = document.getElementById('event-desc-content');
  const toggleBtn = document.getElementById('toggle-desc-btn');
  
  // 如果展开状态，则收起
  if (descContent && !descContent.classList.contains('collapsed')) {
    descContent.classList.add('collapsed');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<span class="toggle-icon">▼</span> 展开完整描述';
    }
  }
  
  // 发送消息
  vscode.postMessage({ type: 'action', payload: { actionId: optionId } });
}
```

## 编译状态

✅ **编译成功** - 所有代码编译通过，无错误

## 总结

UI布局问题已全部修复：
- ✅ 修为正确显示中文名称
- ✅ 长文本自动折叠
- ✅ 展开/收起功能
- ✅ 选择后自动收起
- ✅ 优化间距和布局
- ✅ 改善滚动体验

用户现在可以享受更清晰、更紧凑、更流畅的游戏界面！

# 贡献指南

感谢你考虑为修仙模拟器做出贡献！

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 检查 [Issues](https://github.com/yourusername/cultivation-simulator/issues) 确认问题是否已被报告
2. 如果没有，创建一个新的 Issue，包含：
   - 清晰的标题和描述
   - 重现步骤
   - 预期行为和实际行为
   - 截图（如果适用）
   - 环境信息（VSCode 版本、操作系统等）

### 提出新功能

如果你有新功能的想法：

1. 先创建一个 Issue 讨论这个功能
2. 说明为什么这个功能有用
3. 如果可能，提供实现思路

### 提交代码

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/your-username/cultivation-simulator.git
   cd cultivation-simulator
   ```

3. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **进行修改**
   - 遵循现有代码风格
   - 添加必要的注释
   - 编写或更新测试

6. **运行测试**
   ```bash
   npm test
   npm run test:coverage
   ```

7. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   # 或
   git commit -m "fix: 修复某个问题"
   ```

8. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **创建 Pull Request**
   - 在 GitHub 上打开你的 Fork
   - 点击 "New Pull Request"
   - 填写 PR 描述，说明你的更改

## 代码规范

### TypeScript 风格

- 使用 TypeScript 严格模式
- 为所有函数添加类型注解
- 使用接口定义数据结构
- 避免使用 `any` 类型

### 命名规范

- 类名：PascalCase（如 `GameEngine`）
- 函数名：camelCase（如 `generateOptions`）
- 常量：UPPER_SNAKE_CASE（如 `MAX_LIFESPAN`）
- 私有成员：以下划线开头（如 `_privateMethod`）

### 注释规范

```typescript
/**
 * 函数描述
 * @param paramName 参数描述
 * @returns 返回值描述
 */
function exampleFunction(paramName: string): number {
  // 实现逻辑
}
```

### 提交信息规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: 添加新的修行方向
fix: 修复寿命计算错误
docs: 更新 README
```

## 测试要求

- 新功能必须包含单元测试
- Bug 修复应该包含回归测试
- 确保测试覆盖率不降低
- 所有测试必须通过

```bash
# 运行测试
npm test

# 查看覆盖率
npm run test:coverage
```

## 文档要求

- 更新相关的 README 部分
- 为新功能添加使用说明
- 更新 CHANGELOG.md

## 开发流程

1. **本地开发**
   ```bash
   npm run watch  # 监听文件变化
   ```

2. **调试**
   - 在 VSCode 中按 F5 启动调试
   - 在新窗口中测试你的更改

3. **测试**
   ```bash
   npm test
   ```

4. **编译**
   ```bash
   npm run compile
   ```

## 项目结构

```
src/
├── extension.ts          # 扩展入口
├── game/                 # 游戏逻辑
│   ├── GameEngine.ts    # 游戏引擎
│   ├── EventGenerator.ts # 事件生成
│   └── ...
├── types/               # 类型定义
└── utils/               # 工具函数

media/
├── main.js              # 前端逻辑
├── style.css            # 样式
└── ...

data/
├── events.json          # 事件数据
└── ...
```

## 添加新功能示例

### 1. 添加新的游戏系统

```typescript
// src/game/NewSystem.ts
export class NewSystem {
  constructor(private playerState: PlayerState) {}
  
  public doSomething(): void {
    // 实现逻辑
  }
}

// 在 GameEngine.ts 中集成
private newSystem: NewSystem;

initializeSubsystems(): void {
  this.newSystem = new NewSystem(this.playerState);
}
```

### 2. 添加新的事件类型

```json
// data/events.json
{
  "id": "new_event",
  "title": "新事件",
  "description": "事件描述",
  "type": "random",
  "triggerConditions": {
    "minCultivationLevel": "qi_refining"
  },
  "options": [...]
}
```

### 3. 添加测试

```typescript
// src/game/__tests__/NewSystem.test.ts
import { NewSystem } from '../NewSystem';

describe('NewSystem', () => {
  it('should do something', () => {
    // 测试逻辑
  });
});
```

## 需要帮助？

- 查看 [Issues](https://github.com/yourusername/cultivation-simulator/issues)
- 阅读现有代码
- 在 Issue 中提问

## 行为准则

- 尊重所有贡献者
- 保持友好和专业
- 接受建设性批评
- 关注项目目标

感谢你的贡献！🙏

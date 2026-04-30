# 需求文档：修仙模拟器

## 简介

修仙模拟器是一款运行在 VSCode 插件中的选项驱动型文字游戏。玩家扮演修仙者，通过在 Webview 侧边栏中选择行动选项来推进时间、提升修为、经历机缘、建立人脉，最终达成不同结局（飞升、成魔、建立宗门等）。游戏强调选择的长期影响、丰富的随机事件和多样的剧情分支。界面采用细长条页面设计，黑底白字，现代简洁的视觉风格。

## 术语表

- **Extension**: VSCode 扩展，提供游戏的宿主环境
- **Webview**: VSCode 的 Webview 面板，用于渲染游戏界面
- **UI_Renderer**: 界面渲染器，负责将游戏状态渲染为 HTML/CSS
- **Message_Bridge**: 消息桥接器，负责 Webview 和 Extension 后端之间的通信
- **Game_Engine**: 游戏引擎，负责管理游戏状态、事件触发和回合推进
- **Option_System**: 选项系统，负责生成和处理玩家的选项选择
- **Time_Manager**: 时间管理器，负责回合制时间推进（天/月/年）
- **Event_Generator**: 事件生成器，负责根据游戏状态生成随机事件
- **Story_Branch_Manager**: 剧情分支管理器，负责管理不同修行方向的剧情线
- **State_Tracker**: 状态追踪器，负责追踪玩家的资源、关系、因果等状态
- **Cultivation_Path**: 修行方向，如剑修、体修、丹修、阵修等
- **Karma_System**: 因果系统，追踪玩家的善恶行为
- **Tribulation_System**: 渡劫系统，基于历史选择触发心魔劫
- **Relationship_System**: 人脉系统，管理与NPC的关系
- **Faction_System**: 势力系统，管理宗门、魔道、散修等阵营
- **Fortune_System**: 机缘系统，处理随机奇遇、洞府、传承等
- **Resource_Manager**: 资源管理器，管理灵石、丹药、法器等
- **Lifespan_System**: 寿命系统，追踪剩余寿命和突破延寿
- **Reputation_System**: 声望系统，追踪正道和魔道声望
- **Ending_System**: 结局系统，根据游戏状态判定结局类型
- **Player_State**: 玩家状态，包含修为、资源、关系、因果等所有数据
- **Game_Turn**: 游戏回合，代表一个时间单位（天或月）
- **Event_Pool**: 事件池，存储所有可能触发的事件配置
- **NPC**: 非玩家角色，可以互动的角色
- **Save_System**: 存档系统，负责保存和加载游戏进度

## 需求

### 需求 1：选项选择系统

**用户故事：** 作为玩家，我想通过点击按钮或输入数字来选择行动选项，这样我可以简单直观地控制游戏进程。

#### 验收标准

1. WHEN 进入新回合，THE Option_System SHALL 显示 3-5 个可选行动选项
2. THE Option_System SHALL 为每个选项分配数字编号（1-5）
3. THE UI_Renderer SHALL 为每个选项渲染可点击的按钮
4. WHEN 玩家点击按钮或输入有效数字，THE Option_System SHALL 执行对应的行动
5. WHEN 玩家输入无效数字，THE Option_System SHALL 显示错误提示并重新请求输入
6. THE Option_System SHALL 根据 Player_State 动态生成可用选项（例如：灵石不足时隐藏或禁用购买选项）
7. WHEN 选项被执行，THE Option_System SHALL 更新 Player_State 并触发相应的游戏逻辑
8. THE Option_System SHALL 为每个选项显示简短描述（包括预期效果、消耗、风险等）

### 需求 2：开局修行方向选择

**用户故事：** 作为玩家，我想在游戏开始时选择修行方向，这样我可以体验不同的剧情线和玩法。

#### 验收标准

1. WHEN 游戏开始，THE Game_Engine SHALL 显示可选的 Cultivation_Path 列表（剑修/体修/丹修/阵修等）
2. THE Game_Engine SHALL 为每个 Cultivation_Path 显示特色描述和初始天赋
3. WHEN 玩家选择 Cultivation_Path，THE Game_Engine SHALL 初始化对应的剧情线和属性加成
4. THE Story_Branch_Manager SHALL 根据选择的 Cultivation_Path 加载不同的事件池和剧情分支
5. THE Game_Engine SHALL 为不同 Cultivation_Path 提供独特的选项和机缘类型

### 需求 3：回合制时间推进

**用户故事：** 作为玩家，我想游戏按回合推进时间，这样我可以感受到时间流逝和成长过程。

#### 验收标准

1. THE Time_Manager SHALL 以天或月为单位推进游戏时间
2. WHEN 玩家完成一个行动选择，THE Time_Manager SHALL 推进相应的时间量（不同行动消耗不同时间）
3. THE Time_Manager SHALL 在每个回合开始时显示当前时间（年/季节/月）
4. WHEN 时间推进，THE Lifespan_System SHALL 减少玩家剩余寿命
5. THE Time_Manager SHALL 根据时间触发季节性事件（如宗门大比、秘境开启等）
6. WHEN 达到特定时间节点，THE Time_Manager SHALL 触发剧情事件（如突破时机、渡劫等）

### 需求 4：随机事件生成系统

**用户故事：** 作为玩家，我想遇到各种随机事件，这样每次游玩都有不同的体验。

#### 验收标准

1. THE Event_Generator SHALL 从 Event_Pool 中根据权重随机选择事件
2. THE Event_Generator SHALL 根据 Player_State（修为、声望、因果等）过滤可触发的事件
3. WHEN 回合开始时，THE Event_Generator SHALL 有一定概率触发随机事件
4. THE Event_Generator SHALL 支持多种事件类型（机缘、危机、NPC遭遇、宗门任务等）
5. WHEN 事件触发，THE Event_Generator SHALL 显示事件描述并提供选项
6. THE Event_Generator SHALL 根据玩家选择应用事件结果（资源变化、关系变化、因果变化等）
7. THE Event_Generator SHALL 支持事件链（一个事件触发后续事件）

### 需求 5：机缘系统

**用户故事：** 作为玩家，我想遇到各种机缘（洞府、奇遇、传承、宝物），这样我可以获得意外的收获和成长机会。

#### 验收标准

1. THE Fortune_System SHALL 管理洞府、奇遇、传承、宝物等机缘类型
2. WHEN 玩家选择探索行动，THE Fortune_System SHALL 有概率触发机缘事件
3. THE Fortune_System SHALL 根据玩家的修为和运气属性调整机缘触发概率
4. WHEN 机缘触发，THE Fortune_System SHALL 提供选项（进入/放弃、探索深度等）
5. THE Fortune_System SHALL 为机缘设置风险和收益（高风险高回报）
6. WHEN 玩家获得传承或宝物，THE Fortune_System SHALL 更新 Player_State 并解锁新能力或选项

### 需求 6：剧情分支管理

**用户故事：** 作为玩家，我想体验丰富的剧情分支，这样不同的选择会导向不同的故事发展。

#### 验收标准

1. THE Story_Branch_Manager SHALL 根据 Cultivation_Path 加载对应的主线剧情
2. THE Story_Branch_Manager SHALL 追踪玩家的关键选择（救人/杀人、加入势力、师徒关系等）
3. WHEN 玩家做出关键选择，THE Story_Branch_Manager SHALL 标记剧情分支点并影响后续事件
4. THE Story_Branch_Manager SHALL 支持多条并行的支线剧情
5. THE Story_Branch_Manager SHALL 根据剧情进度解锁特定事件和选项
6. WHEN 剧情条件满足，THE Story_Branch_Manager SHALL 触发剧情事件（如师门任务、仇敌复仇等）

### 需求 7：因果抉择机制

**用户故事：** 作为玩家，我想我的选择有长期影响，这样我会更谨慎地做决定并承担后果。

#### 验收标准

1. THE Karma_System SHALL 追踪玩家的善恶行为（救人、杀人、背叛等）
2. WHEN 玩家做出善行，THE Karma_System SHALL 增加善缘值
3. WHEN 玩家做出恶行，THE Karma_System SHALL 增加因果债值
4. THE Karma_System SHALL 影响后续事件的触发（高善缘触发贵人相助，高因果债触发仇敌追杀）
5. THE Karma_System SHALL 影响 NPC 对玩家的态度
6. WHEN 渡劫时，THE Tribulation_System SHALL 根据因果债增加心魔劫难度

### 需求 8：心魔渡劫系统

**用户故事：** 作为玩家，我想在突破时面对心魔劫，这样我的历史选择会以挑战的形式回归。

#### 验收标准

1. WHEN 玩家修为达到突破阈值，THE Tribulation_System SHALL 触发渡劫事件
2. THE Tribulation_System SHALL 根据 Karma_System 的因果债生成心魔内容
3. THE Tribulation_System SHALL 显示心魔场景（基于玩家的历史选择，如被杀者的怨念）
4. THE Tribulation_System SHALL 提供渡劫选项（直面心魔、压制心魔、借助外力等）
5. WHEN 渡劫成功，THE Tribulation_System SHALL 提升玩家修为并延长寿命
6. WHEN 渡劫失败，THE Tribulation_System SHALL 应用惩罚（修为受损、寿命减少、走火入魔等）
7. THE Tribulation_System SHALL 支持不同类型的劫难（天劫、心魔劫、因果劫等）

### 需求 9：人脉与势力博弈系统

**用户故事：** 作为玩家，我想与 NPC 建立关系并参与势力博弈，这样我可以获得支持或面对敌对。

#### 验收标准

1. THE Relationship_System SHALL 追踪玩家与每个 NPC 的关系值（-100 到 +100）
2. WHEN 玩家与 NPC 互动，THE Relationship_System SHALL 根据选择调整关系值
3. THE Relationship_System SHALL 影响 NPC 的行为（高关系值提供帮助，低关系值敌对）
4. THE Faction_System SHALL 管理宗门、魔道、散修等势力
5. WHEN 玩家加入势力，THE Faction_System SHALL 提供势力专属任务和资源
6. THE Faction_System SHALL 追踪势力间的关系（同盟、敌对、中立）
7. WHEN 玩家在势力间做出选择，THE Faction_System SHALL 影响其他势力的态度

### 需求 10：资源管理系统

**用户故事：** 作为玩家，我想管理灵石、丹药、法器等资源，这样我需要权衡资源的获取和使用。

#### 验收标准

1. THE Resource_Manager SHALL 追踪玩家的灵石、丹药、法器等资源数量
2. WHEN 玩家执行需要资源的行动，THE Resource_Manager SHALL 检查资源是否充足
3. WHEN 资源不足，THE Option_System SHALL 禁用或标记需要该资源的选项
4. THE Resource_Manager SHALL 支持资源的获取（任务奖励、交易、掠夺等）
5. THE Resource_Manager SHALL 支持资源的消耗（修炼、购买、炼制等）
6. THE Resource_Manager SHALL 为不同资源设置稀有度和效果（普通丹药 vs 灵丹）

### 需求 11：寿命系统

**用户故事：** 作为玩家，我想感受到时间的紧迫感，这样我需要在有限的寿命内达成目标。

#### 验收标准

1. THE Lifespan_System SHALL 初始化玩家寿命（如 80 年）
2. WHEN 时间推进，THE Lifespan_System SHALL 减少剩余寿命
3. THE Lifespan_System SHALL 在每回合显示剩余寿命
4. WHEN 玩家突破修为，THE Lifespan_System SHALL 延长寿命（如炼气期 80 年，筑基期 150 年）
5. WHEN 寿命耗尽，THE Game_Engine SHALL 触发坐化结局
6. THE Lifespan_System SHALL 支持延寿手段（灵丹、秘法等）

### 需求 12：声望系统

**用户故事：** 作为玩家，我想建立正道或魔道声望，这样我可以影响 NPC 的态度和可用选项。

#### 验收标准

1. THE Reputation_System SHALL 追踪玩家的正道声望和魔道声望（0-100）
2. WHEN 玩家做出正道行为，THE Reputation_System SHALL 增加正道声望
3. WHEN 玩家做出魔道行为，THE Reputation_System SHALL 增加魔道声望
4. THE Reputation_System SHALL 影响 NPC 的初始态度（正道 NPC 敌视高魔道声望玩家）
5. THE Reputation_System SHALL 影响可用选项（高正道声望解锁正道宗门任务）
6. THE Reputation_System SHALL 影响结局类型（高魔道声望导向成魔结局）

### 需求 13：结局分支系统

**用户故事：** 作为玩家，我想根据我的选择达成不同的结局，这样我的游玩过程有明确的目标和意义。

#### 验收标准

1. THE Ending_System SHALL 支持多种结局类型（飞升、坐化、成魔、建立宗门、隐居等）
2. THE Ending_System SHALL 根据 Player_State 判定结局条件（修为、声望、因果、关系等）
3. WHEN 结局条件满足，THE Ending_System SHALL 触发结局事件
4. THE Ending_System SHALL 显示结局描述和玩家的最终成就
5. THE Ending_System SHALL 支持多结局并存（如成魔后飞升魔界）
6. THE Ending_System SHALL 记录玩家达成的结局类型供后续查看

### 需求 14：状态追踪系统

**用户故事：** 作为玩家，我想随时查看我的状态，这样我可以了解当前的修为、资源、关系等信息。

#### 验收标准

1. THE State_Tracker SHALL 维护完整的 Player_State（修为、资源、关系、因果、声望、寿命等）
2. THE State_Tracker SHALL 在每回合开始时显示关键状态信息
3. THE State_Tracker SHALL 提供查看详细状态的选项
4. WHEN Player_State 发生变化，THE State_Tracker SHALL 显示变化提示（如 +10 灵石，修为提升）
5. THE State_Tracker SHALL 追踪历史事件和关键选择供渡劫系统使用
6. THE State_Tracker SHALL 支持状态的序列化和反序列化（用于存档）

### 需求 15：数据驱动配置系统

**用户故事：** 作为开发者，我想通过 JSON 配置事件、剧情、NPC，这样我可以轻松扩展游戏内容而不修改代码。

#### 验收标准

1. THE Game_Engine SHALL 从 JSON 文件加载事件配置（事件描述、选项、结果、触发条件等）
2. THE Game_Engine SHALL 从 JSON 文件加载剧情配置（剧情线、分支点、条件等）
3. THE Game_Engine SHALL 从 JSON 文件加载 NPC 配置（名称、性格、初始关系、所属势力等）
4. THE Game_Engine SHALL 从 JSON 文件加载 Cultivation_Path 配置（名称、描述、初始属性、专属事件等）
5. WHEN 配置文件格式错误，THE Game_Engine SHALL 显示清晰的错误信息
6. THE Game_Engine SHALL 支持热重载配置文件（开发模式）

### 需求 16：存档系统

**用户故事：** 作为玩家，我想保存和加载游戏进度，这样我可以随时中断和继续游戏。

#### 验收标准

1. THE Save_System SHALL 提供保存游戏的选项
2. WHEN 玩家选择保存，THE Save_System SHALL 将完整的 Player_State 和游戏状态序列化到文件
3. THE Save_System SHALL 在游戏启动时检测存档文件
4. WHEN 存档存在，THE Save_System SHALL 提供继续游戏或新游戏的选项
5. WHEN 玩家选择继续游戏，THE Save_System SHALL 加载存档并恢复游戏状态
6. THE Save_System SHALL 支持多个存档槽位（如 3 个存档位）
7. WHEN 存档文件损坏，THE Save_System SHALL 显示错误信息并提供新游戏选项

### 需求 17：游戏界面显示

**用户故事：** 作为玩家，我想看到清晰美观的游戏界面，这样我可以快速了解当前状态和可用选项。

#### 验收标准

1. THE UI_Renderer SHALL 在 VSCode Webview 侧边栏中渲染游戏界面
2. THE UI_Renderer SHALL 使用细长条页面布局（适配侧边栏宽度）
3. THE UI_Renderer SHALL 使用黑底白字的配色方案
4. THE UI_Renderer SHALL 在每回合显示回合标题（如 "第1年 春季"）
5. THE UI_Renderer SHALL 显示玩家的核心状态（修为、灵石、寿命、声望等）
6. THE UI_Renderer SHALL 显示当前可选行动列表（编号 + 按钮 + 描述）
7. THE UI_Renderer SHALL 在选项描述中包含关键信息（消耗、风险、预期效果）
8. WHEN 事件触发，THE UI_Renderer SHALL 显示事件描述和相关选项
9. THE UI_Renderer SHALL 使用现代简洁的 CSS 样式（圆角、阴影、悬停效果等）
10. THE UI_Renderer SHALL 支持中文显示
11. THE UI_Renderer SHALL 使用响应式布局适配不同侧边栏宽度
12. THE Message_Bridge SHALL 处理 Webview 和 Extension 后端之间的消息传递

### 需求 18：游戏初始化

**用户故事：** 作为玩家，我想在游戏开始时进行初始化设置，这样我可以自定义角色和开局。

#### 验收标准

1. WHEN 插件激活，THE Extension SHALL 在侧边栏显示游戏 Webview
2. THE UI_Renderer SHALL 显示欢迎信息和游戏简介
3. THE UI_Renderer SHALL 提供新游戏和继续游戏的按钮
4. WHEN 玩家选择新游戏，THE UI_Renderer SHALL 显示角色名称输入框
5. THE UI_Renderer SHALL 显示 Cultivation_Path 选择界面（按钮或下拉列表）
6. WHEN 玩家完成初始化，THE Game_Engine SHALL 显示开局剧情
7. THE Game_Engine SHALL 初始化 Player_State 为默认值（炼气期1层、灵石10、寿命80年等）

### 需求 19：游戏循环

**用户故事：** 作为玩家，我想游戏持续运行直到达成结局，这样我可以完整体验游戏流程。

#### 验收标准

1. THE Game_Engine SHALL 在游戏初始化后进入主循环
2. WHEN 每个 Game_Turn 开始，THE Game_Engine SHALL 执行以下流程：更新状态 → 触发随机事件（如有）→ 生成选项 → 等待玩家交互 → 执行选择 → 推进时间
3. THE UI_Renderer SHALL 在每个循环更新界面显示
4. THE Game_Engine SHALL 在每个循环检查结局条件
5. WHEN 结局条件满足，THE Game_Engine SHALL 退出主循环并显示结局
6. THE UI_Renderer SHALL 提供退出游戏的按钮（保存并退出）
7. WHEN 玩家选择退出，THE Game_Engine SHALL 保存游戏并关闭 Webview

### 需求 20：错误处理

**用户故事：** 作为玩家，我想在输入错误时得到清晰的提示，这样我知道如何正确操作。

#### 验收标准

1. WHEN 玩家输入无效的选项编号，THE UI_Renderer SHALL 显示 "无效选择，请输入 1-N 之间的数字"
2. WHEN 玩家输入非数字字符，THE UI_Renderer SHALL 显示 "请输入数字"
3. WHEN 配置文件加载失败，THE Extension SHALL 显示错误通知并禁用游戏功能
4. WHEN 存档加载失败，THE UI_Renderer SHALL 显示错误信息并提供新游戏选项
5. THE Extension SHALL 捕获所有异常并显示友好的错误信息（而非插件崩溃）
6. THE Message_Bridge SHALL 处理通信错误并显示重连提示

### 需求 21：VSCode 插件架构

**用户故事：** 作为开发者，我想使用标准的 VSCode 插件架构，这样插件可以稳定运行并与 VSCode 良好集成。

#### 验收标准

1. THE Extension SHALL 使用 VSCode Extension API 创建侧边栏 Webview
2. THE Extension SHALL 在 extension.ts 中注册激活命令和视图
3. THE Message_Bridge SHALL 使用 postMessage API 实现 Webview 和 Extension 之间的双向通信
4. THE Extension SHALL 在后端运行 Game_Engine 逻辑
5. THE Webview SHALL 仅负责界面渲染和用户交互
6. WHEN 玩家在 Webview 中点击按钮，THE Message_Bridge SHALL 发送消息到 Extension 后端
7. WHEN Game_Engine 状态更新，THE Message_Bridge SHALL 发送消息到 Webview 更新界面
8. THE Extension SHALL 使用 VSCode 的 globalState 或 workspace storage 存储存档数据
9. THE Extension SHALL 在 package.json 中正确配置插件元数据、激活事件和贡献点

### 需求 22：功能按键工具栏

**用户故事：** 作为玩家，我想使用功能按键快速访问常用功能，这样我可以方便地调整设置、保存进度和重新开始游戏。

#### 验收标准

1. THE UI_Renderer SHALL 在游戏界面顶部渲染功能按键工具栏
2. THE UI_Renderer SHALL 使功能按键工具栏固定在视口顶部（不随内容滚动）
3. THE UI_Renderer SHALL 为功能按键工具栏使用与主界面一致的黑底白字配色方案
4. THE UI_Renderer SHALL 为每个功能按键渲染图标和文字标签
5. THE UI_Renderer SHALL 在功能按键悬停时显示功能说明提示
6. THE UI_Renderer SHALL 使功能按键工具栏适配细长条页面布局
7. WHEN 游戏未初始化，THE UI_Renderer SHALL 禁用需要游戏状态的功能按键（存档、重开）
8. THE UI_Renderer SHALL 为功能按键提供视觉反馈（悬停效果、点击效果）

### 需求 23：字体设置功能

**用户故事：** 作为玩家，我想调整游戏文本的字体大小和类型，这样我可以获得舒适的阅读体验。

#### 验收标准

1. THE UI_Renderer SHALL 在功能按键工具栏中提供字体设置按钮
2. WHEN 玩家点击字体设置按钮，THE UI_Renderer SHALL 显示字体设置面板
3. THE UI_Renderer SHALL 在字体设置面板中提供字体大小选项（小、中、大、特大）
4. THE UI_Renderer SHALL 在字体设置面板中提供字体类型选项（系统默认、宋体、黑体、等宽字体）
5. WHEN 玩家选择字体大小，THE UI_Renderer SHALL 立即应用到游戏文本
6. WHEN 玩家选择字体类型，THE UI_Renderer SHALL 立即应用到游戏文本
7. THE Extension SHALL 将字体设置保存到 VSCode 的 globalState
8. WHEN 游戏重新加载，THE UI_Renderer SHALL 恢复玩家的字体设置
9. THE UI_Renderer SHALL 为字体设置面板提供关闭按钮
10. THE UI_Renderer SHALL 确保字体设置不影响界面布局的完整性

### 需求 24：快速存档功能

**用户故事：** 作为玩家，我想通过功能按键快速保存游戏进度，这样我可以随时保存而不需要通过游戏选项。

#### 验收标准

1. THE UI_Renderer SHALL 在功能按键工具栏中提供快速存档按钮
2. WHEN 玩家点击快速存档按钮，THE Save_System SHALL 立即保存当前游戏状态
3. THE UI_Renderer SHALL 在保存成功后显示确认提示（如 "保存成功"）
4. THE UI_Renderer SHALL 在保存失败时显示错误提示
5. WHEN 游戏未初始化或无可保存状态，THE UI_Renderer SHALL 禁用快速存档按钮
6. THE Save_System SHALL 将快速存档保存到默认存档槽位（槽位1）
7. THE UI_Renderer SHALL 在保存过程中显示加载指示器
8. THE Save_System SHALL 在快速存档时包含时间戳信息

### 需求 25：快速重开功能

**用户故事：** 作为玩家，我想通过功能按键快速开始新游戏，这样我可以方便地重新体验游戏。

#### 验收标准

1. THE UI_Renderer SHALL 在功能按键工具栏中提供重开按钮
2. WHEN 玩家点击重开按钮，THE UI_Renderer SHALL 显示确认对话框
3. THE UI_Renderer SHALL 在确认对话框中提示 "确定要开始新游戏吗？未保存的进度将丢失"
4. THE UI_Renderer SHALL 在确认对话框中提供确认和取消按钮
5. WHEN 玩家确认重开，THE Game_Engine SHALL 重置游戏状态并返回初始化界面
6. WHEN 玩家取消重开，THE UI_Renderer SHALL 关闭确认对话框并保持当前游戏状态
7. THE Game_Engine SHALL 在重开时清除当前 Player_State
8. THE Game_Engine SHALL 在重开后显示角色创建和 Cultivation_Path 选择界面

### 需求 26：游戏历史记录功能

**用户故事：** 作为玩家，我想查看游戏历史记录，这样我可以回顾之前的选择和事件。

#### 验收标准

1. THE UI_Renderer SHALL 在功能按键工具栏中提供历史记录按钮
2. WHEN 玩家点击历史记录按钮，THE UI_Renderer SHALL 显示历史记录面板
3. THE State_Tracker SHALL 记录每个回合的关键事件和玩家选择
4. THE UI_Renderer SHALL 在历史记录面板中按时间倒序显示历史记录（最新在前）
5. THE UI_Renderer SHALL 为每条历史记录显示时间戳（年/季节/月）和事件描述
6. THE UI_Renderer SHALL 限制历史记录显示数量（如最近50条）
7. THE UI_Renderer SHALL 为历史记录面板提供滚动功能
8. THE UI_Renderer SHALL 为历史记录面板提供关闭按钮
9. THE State_Tracker SHALL 在历史记录中标记关键选择（影响剧情分支的选择）

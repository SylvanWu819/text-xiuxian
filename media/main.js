/**
 * Cultivation Simulator - Frontend Script
 * Implements Requirements 21.3, 21.6, 21.7 - Message communication between Webview and Extension
 * Task 17.1: Welcome screen and character creation interface
 */

// Get VS Code API
const vscode = acquireVsCodeApi();

// Application state
let appState = {
  initialized: false,
  gameState: null,
  selectedPathId: null,
  fontSettings: {
    size: '13px',  // 默认13px
    family: 'default'
  }
};

/**
 * Initialize the application
 * Implements Requirements 17.1, 17.2, 17.4, 17.5, 17.6, 17.8, 18.1-18.7
 */
function initialize() {
  console.log('初始化前端应用');
  
  // Load font settings from state
  const savedState = vscode.getState();
  if (savedState && savedState.fontSettings) {
    appState.fontSettings = savedState.fontSettings;
    applyFontSettings();
  }
  
  // Attach event listeners
  attachToolbarListeners();
  attachWelcomeListeners();
  attachCharacterCreationListeners();
  
  appState.initialized = true;
  
  console.log('前端应用初始化完成');
}

/**
 * Attach welcome screen event listeners
 * Task 17.1: 实现欢迎界面交互
 * Implements Requirement 18.2, 18.3
 */
function attachWelcomeListeners() {
  // New game button
  document.getElementById('btn-new-game')?.addEventListener('click', () => {
    showCharacterCreation();
  });
  
  // Continue game button
  document.getElementById('btn-continue-game')?.addEventListener('click', () => {
    // TODO: Implement load game functionality
    showNotification('继续游戏功能开发中', 'info');
  });
  
  // How to play button
  document.getElementById('btn-how-to-play')?.addEventListener('click', () => {
    showHowToPlayPanel();
  });
}

/**
 * Attach character creation event listeners
 * Task 17.1: 实现角色创建交互
 * Implements Requirements 18.4, 18.5, 2.1-2.5
 */
function attachCharacterCreationListeners() {
  // Player name input
  const nameInput = document.getElementById('player-name');
  nameInput?.addEventListener('input', () => {
    validateCharacterCreation();
  });
  
  // Cultivation path selection
  const pathCards = document.querySelectorAll('.path-card');
  pathCards.forEach(card => {
    card.addEventListener('click', () => {
      selectCultivationPath(card.getAttribute('data-path-id'));
    });
  });
  
  // Start game button
  document.getElementById('btn-start-game')?.addEventListener('click', () => {
    startGame();
  });
  
  // Back to welcome button
  document.getElementById('btn-back-welcome')?.addEventListener('click', () => {
    showWelcomeScreen();
  });
}

/**
 * Show character creation screen
 * Task 17.1: 显示角色创建界面
 * Implements Requirement 18.3
 */
function showCharacterCreation() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('character-creation').style.display = 'block';
  document.getElementById('game-screen').style.display = 'none';
  
  // Reset form
  document.getElementById('player-name').value = '';
  appState.selectedPathId = null;
  
  // Deselect all path cards
  document.querySelectorAll('.path-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Disable start button
  document.getElementById('btn-start-game').disabled = true;
}

/**
 * Show welcome screen
 * Task 17.1: 显示欢迎界面
 * Implements Requirement 18.1
 */
function showWelcomeScreen() {
  document.getElementById('welcome-screen').style.display = 'block';
  document.getElementById('character-creation').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  
  // Disable game-related toolbar buttons
  document.getElementById('btn-save').disabled = true;
  document.getElementById('btn-restart').disabled = true;
  document.getElementById('btn-history').disabled = true;
}

/**
 * Show game screen
 * Task 17.1: 显示游戏界面
 */
function showGameScreen() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('character-creation').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  
  // Enable game-related toolbar buttons
  document.getElementById('btn-save').disabled = false;
  document.getElementById('btn-restart').disabled = false;
  document.getElementById('btn-history').disabled = false;
}

/**
 * Select cultivation path
 * Task 17.1: 实现修行方向选择
 * Implements Requirement 18.5, 2.1-2.5
 */
function selectCultivationPath(pathId) {
  // Deselect all cards
  document.querySelectorAll('.path-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Select clicked card
  const selectedCard = document.querySelector(`.path-card[data-path-id="${pathId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
    appState.selectedPathId = pathId;
  }
  
  // Validate form
  validateCharacterCreation();
}

/**
 * Validate character creation form
 * Task 17.1: 验证角色创建表单
 * Implements Requirements 18.4, 18.5
 */
function validateCharacterCreation() {
  const nameInput = document.getElementById('player-name');
  const startButton = document.getElementById('btn-start-game');
  
  const name = nameInput.value.trim();
  const isValid = name.length >= 2 && name.length <= 20 && appState.selectedPathId;
  
  startButton.disabled = !isValid;
}

/**
 * Start game with selected character
 * Task 17.1: 开始游戏
 * Implements Requirements 18.6, 18.7
 */
function startGame() {
  const nameInput = document.getElementById('player-name');
  const playerName = nameInput.value.trim();
  
  if (!playerName || playerName.length < 2) {
    showNotification('道号至少需要2个字符', 'error');
    return;
  }
  
  if (!appState.selectedPathId) {
    showNotification('请选择修行方向', 'error');
    return;
  }
  
  // Send character creation message to backend
  console.log('创建角色:', playerName, appState.selectedPathId);
  vscode.postMessage({
    type: 'createCharacter',
    payload: {
      playerName: playerName,
      pathId: appState.selectedPathId
    }
  });
  
  // Show loading state
  showNotification('正在初始化游戏...', 'info');
}

/**
 * Attach toolbar event listeners
 */
function attachToolbarListeners() {
  document.getElementById('btn-how-to-play-toolbar')?.addEventListener('click', showHowToPlayPanel);
  document.getElementById('btn-font')?.addEventListener('click', showFontPanel);
  document.getElementById('btn-save')?.addEventListener('click', quickSave);
  document.getElementById('btn-restart')?.addEventListener('click', confirmRestart);
  document.getElementById('btn-history')?.addEventListener('click', showHistoryPanel);
  document.getElementById('btn-achievements')?.addEventListener('click', showAchievementsPanel);
}

/**
 * Test action - send message to extension
 * Implements Requirement 21.6
 */
function testAction(actionId) {
  console.log('发送行动到后端:', actionId);
  
  // Send message to extension (Requirement 21.6)
  vscode.postMessage({
    type: 'action',
    payload: { actionId }
  });
}

/**
 * Show font settings panel
 */
function showFontPanel() {
  const panel = document.createElement('div');
  panel.className = 'modal-overlay';
  panel.innerHTML = `
    <div class="modal-content">
      <h3>字体设置</h3>
      
      <div class="setting-group">
        <label>字体大小</label>
        <select id="font-size">
          <option value="10px" ${appState.fontSettings.size === '10px' ? 'selected' : ''}>10px（极小）</option>
          <option value="11px" ${appState.fontSettings.size === '11px' ? 'selected' : ''}>11px（很小）</option>
          <option value="12px" ${appState.fontSettings.size === '12px' ? 'selected' : ''}>12px（较小）</option>
          <option value="13px" ${appState.fontSettings.size === '13px' ? 'selected' : ''}>13px（小）</option>
          <option value="14px" ${appState.fontSettings.size === '14px' ? 'selected' : ''}>14px（中小）</option>
          <option value="15px" ${appState.fontSettings.size === '15px' ? 'selected' : ''}>15px（中等）</option>
          <option value="16px" ${appState.fontSettings.size === '16px' ? 'selected' : ''}>16px（标准）</option>
          <option value="17px" ${appState.fontSettings.size === '17px' ? 'selected' : ''}>17px（中大）</option>
          <option value="18px" ${appState.fontSettings.size === '18px' ? 'selected' : ''}>18px（大）</option>
          <option value="19px" ${appState.fontSettings.size === '19px' ? 'selected' : ''}>19px（较大）</option>
          <option value="20px" ${appState.fontSettings.size === '20px' ? 'selected' : ''}>20px（很大）</option>
          <option value="22px" ${appState.fontSettings.size === '22px' ? 'selected' : ''}>22px（特大）</option>
          <option value="24px" ${appState.fontSettings.size === '24px' ? 'selected' : ''}>24px（超大）</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label>字体类型</label>
        <select id="font-family">
          <option value="default" ${appState.fontSettings.family === 'default' ? 'selected' : ''}>系统默认</option>
          <option value="songti" ${appState.fontSettings.family === 'songti' ? 'selected' : ''}>宋体</option>
          <option value="heiti" ${appState.fontSettings.family === 'heiti' ? 'selected' : ''}>黑体</option>
          <option value="kaiti" ${appState.fontSettings.family === 'kaiti' ? 'selected' : ''}>楷体</option>
          <option value="fangsong" ${appState.fontSettings.family === 'fangsong' ? 'selected' : ''}>仿宋</option>
          <option value="monospace" ${appState.fontSettings.family === 'monospace' ? 'selected' : ''}>等宽字体</option>
        </select>
      </div>
      
      <div class="setting-preview">
        <div class="preview-label">预览效果：</div>
        <div class="preview-text" id="font-preview">
          修仙模拟器 - 你是231，一个对剑道充满向往的少年。
        </div>
      </div>
      
      <div class="modal-buttons">
        <button id="btn-reset-font" class="button">恢复默认</button>
        <button id="btn-close-font" class="button button-primary">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // 更新预览
  const updatePreview = () => {
    const preview = document.getElementById('font-preview');
    if (preview) {
      preview.style.fontSize = appState.fontSettings.size;
      const familyMap = {
        default: "'Microsoft YaHei', 'SimHei', sans-serif",
        songti: "'SimSun', serif",
        heiti: "'SimHei', sans-serif",
        kaiti: "'KaiTi', serif",
        fangsong: "'FangSong', serif",
        monospace: "'Consolas', 'Courier New', monospace"
      };
      preview.style.fontFamily = familyMap[appState.fontSettings.family] || familyMap.default;
    }
  };
  
  // 初始预览
  updatePreview();
  
  // Event listeners
  document.getElementById('font-size')?.addEventListener('change', (e) => {
    appState.fontSettings.size = e.target.value;
    applyFontSettings();
    updatePreview();
    saveFontSettings();
  });
  
  document.getElementById('font-family')?.addEventListener('change', (e) => {
    appState.fontSettings.family = e.target.value;
    applyFontSettings();
    updatePreview();
    saveFontSettings();
  });
  
  document.getElementById('btn-reset-font')?.addEventListener('click', () => {
    appState.fontSettings = { size: '13px', family: 'default' };
    applyFontSettings();
    updatePreview();
    saveFontSettings();
    panel.remove();
    showNotification('已恢复默认字体设置', 'success');
  });
  
  document.getElementById('btn-close-font')?.addEventListener('click', () => {
    panel.remove();
  });
  
  // Close on overlay click
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.remove();
    }
  });
}

/**
 * Apply font settings to document
 */
function applyFontSettings() {
  const body = document.body;
  
  // 直接设置body的字体大小和字体类型
  if (body) {
    body.style.fontSize = appState.fontSettings.size || '13px';
    
    // Font family mapping
    const familyMap = {
      default: "'Microsoft YaHei', 'SimHei', sans-serif",
      songti: "'SimSun', serif",
      heiti: "'SimHei', sans-serif",
      kaiti: "'KaiTi', serif",
      fangsong: "'FangSong', serif",
      monospace: "'Consolas', 'Courier New', monospace"
    };
    body.style.fontFamily = familyMap[appState.fontSettings.family] || familyMap.default;
  }
}

/**
 * Save font settings
 * Implements Requirement 21.6
 */
function saveFontSettings() {
  // Save to VS Code state
  vscode.setState({ ...vscode.getState(), fontSettings: appState.fontSettings });
  
  // Send to extension
  vscode.postMessage({
    type: 'fontSettings',
    payload: appState.fontSettings
  });
}

/**
 * Quick save
 * Implements Requirement 21.6
 */
function quickSave() {
  console.log('快速存档');
  
  vscode.postMessage({
    type: 'save',
    payload: { slotId: 1 }
  });
}

/**
 * Confirm restart
 */
function confirmRestart() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>确认重开</h3>
      <p>确定要开始新游戏吗？未保存的进度将丢失。</p>
      <div class="modal-buttons">
        <button id="btn-confirm-restart" class="button button-danger">确定</button>
        <button id="btn-cancel-restart" class="button">取消</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('btn-confirm-restart')?.addEventListener('click', () => {
    // 发送重开消息到后端
    vscode.postMessage({ type: 'restart' });
    
    // 前端也重置到欢迎界面
    showWelcomeScreen();
    
    // 清空游戏状态
    appState.gameState = null;
    
    // 清空显示
    UIRenderer.clearEvent();
    UIRenderer.clearOptions();
    
    // 重置时间和统计显示
    UIRenderer.renderTime(null);
    document.getElementById('game-stats').innerHTML = '';
    
    modal.remove();
    
    showNotification('已重置游戏，请开始新游戏', 'success');
  });
  
  document.getElementById('btn-cancel-restart')?.addEventListener('click', () => {
    modal.remove();
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Show history panel
 * Implements Requirement 21.6
 */
function showHistoryPanel() {
  console.log('请求历史记录');
  
  vscode.postMessage({
    type: 'getHistory'
  });
}

/**
 * Show achievements panel
 */
function showAchievementsPanel() {
  console.log('请求成就数据');
  
  vscode.postMessage({
    type: 'getAchievements'
  });
}

/**
 * Render history panel
 */
function renderHistoryPanel(history) {
  const panel = document.createElement('div');
  panel.className = 'modal-overlay';
  
  const historyHTML = history.length > 0
    ? history.map(entry => `
        <div class="history-entry ${entry.isKeyChoice ? 'key-choice' : ''}">
          <div class="history-time">${entry.time}</div>
          <div class="history-description">${entry.description}</div>
        </div>
      `).join('')
    : '<p class="empty-message">暂无历史记录</p>';
  
  panel.innerHTML = `
    <div class="modal-content history-panel">
      <h3>历史记录</h3>
      <div class="history-list">
        ${historyHTML}
      </div>
      <div class="modal-buttons">
        <button id="btn-close-history" class="button">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  document.getElementById('btn-close-history')?.addEventListener('click', () => {
    panel.remove();
  });
  
  // Close on overlay click
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.remove();
    }
  });
}

/**
 * Render achievements panel
 */
function renderAchievementsPanel(data) {
  const panel = document.createElement('div');
  panel.className = 'modal-overlay';
  
  const { progress, statistics, recentRecords } = data;
  
  // 格式化日期
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  // 格式化时长
  const formatDuration = (years) => {
    return `${years}年`;
  };
  
  // 结局进度条
  const progressBarHTML = `
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: ${progress.percentage}%"></div>
      <div class="progress-text">${progress.unlockedCount}/${progress.totalCount} (${progress.percentage}%)</div>
    </div>
  `;
  
  // 统计信息
  const statsHTML = `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">总游戏次数</div>
        <div class="stat-value">${statistics.totalPlayCount}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">总游戏时长</div>
        <div class="stat-value">${formatDuration(statistics.totalPlayTime)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">平均时长</div>
        <div class="stat-value">${formatDuration(statistics.averagePlayTime)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">首次游戏</div>
        <div class="stat-value">${formatDate(statistics.firstPlayDate)}</div>
      </div>
    </div>
  `;
  
  // 最近记录
  const recordsHTML = recentRecords.length > 0
    ? recentRecords.map(record => `
        <div class="ending-record">
          <div class="record-header">
            <span class="record-title">${record.title}</span>
            <span class="record-date">${formatDate(record.achievedAt)}</span>
          </div>
          <div class="record-details">
            <span>境界: ${record.cultivationLevel}</span>
            <span>时长: ${formatDuration(record.playTime)}</span>
            <span>灵石: ${record.finalStats.spiritStones}</span>
          </div>
          ${record.achievements.length > 0 ? `
            <div class="record-achievements">
              ${record.achievements.slice(0, 3).map(a => `<span class="mini-achievement">${a}</span>`).join('')}
              ${record.achievements.length > 3 ? `<span class="more-achievements">+${record.achievements.length - 3}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')
    : '<p class="empty-message">暂无结局记录</p>';
  
  panel.innerHTML = `
    <div class="modal-content achievements-panel">
      <h3>🏆 成就系统</h3>
      
      <div class="achievements-section">
        <h4>结局达成度</h4>
        ${progressBarHTML}
      </div>
      
      <div class="achievements-section">
        <h4>统计数据</h4>
        ${statsHTML}
      </div>
      
      <div class="achievements-section">
        <h4>最近结局</h4>
        <div class="records-list">
          ${recordsHTML}
        </div>
      </div>
      
      <div class="modal-buttons">
        <button id="btn-reset-achievements" class="button button-danger">重置成就</button>
        <button id="btn-close-achievements" class="button">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  document.getElementById('btn-close-achievements')?.addEventListener('click', () => {
    panel.remove();
  });
  
  document.getElementById('btn-reset-achievements')?.addEventListener('click', () => {
    if (confirm('确定要重置所有成就数据吗？此操作不可恢复！')) {
      vscode.postMessage({ type: 'resetAchievements' });
      panel.remove();
    }
  });
  
  // Close on overlay click
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.remove();
    }
  });
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

/**
 * Show how to play panel
 */
function showHowToPlayPanel() {
  const panel = document.createElement('div');
  panel.className = 'modal-overlay';
  panel.innerHTML = `
    <div class="modal-content how-to-play-panel">
      <h3>📖 玩法说明</h3>
      
      <div class="how-to-play-content">
        <section class="guide-section">
          <h4>🎮 游戏目标</h4>
          <p>从一个凡人开始，通过修炼、历练、机缘，最终突破境界，达成你的修仙结局。</p>
        </section>
        
        <section class="guide-section">
          <h4>⚔️ 修行方向</h4>
          <ul>
            <li><strong>剑修</strong> - 以剑入道，攻击力强，适合战斗流</li>
            <li><strong>体修</strong> - 炼体为主，防御力高，生存能力强</li>
            <li><strong>丹修</strong> - 精通炼丹，资源丰富，发展稳健</li>
            <li><strong>阵修</strong> - 精通阵法，控制力强，策略性高</li>
          </ul>
        </section>
        
        <section class="guide-section">
          <h4>📊 核心属性</h4>
          <ul>
            <li><strong>修为</strong> - 你的修炼境界，影响实力和寿命</li>
            <li><strong>灵石</strong> - 修仙世界的货币，用于购买资源</li>
            <li><strong>寿命</strong> - 你的剩余寿命，耗尽则游戏结束</li>
            <li><strong>声望</strong> - 正道/魔道声望，影响事件和结局</li>
            <li><strong>因果</strong> - 善缘和因果债，影响渡劫和结局</li>
          </ul>
        </section>
        
        <section class="guide-section">
          <h4>🎯 游戏玩法（v2.2.0 简化版）</h4>
          <ol>
            <li><strong>闭关修炼</strong> - 消耗1个月时间，提升修为</li>
            <li><strong>外出探索</strong> - 消耗1个月时间，可能触发各种机缘或危险</li>
            <li><strong>时间推进</strong> - 每个行动会消耗时间（月/季/年）</li>
            <li><strong>随机事件</strong> - 探索时可能触发各种机缘或危险</li>
            <li><strong>人际关系</strong> - 与NPC互动，建立关系网</li>
          </ol>
          <p class="guide-note">💡 注意：v2.2.0版本简化了游戏玩法，专注于核心修炼和探索体验。</p>
        </section>
        
        <section class="guide-section">
          <h4>💡 游戏提示</h4>
          <ul>
            <li>合理分配时间，平衡修炼和探索</li>
            <li>注意寿命管理，及时突破境界延长寿命</li>
            <li>积累善缘，减少因果债，有助于渡劫</li>
            <li>建立良好的人际关系，关键时刻会有帮助</li>
            <li>不同修行方向有独特事件和优势</li>
            <li>定期存档，避免意外损失进度</li>
            <li>探索是获得机缘的主要途径，但也伴随风险</li>
          </ul>
        </section>
        
        <section class="guide-section">
          <h4>🏆 结局系统</h4>
          <p>游戏有多种结局，取决于你的：</p>
          <ul>
            <li>最终修为境界</li>
            <li>正道/魔道声望倾向</li>
            <li>因果善恶平衡</li>
            <li>人际关系网络</li>
            <li>特殊事件触发</li>
          </ul>
        </section>
        
        <section class="guide-section">
          <h4>🛠️ 工具栏功能</h4>
          <ul>
            <li><strong>字体</strong> - 调整字体大小和类型</li>
            <li><strong>存档</strong> - 快速保存当前进度</li>
            <li><strong>重开</strong> - 开始新的修仙之旅</li>
            <li><strong>历史</strong> - 查看重要决策和事件记录</li>
          </ul>
        </section>
      </div>
      
      <div class="modal-buttons">
        <button id="btn-close-guide" class="button button-primary">开始修仙</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  document.getElementById('btn-close-guide')?.addEventListener('click', () => {
    panel.remove();
  });
  
  // Close on overlay click
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.remove();
    }
  });
}

/**
 * UIRenderer - 界面渲染器
 * Implements Requirements 17.4, 17.5, 17.6, 17.7, 17.8, 14.4
 * Task 14.3: 实现 UIRenderer 界面渲染器
 */
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
  
  /**
   * 渲染游戏状态
   * Implements Requirement 17.4, 17.5
   * Sub-task: 实现游戏状态渲染方法
   */
  renderGameState(state) {
    if (!state) {
      console.warn('UIRenderer.renderGameState: 状态为空');
      return;
    }
    
    // Render time display
    this.renderTime(state.time);
    
    // Render stats display
    this.renderStats(state);
    
    // Store state for reference
    appState.gameState = state;
  },
  
  /**
   * 渲染时间显示
   * Implements Requirement 17.4
   */
  renderTime(time) {
    const timeElement = document.getElementById('game-time');
    if (!timeElement) {
      console.warn('UIRenderer.renderTime: 找不到时间元素');
      return;
    }
    
    if (!time) {
      timeElement.textContent = '欢迎来到修仙模拟器';
      return;
    }
    
    const seasons = ['春季', '夏季', '秋季', '冬季'];
    const seasonText = seasons[time.season] || '';
    timeElement.textContent = `第${time.year}年 ${seasonText}`;
  },
  
  /**
   * 渲染统计信息
   * Implements Requirement 17.5
   */
  renderStats(state) {
    const statsElement = document.getElementById('game-stats');
    if (!statsElement) {
      console.warn('UIRenderer.renderStats: 找不到统计元素');
      return;
    }
    
    // Build stats HTML
    const statsHTML = [];
    
    // Cultivation level and experience
    if (state.cultivation) {
      const level = this.getCultivationLevelName(state.cultivation.level);
      const exp = state.cultivation.experience || 0;
      const maxExp = state.cultivation.maxExperience || 100;
      statsHTML.push(`
        <div class="stat-line">
          <span class="stat-label">修为:</span>
          <span class="stat-value">${level} ${exp}/${maxExp}</span>
        </div>
      `);
    }
    
    // Resources
    if (state.resources) {
      statsHTML.push(`
        <div class="stat-line">
          <span class="stat-label">灵石:</span>
          <span class="stat-value">${state.resources.spiritStones || 0}</span>
        </div>
      `);
    }
    
    // Lifespan
    if (state.lifespan) {
      const current = Math.floor(state.lifespan.current || 0);
      const max = state.lifespan.max || 0;
      statsHTML.push(`
        <div class="stat-line">
          <span class="stat-label">寿命:</span>
          <span class="stat-value">${current}/${max}年</span>
        </div>
      `);
    }
    
    // Reputation
    if (state.reputation) {
      statsHTML.push(`
        <div class="stat-line">
          <span class="stat-label">正道声望:</span>
          <span class="stat-value">${state.reputation.righteous || 0}</span>
        </div>
        <div class="stat-line">
          <span class="stat-label">魔道声望:</span>
          <span class="stat-value">${state.reputation.demonic || 0}</span>
        </div>
      `);
    }
    
    // Karma (if present)
    if (state.karma) {
      statsHTML.push(`
        <div class="stat-line">
          <span class="stat-label">善缘:</span>
          <span class="stat-value">${state.karma.goodDeeds || 0}</span>
        </div>
        <div class="stat-line">
          <span class="stat-label">因果债:</span>
          <span class="stat-value">${state.karma.karmicDebt || 0}</span>
        </div>
      `);
    }
    
    statsElement.innerHTML = statsHTML.join('');
  },
  
  /**
   * 渲染事件描述
   * Implements Requirement 17.6
   * Sub-task: 实现事件描述渲染方法
   */
  renderEvent(event) {
    if (!event) {
      console.warn('UIRenderer.renderEvent: 事件为空');
      return;
    }
    
    const titleElement = document.getElementById('event-title');
    const descriptionElement = document.getElementById('event-description');
    
    // 显示事件标题和描述
    if (titleElement && event.title) {
      titleElement.textContent = event.title;
    }
    
    if (descriptionElement && event.description) {
      // Convert newlines to <br> tags
      const formattedDescription = event.description.replace(/\n/g, '<br>');
      
      // 检查描述长度，如果太长则添加折叠功能
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
        const toggleBtn = document.getElementById('toggle-desc-btn');
        const content = document.getElementById('event-desc-content');
        
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
      } else {
        descriptionElement.innerHTML = `<div class="event-description-content">${formattedDescription}</div>`;
      }
    }
    
    // If event has options, render them
    if (event.options && event.options.length > 0) {
      this.renderOptions(event.options);
    }
  },
  
  /**
   * 渲染选项列表
   * Implements Requirement 17.8, 20.1, 20.2
   * Sub-task: 实现选项列表渲染方法
   */
  renderOptions(options) {
    const optionsSection = document.getElementById('options-section');
    
    if (!optionsSection) {
      console.warn('UIRenderer.renderOptions: 找不到选项区域');
      return;
    }
    
    if (!options || options.length === 0) {
      optionsSection.innerHTML = '<div class="empty-message">暂无可用选项</div>';
      return;
    }
    
    // 添加行动反馈区域（在选项上方）
    let feedbackHTML = '<div class="action-feedback" id="action-feedback"></div>';
    
    // Build options HTML
    const optionsHTML = options.map((option, index) => {
      // Check if option should be disabled
      const disabled = option.disabled || false;
      const disabledClass = disabled ? 'option-disabled' : '';
      const disabledAttr = disabled ? 'disabled' : '';
      
      // Build option description
      let descriptionHTML = '';
      if (option.description) {
        descriptionHTML = `<div class="option-description">${option.description}</div>`;
      }
      
      // Build requirements hint (show why option is disabled)
      let requirementsHTML = '';
      if (option.requirements && disabled) {
        const reqParts = [];
        if (option.requirements.minResources) {
          if (option.requirements.minResources.spiritStones) {
            reqParts.push(`需要${option.requirements.minResources.spiritStones}灵石`);
          }
        }
        if (option.requirements.minRelationship) {
          reqParts.push(`需要与${option.requirements.minRelationship.npcId}的关系达到${option.requirements.minRelationship.value}`);
        }
        if (option.requirements.requiredItems && option.requirements.requiredItems.length > 0) {
          reqParts.push(`需要物品：${option.requirements.requiredItems.join(', ')}`);
        }
        if (reqParts.length > 0) {
          requirementsHTML = `<div class="option-requirements">${reqParts.join(', ')}</div>`;
        }
      }
      
      // Build error message if option has validation error
      let errorHTML = '';
      if (option.error) {
        errorHTML = `<div class="option-error">⚠️ ${option.error}</div>`;
      }
      
      return `
        <button class="option-button ${disabledClass}" 
                data-option-id="${option.id}" 
                ${disabledAttr}
                title="${disabled ? '不满足要求' : option.text}">
          <span class="option-number">${index + 1}</span>
          <div class="option-text">${option.text}</div>
          ${descriptionHTML}
          ${requirementsHTML}
          ${errorHTML}
        </button>
      `;
    }).join('');
    
    optionsSection.innerHTML = `
      ${feedbackHTML}
      <div class="options-title">可选行动：</div>
      ${optionsHTML}
    `;
    
    // Attach event listeners using event delegation
    const buttons = optionsSection.querySelectorAll('.option-button');
    console.log(`UIRenderer.renderOptions: 找到 ${buttons.length} 个选项按钮`);
    buttons.forEach((button, index) => {
      const optionId = button.getAttribute('data-option-id');
      console.log(`  按钮 ${index + 1}: optionId=${optionId}, disabled=${button.disabled}`);
      
      button.addEventListener('click', (event) => {
        console.log(`按钮被点击: optionId=${optionId}, disabled=${button.disabled}`);
        event.preventDefault();
        event.stopPropagation();
        
        if (optionId && !button.disabled) {
          // 添加点击反馈
          button.classList.add('option-clicked');
          
          // 显示加载提示
          showNotification('正在执行...', 'info');
          
          console.log(`调用 selectOption(${optionId})`);
          selectOption(optionId);
          
          // 短暂延迟后移除点击效果
          setTimeout(() => {
            button.classList.remove('option-clicked');
          }, 300);
        } else {
          console.warn(`按钮被禁用或没有 optionId: optionId=${optionId}, disabled=${button.disabled}`);
          
          // 禁用按钮的反馈
          if (button.disabled) {
            showNotification('不满足该选项的要求', 'error');
            button.classList.add('option-shake');
            setTimeout(() => {
              button.classList.remove('option-shake');
            }, 500);
          }
        }
      });
    });
  },
  
  /**
   * 渲染状态变化提示
   * Implements Requirement 17.7, 14.4
   * Sub-task: 实现状态变化提示渲染
   */
  renderStateChanges(changes) {
    if (!changes || Object.keys(changes).length === 0) {
      return;
    }
    
    const messages = [];
    
    // Cultivation changes
    if (changes.cultivationChange) {
      const sign = changes.cultivationChange > 0 ? '+' : '';
      messages.push(`修为 ${sign}${changes.cultivationChange}`);
    }
    
    // Resource changes
    if (changes.resourceChanges) {
      if (changes.resourceChanges.spiritStones) {
        const sign = changes.resourceChanges.spiritStones > 0 ? '+' : '';
        messages.push(`灵石 ${sign}${changes.resourceChanges.spiritStones}`);
      }
    }
    
    // Lifespan changes
    if (changes.lifespanChange) {
      const sign = changes.lifespanChange > 0 ? '+' : '';
      messages.push(`寿命 ${sign}${changes.lifespanChange}年`);
    }
    
    // Reputation changes
    if (changes.reputationChange) {
      if (changes.reputationChange.righteous) {
        const sign = changes.reputationChange.righteous > 0 ? '+' : '';
        messages.push(`正道声望 ${sign}${changes.reputationChange.righteous}`);
      }
      if (changes.reputationChange.demonic) {
        const sign = changes.reputationChange.demonic > 0 ? '+' : '';
        messages.push(`魔道声望 ${sign}${changes.reputationChange.demonic}`);
      }
    }
    
    // Karma changes
    if (changes.karmaChange) {
      if (changes.karmaChange.goodDeeds) {
        const sign = changes.karmaChange.goodDeeds > 0 ? '+' : '';
        messages.push(`善缘 ${sign}${changes.karmaChange.goodDeeds}`);
      }
      if (changes.karmaChange.karmicDebt) {
        const sign = changes.karmaChange.karmicDebt > 0 ? '+' : '';
        messages.push(`因果债 ${sign}${changes.karmaChange.karmicDebt}`);
      }
    }
    
    // Relationship changes
    if (changes.relationshipChanges) {
      // 处理 Map 或普通对象两种格式
      const relationshipMap = changes.relationshipChanges instanceof Map 
        ? changes.relationshipChanges 
        : new Map(Object.entries(changes.relationshipChanges));
      
      if (relationshipMap.size > 0) {
        relationshipMap.forEach((value, npcId) => {
          const sign = value > 0 ? '+' : '';
          messages.push(`与${npcId}关系 ${sign}${value}`);
        });
      }
    }
    }
    
    // Display all changes as a notification
    if (messages.length > 0) {
      const message = messages.join(', ');
      showNotification(message, 'success');
    }
  },
  
  /**
   * 清空事件显示
   */
  clearEvent() {
    const titleElement = document.getElementById('event-title');
    const descriptionElement = document.getElementById('event-description');
    
    if (titleElement) {
      titleElement.textContent = '';
    }
    
    if (descriptionElement) {
      descriptionElement.innerHTML = '';
    }
  },
  
  /**
   * 清空选项显示
   */
  clearOptions() {
    const optionsSection = document.getElementById('options-section');
    if (optionsSection) {
      optionsSection.innerHTML = '';
    }
  },
  
  /**
   * 显示行动反馈
   */
  showActionFeedback(text) {
    const feedbackElement = document.getElementById('action-feedback');
    if (feedbackElement) {
      feedbackElement.innerHTML = `<div class="feedback-text">${text}</div>`;
      feedbackElement.classList.add('show');
      
      // 3秒后淡出
      setTimeout(() => {
        feedbackElement.classList.remove('show');
      }, 3000);
    }
  },
  
  /**
   * 渲染游戏结局
   */
  renderEnding(endingData) {
    console.log('渲染游戏结局:', endingData);
    
    // 显示结局标题和描述
    const titleElement = document.getElementById('event-title');
    const descriptionElement = document.getElementById('event-description');
    
    if (titleElement) {
      titleElement.textContent = endingData.title;
    }
    
    if (descriptionElement) {
      let endingHTML = `<div class="ending-description">${endingData.description.replace(/\n/g, '<br>')}</div>`;
      
      // 显示达成度（如果有）
      if (endingData.progress) {
        const isNew = endingData.progress.isFirstTime;
        endingHTML += `
          <div class="ending-progress">
            <div class="progress-header">
              ${isNew ? '<span class="new-ending-badge">🎉 首次达成！</span>' : ''}
              <span class="progress-label">结局收集进度</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${endingData.progress.percentage}%"></div>
              <div class="progress-text">${endingData.progress.unlockedCount}/${endingData.progress.totalCount} (${endingData.progress.percentage}%)</div>
            </div>
          </div>
        `;
      }
      
      // 显示成就
      if (endingData.achievements && endingData.achievements.length > 0) {
        endingHTML += '<div class="achievements-section"><h4>🏆 达成成就</h4><ul>';
        endingData.achievements.forEach(achievement => {
          endingHTML += `<li>${achievement}</li>`;
        });
        endingHTML += '</ul></div>';
      }
      
      // 显示最终统计
      if (endingData.finalStats) {
        const stats = endingData.finalStats;
        endingHTML += '<div class="final-stats-section"><h4>📊 最终数据</h4><ul>';
        endingHTML += `<li>修为境界: ${stats.cultivationLevel}</li>`;
        endingHTML += `<li>修炼年数: ${stats.age}年</li>`;
        endingHTML += `<li>灵石: ${stats.spiritStones}</li>`;
        endingHTML += `<li>正道声望: ${stats.righteousReputation}</li>`;
        endingHTML += `<li>魔道声望: ${stats.demonicReputation}</li>`;
        endingHTML += `<li>人际关系: ${stats.relationshipsCount}个</li>`;
        endingHTML += '</ul></div>';
      }
      
      descriptionElement.innerHTML = endingHTML;
    }
    
    // 清空选项区域，显示结局按钮
    const optionsSection = document.getElementById('options-section');
    if (optionsSection) {
      optionsSection.innerHTML = `
        <div class="ending-buttons">
          <button class="button button-primary" id="btn-ending-restart">🔄 重新开始</button>
          <button class="button" id="btn-view-achievements">🏆 查看成就</button>
          <button class="button" id="btn-ending-welcome">🏠 返回主菜单</button>
        </div>
      `;
      
      // 绑定按钮事件
      document.getElementById('btn-ending-restart')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'restart' });
        showWelcomeScreen();
        appState.gameState = null;
        UIRenderer.clearEvent();
        UIRenderer.clearOptions();
        UIRenderer.renderTime(null);
        document.getElementById('game-stats').innerHTML = '';
        showNotification('已重置游戏，请开始新游戏', 'success');
      });
      
      document.getElementById('btn-view-achievements')?.addEventListener('click', () => {
        showAchievementsPanel();
      });
      
      document.getElementById('btn-ending-welcome')?.addEventListener('click', () => {
        showWelcomeScreen();
        UIRenderer.clearEvent();
        UIRenderer.clearOptions();
        UIRenderer.renderTime(null);
        document.getElementById('game-stats').innerHTML = '';
      });
    }
  }
};

/**
 * Update game state display (legacy function for compatibility)
 * Implements Requirement 17.4, 17.5
 */
function updateGameState(state) {
  UIRenderer.renderGameState(state);
}

/**
 * Update event description (legacy function for compatibility)
 * Implements Requirement 17.6
 */
function updateEventDescription(event) {
  UIRenderer.renderEvent(event);
}

/**
 * Update options display (legacy function for compatibility)
 * Implements Requirement 17.8
 */
function updateOptions(options) {
  UIRenderer.renderOptions(options);
}

/**
 * Select an option
 * Implements Requirement 1.4
 */
function selectOption(optionId) {
  console.log('=== selectOption 被调用 ===');
  console.log('选择选项 ID:', optionId);
  console.log('选项 ID 类型:', typeof optionId);
  console.log('选项 ID 长度:', optionId ? optionId.length : 0);
  
  vscode.postMessage({
    type: 'action',
    payload: { actionId: optionId }
  });
  
  console.log('消息已发送到后端');
}

/**
 * Handle messages from extension
 * Implements Requirement 21.7
 */
window.addEventListener('message', event => {
  const message = event.data;
  console.log('收到后端消息:', message);
  
  switch (message.type) {
    case 'init':
      console.log('初始化消息:', message.payload);
      showNotification(message.payload.message, 'success');
      break;
      
    case 'gameInitialized':
      // Game successfully initialized, show game screen
      showGameScreen();
      showNotification('游戏初始化成功！', 'success');
      break;
      
    case 'stateUpdate':
      // Update game state display (Requirement 17.4, 17.5)
      appState.gameState = message.payload;
      UIRenderer.renderGameState(message.payload);
      
      // Render state changes if provided
      if (message.payload.changes) {
        UIRenderer.renderStateChanges(message.payload.changes);
      }
      break;
      
    case 'options':
      // Render options (Requirement 17.8)
      UIRenderer.renderOptions(message.payload);
      break;
      
    case 'event':
      // Render event (Requirement 17.6)
      UIRenderer.renderEvent(message.payload);
      break;
      
    case 'ending':
      // 游戏结局
      UIRenderer.renderEnding(message.payload);
      break;
      
    case 'notification':
      showNotification(message.payload.message, message.payload.type);
      break;
      
    case 'history':
      renderHistoryPanel(message.payload);
      break;
      
    case 'achievements':
      renderAchievementsPanel(message.payload);
      break;
      
    case 'actionFeedback':
      // 显示行动反馈
      UIRenderer.showActionFeedback(message.payload.text);
      break;
    
    case 'clearEvent':
      // 清除事件显示
      UIRenderer.clearEvent();
      break;
      
    case 'restart':
      // 后端已重置，前端也重置到欢迎界面
      showWelcomeScreen();
      appState.gameState = null;
      UIRenderer.clearEvent();
      UIRenderer.clearOptions();
      UIRenderer.renderTime(null);
      document.getElementById('game-stats').innerHTML = '';
      break;
      
    case 'newGame':
      showNotification('开始新游戏', 'success');
      // Clear displays
      UIRenderer.clearEvent();
      UIRenderer.clearOptions();
      break;
      
    case 'loadGame':
      showNotification('加载游戏', 'success');
      break;
      
    case 'stateChanges':
      // Render state changes notification (Requirement 17.7, 14.4)
      UIRenderer.renderStateChanges(message.payload);
      break;
      
    default:
      console.log('未知消息类型:', message.type);
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

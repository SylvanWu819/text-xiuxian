/**
 * Cultivation Simulator - Frontend Script
 * Implements Requirements 21.3, 21.6, 21.7 - Message communication between Webview and Extension
 * Task 17.1: Welcome screen and character creation interface
 */

// Get VS Code API
let vscode;
try {
  vscode = acquireVsCodeApi();
  console.log('✅ VS Code API 获取成功');
} catch (error) {
  console.error('❌ VS Code API 获取失败:', error);
  // 创建一个模拟的 vscode 对象用于测试
  vscode = {
    postMessage: (msg) => console.log('模拟 postMessage:', msg),
    getState: () => ({}),
    setState: (state) => console.log('模拟 setState:', state)
  };
}

// Application state
let appState = {
  initialized: false,
  gameState: null,
  selectedPathId: null,
  fontSettings: {
    size: '13px',  // 默认13px
    family: 'default'
  },
  actionLog: []  // 行动日志
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
  console.log('=== attachWelcomeListeners 开始 ===');
  
  // New game button
  const btnNewGame = document.getElementById('btn-new-game');
  console.log('btn-new-game 元素:', btnNewGame);
  if (btnNewGame) {
    btnNewGame.addEventListener('click', () => {
      console.log('✅ 开始新游戏按钮被点击');
      showCharacterCreation();
    });
    console.log('✅ btn-new-game 事件已绑定');
  } else {
    console.error('❌ btn-new-game 元素不存在！');
  }
  
  // Continue game button
  const btnContinue = document.getElementById('btn-continue-game');
  console.log('btn-continue-game 元素:', btnContinue);
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      console.log('✅ 继续游戏按钮被点击');
      continueGame();
    });
    console.log('✅ btn-continue-game 事件已绑定');
  } else {
    console.error('❌ btn-continue-game 元素不存在！');
  }
  
  // 检查是否有存档，如果有则启用继续游戏按钮
  checkSaveExists();
  
  // How to play button
  const btnHowToPlay = document.getElementById('btn-how-to-play');
  console.log('btn-how-to-play 元素:', btnHowToPlay);
  if (btnHowToPlay) {
    btnHowToPlay.addEventListener('click', () => {
      console.log('✅ 玩法说明按钮被点击');
      showHowToPlayPanel();
    });
    console.log('✅ btn-how-to-play 事件已绑定');
  } else {
    console.error('❌ btn-how-to-play 元素不存在！');
  }
  
  console.log('=== attachWelcomeListeners 完成 ===');
}

/**
 * Attach character creation event listeners
 * Task 17.1: 实现角色创建交互
 * Implements Requirements 18.4, 18.5, 2.1-2.5
 */
function attachCharacterCreationListeners() {
  console.log('=== attachCharacterCreationListeners 开始 ===');
  
  // Player name input
  const nameInput = document.getElementById('player-name');
  console.log('player-name 元素:', nameInput);
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      validateCharacterCreation();
    });
    console.log('✅ player-name 事件已绑定');
  } else {
    console.error('❌ player-name 元素不存在！');
  }
  
  // Cultivation path selection
  const pathCards = document.querySelectorAll('.path-card');
  console.log('path-card 元素数量:', pathCards.length);
  pathCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      const pathId = card.getAttribute('data-path-id');
      console.log(`✅ 修行方向卡片 ${index + 1} 被点击, pathId:`, pathId);
      selectCultivationPath(pathId);
    });
  });
  console.log('✅ 所有 path-card 事件已绑定');
  
  // Start game button
  const btnStartGame = document.getElementById('btn-start-game');
  console.log('btn-start-game 元素:', btnStartGame);
  if (btnStartGame) {
    btnStartGame.addEventListener('click', () => {
      console.log('✅ 开始修仙按钮被点击');
      startGame();
    });
    console.log('✅ btn-start-game 事件已绑定');
  } else {
    console.error('❌ btn-start-game 元素不存在！');
  }
  
  // Back to welcome button
  const btnBackWelcome = document.getElementById('btn-back-welcome');
  console.log('btn-back-welcome 元素:', btnBackWelcome);
  if (btnBackWelcome) {
    btnBackWelcome.addEventListener('click', () => {
      console.log('✅ 返回按钮被点击');
      showWelcomeScreen();
    });
    console.log('✅ btn-back-welcome 事件已绑定');
  } else {
    console.error('❌ btn-back-welcome 元素不存在！');
  }
  
  console.log('=== attachCharacterCreationListeners 完成 ===');
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
  
  // 加载上次使用的道号
  const savedName = vscode.getState()?.lastPlayerName || '';
  const nameInput = document.getElementById('player-name');
  if (nameInput && savedName) {
    nameInput.value = savedName;
    // 如果有保存的道号，触发验证
    validateCharacterCreation();
  } else if (nameInput) {
    nameInput.value = '';
  }
  
  appState.selectedPathId = null;
  
  // Deselect all path cards
  document.querySelectorAll('.path-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Disable start button if no path selected
  document.getElementById('btn-start-game').disabled = !savedName || !appState.selectedPathId;
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
  document.getElementById('btn-toggle-stats').disabled = true;
}

/**
 * Toggle detailed stats panel
 */
function toggleDetailedStats() {
  const detailedStats = document.getElementById('detailed-stats');
  const btnToggleStats = document.getElementById('btn-toggle-stats');
  
  if (detailedStats) {
    const isHidden = detailedStats.style.display === 'none';
    detailedStats.style.display = isHidden ? 'block' : 'none';
    
    // 更新按钮文本
    if (btnToggleStats) {
      const icon = btnToggleStats.querySelector('.icon');
      if (icon) {
        icon.textContent = isHidden ? '📊' : '📊';
      }
      btnToggleStats.title = isHidden ? '收起面板' : '详细面板';
    }
  }
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
  document.getElementById('btn-toggle-stats').disabled = false;
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
  
  // 保存道号到本地状态
  const currentState = vscode.getState() || {};
  vscode.setState({
    ...currentState,
    lastPlayerName: playerName
  });
  
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
  console.log('=== attachToolbarListeners 开始 ===');
  
  const btnHowToPlayToolbar = document.getElementById('btn-how-to-play-toolbar');
  const btnFont = document.getElementById('btn-font');
  const btnSave = document.getElementById('btn-save');
  const btnRestart = document.getElementById('btn-restart');
  const btnHistory = document.getElementById('btn-history');
  const btnAchievements = document.getElementById('btn-achievements');
  
  console.log('工具栏按钮元素:');
  console.log('  btn-how-to-play-toolbar:', btnHowToPlayToolbar);
  console.log('  btn-font:', btnFont);
  console.log('  btn-save:', btnSave);
  console.log('  btn-restart:', btnRestart);
  console.log('  btn-history:', btnHistory);
  console.log('  btn-achievements:', btnAchievements);
  
  if (btnHowToPlayToolbar) {
    btnHowToPlayToolbar.addEventListener('click', showHowToPlayPanel);
    console.log('✅ btn-how-to-play-toolbar 事件已绑定');
  }
  
  if (btnFont) {
    btnFont.addEventListener('click', showFontPanel);
    console.log('✅ btn-font 事件已绑定');
  }
  
  if (btnSave) {
    btnSave.addEventListener('click', quickSave);
    console.log('✅ btn-save 事件已绑定');
  }
  
  if (btnRestart) {
    btnRestart.addEventListener('click', confirmRestart);
    console.log('✅ btn-restart 事件已绑定');
  }
  
  if (btnHistory) {
    btnHistory.addEventListener('click', showHistoryPanel);
    console.log('✅ btn-history 事件已绑定');
  }
  
  if (btnAchievements) {
    btnAchievements.addEventListener('click', showAchievementsPanel);
    console.log('✅ btn-achievements 事件已绑定');
  }
  
  const btnActionLog = document.getElementById('btn-action-log');
  if (btnActionLog) {
    btnActionLog.addEventListener('click', showActionLogPanel);
    console.log('✅ btn-action-log 事件已绑定');
  }
  
  const btnToggleStats = document.getElementById('btn-toggle-stats');
  if (btnToggleStats) {
    btnToggleStats.addEventListener('click', toggleDetailedStats);
    console.log('✅ btn-toggle-stats 事件已绑定');
  }
  
  console.log('=== attachToolbarListeners 完成 ===');
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
 * Check if save exists
 */
function checkSaveExists() {
  console.log('检查是否有存档');
  vscode.postMessage({
    type: 'checkSave'
  });
}

/**
 * Continue game (load quick save)
 */
function continueGame() {
  console.log('继续游戏');
  vscode.postMessage({
    type: 'load',
    payload: { slotId: 1 } // 使用快速存档槽位1
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
 * Show action log panel
 */
function showActionLogPanel() {
  console.log('显示行动日志');
  
  const panel = document.createElement('div');
  panel.className = 'modal-overlay';
  
  // 格式化日志
  const logHTML = appState.actionLog.length > 0
    ? appState.actionLog.slice().reverse().map((entry, index) => `
        <div class="log-entry">
          <div class="log-header">
            <span class="log-time">${entry.timestamp}</span>
            <span class="log-index">#${appState.actionLog.length - index}</span>
          </div>
          <div class="log-action">
            <span class="log-label">行动：</span>
            <span class="log-value">${entry.action}</span>
          </div>
          <div class="log-result">
            <span class="log-label">结果：</span>
            <span class="log-value">${entry.result}</span>
          </div>
        </div>
      `).join('')
    : '<p class="empty-message">暂无行动记录</p>';
  
  panel.innerHTML = `
    <div class="modal-content action-log-panel">
      <h3>📋 行动日志</h3>
      <div class="log-controls">
        <button id="btn-clear-log" class="button button-small">清空日志</button>
        <button id="btn-export-log" class="button button-small">导出日志</button>
      </div>
      <div class="log-list">
        ${logHTML}
      </div>
      <div class="modal-buttons">
        <button id="btn-close-log" class="button">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // 绑定按钮事件
  document.getElementById('btn-close-log')?.addEventListener('click', () => {
    panel.remove();
  });
  
  document.getElementById('btn-clear-log')?.addEventListener('click', () => {
    if (confirm('确定要清空所有日志吗？')) {
      appState.actionLog = [];
      panel.remove();
      showNotification('日志已清空', 'success');
    }
  });
  
  document.getElementById('btn-export-log')?.addEventListener('click', () => {
    if (appState.actionLog.length === 0) {
      showNotification('没有日志可导出', 'info');
      return;
    }
    
    // 生成文本格式的日志
    const logText = appState.actionLog.map((entry, index) => 
      `[${index + 1}] ${entry.timestamp}\n行动：${entry.action}\n结果：${entry.result}\n`
    ).join('\n');
    
    // 复制到剪贴板
    navigator.clipboard.writeText(logText).then(() => {
      showNotification('日志已复制到剪贴板', 'success');
    }).catch(() => {
      showNotification('复制失败，请手动复制', 'error');
    });
  });
  
  // Close on overlay click
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.remove();
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
 * Show action result in dedicated area
 */
function showActionResult(resultText) {
  const resultSection = document.getElementById('action-result-section');
  const resultContent = document.getElementById('result-content');
  
  if (resultSection && resultContent) {
    resultContent.innerHTML = resultText.replace(/\n/g, '<br>');
    resultSection.style.display = 'block';
    
    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Clear action result
 */
function clearActionResult() {
  const resultSection = document.getElementById('action-result-section');
  const resultContent = document.getElementById('result-content');
  
  if (resultSection && resultContent) {
    resultContent.innerHTML = '';
    resultSection.style.display = 'none';
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // 支持多行文本显示
  if (message.includes('\n')) {
    notification.innerHTML = message.split('\n').map(line => 
      line ? `<div>${line}</div>` : '<div style="height: 0.5em;"></div>'
    ).join('');
  } else {
    notification.textContent = message;
  }
  
  document.body.appendChild(notification);
  
  // 根据消息类型和长度调整显示时长
  let duration = 2000;
  if (type === 'info') {
    // info类型的消息显示更久
    const lineCount = message.split('\n').length;
    duration = Math.max(3000, lineCount * 500); // 每行至少500ms，最少3秒
  } else if (type === 'error') {
    duration = 4000; // 错误消息显示4秒
  }
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, duration);
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
          <p class="guide-note">💡 v2.5.2版本新增背包系统，可在面板中查看道具。</p>
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
   * 获取修行方向中文名称
   */
  getCultivationPathName(pathId) {
    const pathNames = {
      'sword': '剑修',
      'body': '体修',
      'alchemy': '丹修',
      'formation': '阵修'
    };
    return pathNames[pathId] || pathId;
  },
  
  /**
   * 获取事件类型中文名称
   */
  getEventTypeName(type) {
    const typeNames = {
      'fortune': '机缘',
      'crisis': '危机',
      'npc': 'NPC遭遇',
      'quest': '任务',
      'story': '剧情',
      'system': '系统',
      'daily': '日常',
      'minor': '小事件'
    };
    return typeNames[type] || type;
  },
  
  /**
   * 获取势力中文名称
   */
  getFactionName(factionId) {
    const factionNames = {
      'righteous_sect': '正道宗门',
      'demonic_sect': '魔道宗门',
      'neutral': '中立势力',
      'unknown': '未知势力'
    };
    return factionNames[factionId] || factionId;
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
    
    // Build stats HTML with enhanced visualization
    const statsHTML = [];
    
    // 始终显示：修为和战力
    // Cultivation level and experience with progress bar
    if (state.cultivation) {
      const level = this.getCultivationLevelName(state.cultivation.level);
      const exp = state.cultivation.experience || 0;
      const maxExp = state.cultivation.maxExperience || 100;
      const progress = Math.min(100, (exp / maxExp) * 100);
      const progressColor = progress > 80 ? '#4ec9b0' : progress > 50 ? '#dcdcaa' : '#ce9178';
      
      statsHTML.push(`
        <div class="stat-group">
          <div class="stat-header">
            <span class="stat-icon">⚡</span>
            <span class="stat-label">修为</span>
            <span class="stat-value">${level}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progress}%; background-color: ${progressColor};"></div>
            <div class="progress-text">${exp}/${maxExp}</div>
          </div>
        </div>
      `);
    }
    
    // Combat Power (new feature)
    if (state.combatPower !== undefined) {
      const powerLevel = this.getPowerLevel(state.combatPower);
      statsHTML.push(`
        <div class="stat-line stat-highlight">
          <span class="stat-icon">⚔️</span>
          <span class="stat-label">战力</span>
          <span class="stat-value stat-power" title="${powerLevel.description}">${state.combatPower} <span class="power-level">${powerLevel.level}</span></span>
        </div>
      `);
    }
    
    // 折叠的详细信息
    const detailsHTML = this.renderDetailedStats(state);
    
    statsElement.innerHTML = statsHTML.join('') + detailsHTML;
  },
  
  /**
   * 渲染详细统计信息（折叠部分）
   */
  renderDetailedStats(state) {
    const detailsHTML = [];
    
    // Resources
    if (state.resources) {
      detailsHTML.push(`
        <div class="stat-line">
          <span class="stat-icon">💎</span>
          <span class="stat-label">灵石</span>
          <span class="stat-value">${state.resources.spiritStones || 0}</span>
        </div>
      `);
    }
    
    // Lifespan with progress bar and warning
    if (state.lifespan) {
      const current = Math.floor(state.lifespan.current || 0);
      const max = state.lifespan.max || 0;
      const lifespanPercent = Math.min(100, (current / max) * 100);
      const lifespanColor = lifespanPercent < 20 ? '#f48771' : lifespanPercent < 50 ? '#dcdcaa' : '#4ec9b0';
      const lifespanWarning = lifespanPercent < 20 ? ' ⚠️' : '';
      
      detailsHTML.push(`
        <div class="stat-group">
          <div class="stat-header">
            <span class="stat-icon">💚</span>
            <span class="stat-label">寿命${lifespanWarning}</span>
            <span class="stat-value">${current}/${max}年</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${lifespanPercent}%; background-color: ${lifespanColor};"></div>
          </div>
        </div>
      `);
    }
    
    // Reputation with visual indicators
    if (state.reputation) {
      const righteous = state.reputation.righteous || 0;
      const demonic = state.reputation.demonic || 0;
      const tendency = righteous > demonic ? '正道' : demonic > righteous ? '魔道' : '中立';
      const tendencyColor = righteous > demonic ? '#4ec9b0' : demonic > righteous ? '#f48771' : '#858585';
      
      detailsHTML.push(`
        <div class="stat-group">
          <div class="stat-header">
            <span class="stat-icon">⚖️</span>
            <span class="stat-label">声望倾向</span>
            <span class="stat-value" style="color: ${tendencyColor};">${tendency}</span>
          </div>
          <div class="stat-line-compact">
            <span class="stat-sublabel">正道</span>
            <span class="stat-subvalue">${righteous}</span>
          </div>
          <div class="stat-line-compact">
            <span class="stat-sublabel">魔道</span>
            <span class="stat-subvalue">${demonic}</span>
          </div>
        </div>
      `);
    }
    
    // Karma with balance indicator
    if (state.karma) {
      const goodDeeds = state.karma.goodDeeds || 0;
      const karmicDebt = state.karma.karmicDebt || 0;
      const karmaBalance = goodDeeds - karmicDebt;
      const karmaStatus = karmaBalance > 50 ? '功德圆满' : karmaBalance > 0 ? '善缘充足' : karmaBalance > -50 ? '业力缠身' : '因果深重';
      const karmaColor = karmaBalance > 50 ? '#4ec9b0' : karmaBalance > 0 ? '#dcdcaa' : karmaBalance > -50 ? '#ce9178' : '#f48771';
      
      detailsHTML.push(`
        <div class="stat-group">
          <div class="stat-header">
            <span class="stat-icon">🙏</span>
            <span class="stat-label">因果</span>
            <span class="stat-value" style="color: ${karmaColor};">${karmaStatus}</span>
          </div>
          <div class="stat-line-compact">
            <span class="stat-sublabel">善缘</span>
            <span class="stat-subvalue">${goodDeeds}</span>
          </div>
          <div class="stat-line-compact">
            <span class="stat-sublabel">业力</span>
            <span class="stat-subvalue">${karmicDebt}</span>
          </div>
        </div>
      `);
    }
    
    // Inventory/Items (背包)
    if (state.resources && state.resources.items) {
      const itemsArray = Array.from(state.resources.items || []);
      const hasItems = itemsArray.length > 0;
      
      let itemsListHTML = '';
      if (hasItems) {
        itemsListHTML = itemsArray.map(([itemId, count]) => {
          // 简单的道具名称映射（可以后续扩展）
          const itemName = this.getItemName(itemId);
          return `
            <div class="stat-line-compact">
              <span class="stat-sublabel">${itemName}</span>
              <span class="stat-subvalue">×${count}</span>
            </div>
          `;
        }).join('');
      } else {
        itemsListHTML = '<div class="stat-line-compact"><span class="stat-sublabel" style="color: #858585;">暂无道具</span></div>';
      }
      
      detailsHTML.push(`
        <div class="stat-group">
          <div class="stat-header">
            <span class="stat-icon">🎒</span>
            <span class="stat-label">背包</span>
            <span class="stat-value">${itemsArray.length}种</span>
          </div>
          ${itemsListHTML}
        </div>
      `);
    }
    
    // 包装在可折叠容器中
    return `
      <div class="detailed-stats" id="detailed-stats" style="display: none;">
        ${detailsHTML.join('')}
      </div>
    `;
  },
  
  /**
   * 获取战力等级描述
   */
  getPowerLevel(power) {
    if (power >= 100000) return { level: '通天', description: '战力通天，无人能敌' };
    if (power >= 50000) return { level: '绝世', description: '绝世强者，威震一方' };
    if (power >= 20000) return { level: '顶尖', description: '顶尖高手，罕逢敌手' };
    if (power >= 10000) return { level: '一流', description: '一流强者，实力不俗' };
    if (power >= 5000) return { level: '二流', description: '二流高手，小有名气' };
    if (power >= 2000) return { level: '三流', description: '三流修士，初窥门径' };
    if (power >= 800) return { level: '入门', description: '刚入门径，仍需努力' };
    if (power >= 300) return { level: '初学', description: '初学乍练，实力尚浅' };
    return { level: '凡人', description: '凡人之躯，毫无战力' };
  },
  
  /**
   * 获取道具中文名称
   */
  getItemName(itemId) {
    const itemNames = {
      // 丹药类
      'healing_pill': '疗伤丹',
      'qi_refining_pill': '炼气丹',
      'foundation_pill': '筑基丹',
      'golden_core_pill': '金丹',
      'breakthrough_pill': '破境丹',
      'life_extension_pill': '延寿丹',
      
      // 材料类
      'spirit_herb': '灵草',
      'spirit_stone_ore': '灵石矿',
      'rare_metal': '稀有金属',
      'ancient_jade': '古玉',
      
      // 法器类
      'flying_sword': '飞剑',
      'spirit_armor': '灵甲',
      'talisman': '符箓',
      'formation_disk': '阵盘',
      
      // 特殊道具
      'ancient_scroll': '古卷',
      'treasure_map': '藏宝图',
      'spirit_beast_egg': '灵兽蛋',
      'immortal_token': '仙令',
      
      // 默认
      'default': '未知道具'
    };
    
    return itemNames[itemId] || itemId;
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
      // 验证option.id是否存在且有效
      if (!option.id || typeof option.id !== 'string' || option.id.trim() === '') {
        console.error(`选项 ${index + 1} 的ID无效:`, option);
        return ''; // 跳过无效选项
      }
      
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
                data-option-index="${index}"
                ${disabledAttr}
                title="${disabled ? '不满足要求' : option.text}">
          <span class="option-number">${index + 1}</span>
          <div class="option-text">${option.text}</div>
          ${descriptionHTML}
          ${requirementsHTML}
          ${errorHTML}
        </button>
      `;
    }).filter(html => html !== '').join(''); // 过滤掉空字符串
    
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
      const optionIndex = button.getAttribute('data-option-index');
      console.log(`  按钮 ${index + 1}: optionId="${optionId}", index=${optionIndex}, disabled=${button.disabled}`);
      
      // 验证optionId
      if (!optionId || optionId === 'undefined' || optionId === 'null') {
        console.error(`按钮 ${index + 1} 的optionId无效: "${optionId}"`);
        button.disabled = true;
        button.classList.add('option-disabled');
        return;
      }
      
      button.addEventListener('click', (event) => {
        console.log(`按钮被点击: optionId="${optionId}", disabled=${button.disabled}`);
        event.preventDefault();
        event.stopPropagation();
        
        if (optionId && optionId !== 'undefined' && optionId !== 'null' && !button.disabled) {
          // 添加点击反馈
          button.classList.add('option-clicked');
          
          // 禁用所有按钮，防止重复点击
          buttons.forEach(btn => btn.disabled = true);
          
          console.log(`调用 selectOption("${optionId}")`);
          selectOption(optionId);
          
          // 短暂延迟后移除点击效果
          setTimeout(() => {
            button.classList.remove('option-clicked');
          }, 300);
        } else {
          console.warn(`按钮被禁用或optionId无效: optionId="${optionId}", disabled=${button.disabled}`);
          
          // 禁用按钮的反馈
          if (button.disabled) {
            showNotification('不满足该选项的要求', 'error');
            button.classList.add('option-shake');
            setTimeout(() => {
              button.classList.remove('option-shake');
            }, 500);
          } else {
            showNotification('选项ID无效，请刷新页面', 'error');
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
  
  // 记录选项到日志（在发送前记录选项文本）
  const optionButton = document.querySelector(`[data-option-id="${optionId}"]`);
  if (optionButton) {
    const optionText = optionButton.querySelector('.option-text')?.textContent || optionId;
    const timestamp = new Date().toLocaleString('zh-CN');
    
    // 添加到日志（结果会在收到反馈后添加）
    appState.actionLog.push({
      timestamp,
      action: optionText,
      actionId: optionId,
      result: '执行中...'
    });
  }
  
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
      clearActionResult(); // 清除之前的结果
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
      const notificationMsg = message.payload.message;
      const notificationType = message.payload.type;
      
      // 如果是info类型且包含行动结果，显示在结果区域
      if (notificationType === 'info' && notificationMsg.includes('行动结果')) {
        showActionResult(notificationMsg);
      } else {
        showNotification(notificationMsg, notificationType);
      }
      
      // 如果是行动结果的通知，更新日志
      if (appState.actionLog.length > 0) {
        const lastLog = appState.actionLog[appState.actionLog.length - 1];
        if (lastLog.result === '执行中...') {
          lastLog.result = notificationMsg;
        }
      }
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
      
    case 'saveExists':
      // 存档存在，启用继续游戏按钮
      const btnContinue = document.getElementById('btn-continue-game');
      if (btnContinue) {
        btnContinue.disabled = !message.payload.exists;
        if (message.payload.exists && message.payload.info) {
          const info = message.payload.info;
          btnContinue.title = `继续游戏 - ${info.playerName} (${info.cultivationLevel})`;
        }
      }
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

@echo off
chcp 65001 >nul
echo ========================================
echo 🎁 修仙模拟器 - 一键打包工具
echo ========================================
echo.

echo [1/4] 检查编译产物...
if not exist "out\extension.js" (
    echo ❌ 编译产物不存在，正在编译...
    call npm run compile
    if errorlevel 1 (
        echo ❌ 编译失败！
        pause
        exit /b 1
    )
) else (
    echo ✅ 编译产物已存在
)
echo.

echo [2/4] 检查 vsce 工具...
where vsce >nul 2>&1
if errorlevel 1 (
    echo ⚠️  vsce 未安装，尝试使用 npx...
    set USE_NPX=1
) else (
    echo ✅ vsce 已安装
    set USE_NPX=0
)
echo.

echo [3/4] 开始打包...
if %USE_NPX%==1 (
    echo 使用 npx 打包...
    npx @vscode/vsce package --allow-missing-repository --allow-star-activation
) else (
    echo 使用 vsce 打包...
    vsce package --allow-missing-repository --allow-star-activation
)

if errorlevel 1 (
    echo.
    echo ❌ 打包失败！
    echo.
    echo 可能的原因：
    echo 1. npm 环境有问题
    echo 2. vsce 安装失败
    echo 3. 缺少必需文件
    echo.
    echo 💡 建议：
    echo 1. 使用 F5 开发模式（最简单）
    echo 2. 查看 "手动打包教程.md" 了解其他方法
    echo 3. 以管理员身份运行此脚本
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] 打包完成！
echo.
echo ✅ 成功生成 .vsix 文件！
echo.
echo 📦 安装方法：
echo    code --install-extension cultivation-simulator-1.0.0.vsix
echo.
echo 或在 VSCode 中：
echo    1. 打开扩展面板 (Ctrl+Shift+X)
echo    2. 点击右上角 "..." 菜单
echo    3. 选择 "从 VSIX 安装..."
echo    4. 选择生成的 .vsix 文件
echo.
echo ========================================
echo 🎮 准备好开始你的修仙之旅了！
echo ========================================
pause

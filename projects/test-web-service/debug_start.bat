@echo off
REM 调试版启动脚本
echo ==========================================
echo         调试版服务启动脚本
echo ==========================================

REM 记录启动日志
set LOG_FILE=%~dp0startup.log
echo [%date% %time%] 开始启动服务 > "%LOG_FILE%"
echo 当前用户: %USERNAME% >> "%LOG_FILE%"
echo 当前目录: %CD% >> "%LOG_FILE%"
echo 脚本目录: %~dp0 >> "%LOG_FILE%"
echo PATH: %PATH% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM 切换到脚本目录
cd /d "%~dp0"
echo 切换到脚本目录: %CD%
echo [%date% %time%] 切换到目录: %CD% >> "%LOG_FILE%"

REM 检查Python
echo 检查Python环境...
python --version >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python检查失败 >> "%LOG_FILE%"
    echo ❌ Python未安装或未添加到PATH
    echo [%date% %time%] Python检查失败，退出 >> "%LOG_FILE%"
    timeout /t 10 /nobreak >nul
    exit /b 1
) else (
    echo ✅ Python检查通过
    echo [%date% %time%] Python检查通过 >> "%LOG_FILE%"
)

REM 检查和安装依赖
echo 检查依赖...
python -c "import flask, psutil; print('Flask and psutil OK')" >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ 依赖未完整安装，尝试安装...
    echo [%date% %time%] 开始安装依赖 >> "%LOG_FILE%"
    pip install -r requirements.txt >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo [%date% %time%] 依赖安装失败，退出 >> "%LOG_FILE%"
        timeout /t 10 /nobreak >nul
        exit /b 1
    )
) else (
    echo ✅ 依赖检查通过
    echo [%date% %time%] 依赖检查通过 >> "%LOG_FILE%"
)

REM 检查server.py
if not exist "server.py" (
    echo ❌ server.py文件不存在
    echo [%date% %time%] server.py文件不存在，退出 >> "%LOG_FILE%"
    timeout /t 10 /nobreak >nul
    exit /b 1
) else (
    echo ✅ server.py文件存在
    echo [%date% %time%] server.py文件存在 >> "%LOG_FILE%"
)

echo 启动参数检查完成，开始启动服务...
echo [%date% %time%] 开始启动Flask服务器 >> "%LOG_FILE%"
echo.
echo 🚀 启动Flask服务器 (端口: 8848)
echo 📄 日志文件: %LOG_FILE%
echo 🌐 访问地址: http://localhost:8848
echo ⏹️  按 Ctrl+C 停止服务
echo.

REM 启动服务器并记录输出
python server.py >> "%LOG_FILE%" 2>&1

REM 记录退出状态
echo [%date% %time%] 服务器退出，退出码: %errorlevel% >> "%LOG_FILE%"
if %errorlevel% neq 0 (
    echo ❌ 服务启动失败，退出码: %errorlevel%
    echo 请查看日志文件: %LOG_FILE%
    timeout /t 15 /nobreak >nul
)

echo 服务已停止
timeout /t 5 /nobreak >nul

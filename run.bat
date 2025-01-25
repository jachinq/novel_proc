@echo off
REM 激活虚拟环境
call .\venv\Scripts\activate.bat

REM 设置环境变量 PORT
set PORT=8000

REM 运行Python应用
python app.py

REM 可选：在脚本运行完毕后停顿以便查看输出
pause

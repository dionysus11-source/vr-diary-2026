@echo off
chcp 65001 > nul
echo n100-mini-pc에 접속합니다. 비밀번호를 입력해주세요...
ssh dionysus12@n100-mini-pc "d: && cd d:\share\torrent\magic_split\diary && set PYTHONIOENCODING=utf-8 && python manage_investment.py"
pause

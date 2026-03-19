#!/bin/bash
# m4 맥미니용 투자일기 실행 스크립트

echo "n100-mini-pc에 접속합니다. 비밀번호를 입력해주세요..."
ssh dionysus12@n100-mini-pc "d: && cd d:\\share\\torrent\\magic_split\\diary && set PYTHONIOENCODING=utf-8 && python manage_investment.py"

echo ""
echo "엔터키를 누르면 종료됩니다..."
read

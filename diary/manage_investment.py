import pandas as pd
import os
import matplotlib.pyplot as plt
from datetime import datetime
import platform
from pandas.plotting import table
import shutil
import glob

# --- ANSI 색상 코드 정의 ---
class Color:
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    DARKCYAN = '\033[36m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

# --- 1. 환경 설정 ---
def set_korean_font():
    system_name = platform.system()
    try:
        if system_name == "Windows":
            plt.rcParams['font.family'] = 'Malgun Gothic'
        elif system_name == "Darwin":
            plt.rcParams['font.family'] = 'AppleGothic'
        else:
            plt.rcParams['font.family'] = 'NanumGothic'
        plt.rcParams['axes.unicode_minus'] = False
    except:
        pass

set_korean_font()

file_path = 'investment_data.csv'
columns = ['날짜', '투자', '계좌', '총자산', '삼성전자', '매직스플릿']

# --- 2. 유틸리티 함수 ---
def print_logo():
    print(Color.CYAN + Color.BOLD + """
    ╔════════════════════════════════════════════════════╗
    ║                                                    ║
    ║      📊  PERSONAL INVESTMENT DASHBOARD  v2.1       ║
    ║           (Auto-Backup on Exit Enabled)            ║
    ║                                                    ║
    ╚════════════════════════════════════════════════════╝""" + Color.END)

def format_krw(val):
    if pd.isna(val) or val == 0: return "0"
    abs_val = abs(val)
    eok = abs_val // 100000000
    man = (abs_val % 100000000) // 10000
    res = f"{int(eok)}억 " if eok > 0 else ""
    res += f"{int(man):,}만" if man > 0 else ""
    sign = "-" if val < 0 else "+" if val > 0 else ""
    return sign + res.strip() if res else "0"

def load_or_create_df():
    if os.path.exists(file_path):
        df = pd.read_csv(file_path, encoding='utf-8-sig')
        df['날짜'] = pd.to_datetime(df['날짜'])
        return df.sort_values(by='날짜').reset_index(drop=True)
    else:
        # 초기 데이터 설정 (기존 기록 유지)
        df = pd.DataFrame([
            ['2026-01-20', 375295266, 142774159, 518069425, 0, 0],
            ['2026-01-21', 385287585, 143328717, 528616302, 0, 0],
            ['2026-01-22', 393980922, 129256432, 523237354, 223306350, 0]
        ], columns=columns)
        df['날짜'] = pd.to_datetime(df['날짜'])
        df.to_csv(file_path, index=False, encoding='utf-8-sig')
        return df

def auto_backup():
    """종료 시 자동으로 현재 데이터를 백업"""
    if os.path.exists(file_path):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"investment_data_auto_backup_{timestamp}.csv"
        shutil.copy2(file_path, backup_name)
        print(f"\n{Color.GREEN} [시스템] 자동 백업 완료: {backup_name}{Color.END}")

# --- 3. 분석 및 시각화 ---
def analyze_and_save_image(df):
    if df.empty: return
    print(f"\n{Color.BLUE} [안내] 시각화 리포트를 생성 중입니다...{Color.END}")
    
    report_df = df.copy()
    report_df['날짜'] = report_df['날짜'].dt.strftime('%Y-%m-%d')
    for col in ['투자', '계좌', '총자산', '삼성전자', '매직스플릿']:
        diffs = df[col].diff().fillna(0)
        formatted_vals = []
        for idx, val in enumerate(df[col]):
            curr_txt = format_krw(val)
            diff_txt = f"({format_krw(diffs[idx])})" if idx > 0 else "(-)"
            formatted_vals.append(f"{curr_txt}\n{diff_txt}")
        report_df[col] = formatted_vals

    fig_tbl, ax_tbl = plt.subplots(figsize=(14, len(report_df) * 0.8 + 2))
    ax_tbl.axis('off')
    tbl = table(ax_tbl, report_df, loc='center', cellLoc='center', colColours=['#f2f2f2']*6)
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(11)
    tbl.scale(1.0, 3.0)
    plt.title(f"자산 분석 보고서 ({datetime.now().strftime('%Y-%m-%d %H:%M')})", fontsize=16, pad=30)
    plt.savefig("investment_table.png", bbox_inches='tight', dpi=300)
    
    fig_gra, axes = plt.subplots(3, 2, figsize=(12, 15))
    fig_gra.suptitle('항목별 자산 변화 추이', fontsize=16, fontweight='bold')
    target_cols = ['투자', '계좌', '총자산', '삼성전자', '매직스플릿']
    colors = ['royalblue', 'orange', 'green', 'red', 'purple']
    for i, col in enumerate(target_cols):
        ax = axes[i//2, i%2]
        ax.plot(df['날짜'], df[col], marker='o', color=colors[i])
        for j, val in enumerate(df[col]):
            ax.text(df['날짜'][j], val, f"{val/100000000:.2f}억", ha='center', va='bottom', fontsize=8)
        ax.set_title(f'[{col}] 추이')
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig("investment_graph.png", bbox_inches='tight', dpi=300)
    print(f"{Color.GREEN} [성공] 리포트 파일 생성 완료!{Color.END}")

# --- 4. 메인 루프 ---
def main():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print_logo()
        df = load_or_create_df()
        
        print(f" {Color.BOLD}원하시는 메뉴를 선택하세요:{Color.END}")
        print(f" {Color.BLUE}1. 신규 데이터 추가{Color.END}  |  {Color.YELLOW}2. 기존 데이터 수정{Color.END}")
        print(f" {Color.GREEN}3. 종합 분석 및 리포트{Color.END} |  {Color.RED}4. 안전하게 종료{Color.END}")
        print(f"{Color.CYAN}="*56 + Color.END)
        
        menu = input(f" {Color.BOLD}입력 >>{Color.END} ").strip()
        
        if menu == '1':
            date_in = input(f"\n {Color.BOLD}날짜(YYYY-MM-DD, 엔터=오늘):{Color.END} ").strip() or datetime.now().strftime('%Y-%m-%d')
            if date_in in df['날짜'].dt.strftime('%Y-%m-%d').values:
                print(f"{Color.RED} [오류] 이미 데이터가 존재하는 날짜입니다.{Color.END}")
            else:
                try:
                    print(f"{Color.YELLOW}[{date_in}] 데이터 입력{Color.END}")
                    tot = int(input(" ▶ 총자산: ").replace(',', ''))
                    acc = int(input(" ▶ 입출금: ").replace(',', ''))
                    inv = int(input(" ▶ 증권: ").replace(',', ''))
                    sam = int(input(" ▶ 삼성전자: ").replace(',', ''))
                    mag = int(input(" ▶ 매직스플릿: ").replace(',', ''))

                    new_row = [date_in, inv, acc, tot, sam, mag]
                    df = pd.concat([df, pd.DataFrame([new_row], columns=columns)], ignore_index=True)
                    df['날짜'] = pd.to_datetime(df['날짜'])
                    df.sort_values('날짜').to_csv(file_path, index=False, encoding='utf-8-sig')
                    print(f"{Color.GREEN} [성공] 새 데이터가 저장되었습니다.{Color.END}")
                except ValueError:
                    print(f"{Color.RED} [오류] 숫자만 입력 가능합니다.{Color.END}")
        
        elif menu == '2':
            disp = df.iloc[::-1].reset_index()
            print(f"\n {Color.BOLD}[ 수정 대상 목록 (최신순) ]{Color.END}")
            for i, r in disp.iterrows():
                print(f" {i+1}. {r['날짜'].strftime('%Y-%m-%d')} (총액: {format_krw(r['총자산'])})")
            
            try:
                choice = input(f"\n {Color.BOLD}수정할 번호(엔터=1번):{Color.END} ").strip() or "1"
                target_date = disp.loc[int(choice)-1, '날짜']
                print(f"{Color.YELLOW}[{target_date.strftime('%Y-%m-%d')}] 수정 데이터 입력{Color.END}")
                tot = int(input(" ▶ 총자산: ").replace(',', ''))
                acc = int(input(" ▶ 입출금: ").replace(',', ''))
                inv = int(input(" ▶ 증권: ").replace(',', ''))
                sam = int(input(" ▶ 삼성전자: ").replace(',', ''))
                mag = int(input(" ▶ 매직스플릿: ").replace(',', ''))
                
                df.loc[df['날짜'] == target_date, columns[1:]] = [inv, acc, tot, sam, mag]
                df.to_csv(file_path, index=False, encoding='utf-8-sig')
                print(f"{Color.GREEN} [성공] 수정이 완료되었습니다.{Color.END}")
            except:
                print(f"{Color.RED} [오류] 수정 처리에 실패했습니다.{Color.END}")

        elif menu == '3':
            analyze_and_save_image(df)
            
        elif menu == '4':
            auto_backup()
            print(f"\n{Color.CYAN} 안전하게 종료되었습니다. 즐거운 투자 되세요!{Color.END}")
            break
        
        input(f"\n{Color.DARKCYAN}메뉴로 돌아가려면 엔터를 누르세요...{Color.END}")

if __name__ == "__main__":
    main()
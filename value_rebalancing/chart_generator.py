"""
VR 차트 생성기
"""
import os
from typing import List
from datetime import datetime
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib import font_manager, rc
import pandas as pd
from models.record import RebalancingRecord


class ChartGenerator:
    """VR 차트 생성기"""

    def __init__(self):
        """초기화"""
        self.data_dir = "data"
        os.makedirs(self.data_dir, exist_ok=True)

        # 스타일 설정
        plt.style.use('seaborn-v0_8-darkgrid')

    def generate_table_png(self, records: List[RebalancingRecord]) -> str:
        """
        테이블 PNG 생성

        Args:
            records: 기록 리스트

        Returns:
            저장된 파일 경로
        """
        # 데이터프레임 생성
        data = []
        for record in records:
            vr_total = record.e_value + record.pool
            benchmark_diff = vr_total - record.benchmark_value

            data.append({
                'Date': record.date,
                'Close': f"${record.price:.2f}",
                'Shares': f"{record.shares:,}",
                'Pool': f"${record.pool:.2f}",
                'E': f"${record.e_value:.2f}",
                'V': f"${record.v_value:.2f}",
                'Total': f"${vr_total:.2f}",
                'Benchmark': f"${record.benchmark_value:.2f}",
                'Diff': f"${benchmark_diff:+,.2f}",
                'Signal': record.signal
            })

        df = pd.DataFrame(data)

        # 데이터 개수에 따른 동적 크기 조정
        num_records = len(records)
        height = max(6, min(20, 4 + num_records * 0.4))
        width = max(16, min(20, 12 + num_records * 0.1))

        # 폰트 크기 동적 조정
        font_size = max(7, min(10, 12 - num_records * 0.05))

        # 그림 생성
        fig, ax = plt.subplots(figsize=(width, height))
        ax.axis('off')
        ax.axis('tight')

        # 테이블 생성
        table = ax.table(
            cellText=df.values,
            colLabels=df.columns,
            cellLoc='center',
            loc='center',
            colWidths=[0.1] * len(df.columns)
        )

        table.auto_set_font_size(False)
        table.set_fontsize(font_size)
        table.scale(1, 1.5)

        # 헤더 스타일
        for i in range(len(df.columns)):
            table[(0, i)].set_facecolor('#4472C4')
            table[(0, i)].set_text_props(weight='bold', color='white')

        # 신호별 색상
        signal_colors = {
            'BUY': '#00B050',
            'SELL': '#FF0000',
            'HOLD': '#FFC000',
            'INITIAL': '#0070C0'
        }

        for i in range(len(records)):
            signal = records[i].signal
            if signal in signal_colors:
                table[(i + 1, len(df.columns) - 1)].set_facecolor(signal_colors[signal])

        # 저장
        filename = os.path.join(self.data_dir, "vr_table.png")
        plt.tight_layout()
        plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()

        return filename

    def _set_xaxis_interval(self, ax, dates, interval_months: int):
        """
        X축 날짜 간격 설정

        Args:
            ax: matplotlib 축
            dates: 날짜 리스트
            interval_months: 간격 (월 단위)
        """
        import numpy as np

        if interval_months <= 0:
            interval_months = 0.5  # 기본 2주 (0.5달)

        # 간격에 따른 로케이터 설정
        if interval_months < 1:
            # 1달 미만: 주간 단위
            weeks = int(interval_months * 4)
            ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=mdates.MO, interval=weeks))
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        elif interval_months == 1:
            # 1달: 매월 1일
            ax.xaxis.set_major_locator(mdates.MonthLocator(interval=1))
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        else:
            # 2달 이상: N달 간격
            ax.xaxis.set_major_locator(mdates.MonthLocator(interval=interval_months))
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))

        plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')

    def generate_value_comparison_png(self, records: List[RebalancingRecord], interval_months: int = 0.5) -> str:
        """
        V값과 벤치마크 비교 그래프 생성

        Args:
            records: 기록 리스트

        Returns:
            저장된 파일 경로
        """
        # 데이터 추출
        dates = [datetime.strptime(r.date, '%Y-%m-%d') for r in records]
        e_values = [r.e_value for r in records]
        v_values = [r.v_value for r in records]
        pools = [r.pool for r in records]

        # 데이터 개수에 따른 동적 설정
        num_records = len(records)

        # 그래프 크기 동적 조정 (데이터가 많을수록 너비 증가)
        width = max(14, min(20, 10 + num_records * 0.3))
        height = 10
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(width, height))

        # 위쪽 그래프: E값과 V±15% 기준선
        # 데이터가 많으면 마커 크기 조정
        marker_size = max(4, min(8, 12 - num_records * 0.2))
        marker_interval = max(1, num_records // 20)  # 데이터가 많으면 마커 간격 높이기

        line1 = ax1.plot(dates, e_values, '-o', linewidth=2.5, markersize=marker_size,
                         label='E (Evaluation)', color='#2E75B6', markerfacecolor='white', markeredgewidth=2.5,
                         markevery=marker_interval)

        # V±15% 기준선 (각 시점의 V값 기준) - 검은색 점선
        v_upper = [v * 1.15 for v in v_values]
        v_lower = [v * 0.85 for v in v_values]

        ax1.plot(dates, v_upper, '--', linewidth=2, color='black',
                label='V +15% (Upper Bound)', alpha=0.7)
        ax1.plot(dates, v_lower, '--', linewidth=2, color='black',
                label='V -15% (Lower Bound)', alpha=0.7)

        # 축 설정
        ax1.set_xlabel('Date', fontsize=12, fontweight='bold')
        ax1.set_ylabel('Amount ($)', fontsize=12, fontweight='bold')
        ax1.tick_params(axis='both', labelsize=10)
        ax1.grid(True, alpha=0.3)
        ax1.legend(loc='upper left', fontsize=10, framealpha=0.9)

        # X축 날짜 간격 설정 (사용자 선택)
        self._set_xaxis_interval(ax1, dates, interval_months)

        # 제목
        ax1.set_title('E Value with V ±15% Reference Lines', fontsize=12, fontweight='bold', pad=10)

        # 아래쪽 그래프: Pool
        bars = ax2.bar(dates, pools, color='#00B050', alpha=0.7, edgecolor='black', linewidth=1.5)

        # 값 표시 (데이터가 적을 때만)
        if num_records <= 20:
            for bar, pool in zip(bars, pools):
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height,
                        f'${pool:,.0f}',
                        ha='center', va='bottom',
                        fontsize=8, fontweight='bold')
        elif num_records <= 52:  # 1년이면 매월 표시
            for i in range(0, num_records, 4):  # 4주 간격
                height = bars[i].get_height()
                ax2.text(bars[i].get_x() + bars[i].get_width()/2., height,
                        f'${pools[i]:,.0f}',
                        ha='center', va='bottom',
                        fontsize=7, fontweight='bold')

        # 축 설정
        ax2.set_xlabel('Date', fontsize=12, fontweight='bold')
        ax2.set_ylabel('Pool ($)', fontsize=12, fontweight='bold')
        ax2.tick_params(axis='both', labelsize=10)
        ax2.grid(True, alpha=0.3, axis='y')

        # X축 날짜 간격 설정 (위와 동일)
        self._set_xaxis_interval(ax2, dates, interval_months)

        # 제목
        ax2.set_title('Pool (Cash)', fontsize=12, fontweight='bold', pad=10)

        # 전체 제목
        fig.suptitle('VR Analysis: E Value vs V ±15% Bounds', fontsize=16, fontweight='bold', y=0.995)

        # 저장
        filename = os.path.join(self.data_dir, "vr_comparison.png")
        plt.tight_layout()
        plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()

        return filename

    def generate_total_difference_png(self, records: List[RebalancingRecord], interval_months: int = 0.5) -> str:
        """
        VR 총액과 벤치마크 차이 그래프 생성

        Args:
            records: 기록 리스트

        Returns:
            저장된 파일 경로
        """
        # 데이터 추출
        dates = [datetime.strptime(r.date, '%Y-%m-%d') for r in records]
        vr_totals = [r.e_value + r.pool for r in records]
        benchmarks = [r.benchmark_value for r in records]
        differences = [vr_total - benchmark for vr_total, benchmark in zip(vr_totals, benchmarks)]

        # 데이터 개수에 따른 동적 설정
        num_records = len(records)

        # 그래프 크기 동적 조정
        width = max(14, min(20, 10 + num_records * 0.3))
        height = 10
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(width, height))

        # 마커 설정
        marker_size = max(4, min(8, 12 - num_records * 0.2))
        marker_interval = max(1, num_records // 20)

        # 첫 번째 그래프: 총액 비교
        ax1.plot(dates, vr_totals, '-o', linewidth=2.5, markersize=marker_size,
                 label='VR Total (E + Pool)', color='#2E75B6', markerfacecolor='white', markeredgewidth=2.5,
                 markevery=marker_interval)
        ax1.plot(dates, benchmarks, '-s', linewidth=2.5, markersize=marker_size,
                 label='Benchmark Total', color='#ED7D31', markerfacecolor='white', markeredgewidth=2.5,
                 markevery=marker_interval)

        # 영역 채우기
        ax1.fill_between(dates, vr_totals, benchmarks, alpha=0.2, where=[v > b for v, b in zip(vr_totals, benchmarks)],
                         color='green', label='VR Lead')
        ax1.fill_between(dates, vr_totals, benchmarks, alpha=0.2, where=[v < b for v, b in zip(vr_totals, benchmarks)],
                         color='red', label='Benchmark Lead')

        ax1.set_xlabel('Date', fontsize=12, fontweight='bold')
        ax1.set_ylabel('Total Amount ($)', fontsize=12, fontweight='bold')
        ax1.tick_params(axis='both', labelsize=10)
        ax1.grid(True, alpha=0.3)
        ax1.legend(loc='upper left', fontsize=10, framealpha=0.9)

        # X축 날짜 간격 설정
        self._set_xaxis_interval(ax1, dates, interval_months)

        # 두 번째 그래프: 차이
        colors = ['green' if d > 0 else 'red' for d in differences]
        bars = ax2.bar(dates, differences, color=colors, alpha=0.7, edgecolor='black', linewidth=1.5)

        # 0선
        ax2.axhline(y=0, color='black', linestyle='-', linewidth=1.5)

        # 값 표시 (데이터가 적을 때만)
        if num_records <= 20:
            for bar, diff in zip(bars, differences):
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height,
                        f'${diff:,.0f}',
                        ha='center', va='bottom' if height > 0 else 'top',
                        fontsize=8, fontweight='bold')
        elif num_records <= 52:
            for i in range(0, num_records, 4):
                height = bars[i].get_height()
                ax2.text(bars[i].get_x() + bars[i].get_width()/2., height,
                        f'${differences[i]:,.0f}',
                        ha='center', va='bottom' if height > 0 else 'top',
                        fontsize=7, fontweight='bold')

        ax2.set_xlabel('Date', fontsize=12, fontweight='bold')
        ax2.set_ylabel('Difference ($)', fontsize=12, fontweight='bold')
        ax2.tick_params(axis='both', labelsize=10)
        ax2.grid(True, alpha=0.3, axis='y')

        # X축 날짜 간격 설정
        self._set_xaxis_interval(ax2, dates, interval_months)

        # 제목
        fig.suptitle('VR Total vs Benchmark Comparison', fontsize=16, fontweight='bold', y=0.995)
        ax1.set_title('Total Amount Trend', fontsize=12, fontweight='bold', pad=10)
        ax2.set_title('VR - Benchmark Difference', fontsize=12, fontweight='bold', pad=10)

        # 저장
        filename = os.path.join(self.data_dir, "vr_difference.png")
        plt.tight_layout()
        plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()

        return filename

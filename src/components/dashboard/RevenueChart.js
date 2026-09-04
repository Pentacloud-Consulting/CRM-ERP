'use client';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign, Package, Sparkles } from 'lucide-react';
import styles from './DashboardComponents.module.css';

const TIMEFRAME_DATA = {
  '30D': {
    summary: { revenue: '$14,280', volume: '1,840 TEU', growth: '+12.4%' },
    data: [
      { name: 'Week 1', revenue: 2800, volume: 1400 },
      { name: 'Week 2', revenue: 3400, volume: 2100 },
      { name: 'Week 3', revenue: 4100, volume: 3200 },
      { name: 'Week 4', revenue: 3980, volume: 2900 },
    ]
  },
  '6M': {
    summary: { revenue: '$42,500', volume: '34,800 TEU', growth: '+18.5%' },
    data: [
      { name: 'Jan', revenue: 4000, volume: 2400 },
      { name: 'Feb', revenue: 3000, volume: 1398 },
      { name: 'Mar', revenue: 2000, volume: 9800 },
      { name: 'Apr', revenue: 2780, volume: 3908 },
      { name: 'May', revenue: 1890, volume: 4800 },
      { name: 'Jun', revenue: 2390, volume: 3800 },
      { name: 'Jul', revenue: 3490, volume: 4300 },
      { name: 'Aug', revenue: 4200, volume: 5500 },
    ]
  },
  '1Y': {
    summary: { revenue: '$98,400', volume: '72,100 TEU', growth: '+24.1%' },
    data: [
      { name: 'Q1 25', revenue: 18000, volume: 12400 },
      { name: 'Q2 25', revenue: 22000, volume: 16800 },
      { name: 'Q3 25', revenue: 26500, volume: 19500 },
      { name: 'Q4 25', revenue: 31900, volume: 23400 },
    ]
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltipCard}>
        <div className={styles.tooltipHeader}>{label} Performance</div>
        <div className={styles.tooltipRow}>
          <span className={styles.dotRevenue} />
          <span className={styles.tooltipLabel}>Revenue:</span>
          <span className={styles.tooltipValue}>${payload[0]?.value ? (payload[0].value).toLocaleString() : 0}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span className={styles.dotVolume} />
          <span className={styles.tooltipLabel}>Volume:</span>
          <span className={styles.tooltipValue}>{payload[1]?.value ? (payload[1].value).toLocaleString() : 0} TEUs</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  const [timeframe, setTimeframe] = useState('6M');
  const currentSet = TIMEFRAME_DATA[timeframe] || TIMEFRAME_DATA['6M'];

  return (
    <div className={styles.analyticsChartWrapper}>
      {/* Top Legend & Timeframe Control Header */}
      <div className={styles.chartHeaderControls}>
        <div className={styles.legendGroup}>
          <div className={styles.legendItem}>
            <span className={styles.legendDotRevenue} />
            <span className={styles.legendText}>Revenue ({currentSet.summary.revenue})</span>
            <span className={styles.legendBadgePositive}>{currentSet.summary.growth}</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.legendDotVolume} />
            <span className={styles.legendText}>Volume ({currentSet.summary.volume})</span>
          </div>
        </div>

        <div className={styles.timeframeTabs}>
          {['30D', '6M', '1Y'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`${styles.tfBtn} ${timeframe === tf ? styles.tfBtnActive : ''}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className={styles.chartCanvasArea}>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart
            data={currentSet.data}
            margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6A4CFF" stopOpacity={0.3} />
                <stop offset="60%" stopColor="#6A4CFF" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#6A4CFF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="60%" stopColor="#10B981" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 24, 40, 0.05)" />
            
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }} 
              dy={8} 
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }} 
              tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#10B981" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorVol)" 
              activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
            />
            
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#6A4CFF" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRev)" 
              activeDot={{ r: 6, fill: '#6A4CFF', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Analytical Insight Footer */}
      <div className={styles.chartSummaryFooter}>
        <div className={styles.summaryItem}>
          <Sparkles size={13} className={styles.sparkleIcon} />
          <span><strong>AI Forecast:</strong> High-volume quarter projected • Peak margin in Mar</span>
        </div>
        <div className={styles.summaryItemRight}>
          <span>Accuracy: <strong>96.4%</strong></span>
        </div>
      </div>
    </div>
  );
}

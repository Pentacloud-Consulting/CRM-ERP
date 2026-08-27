'use client';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './DashboardComponents.module.css';

const mockData = [
  { name: 'Jan', revenue: 4000, volume: 2400 },
  { name: 'Feb', revenue: 3000, volume: 1398 },
  { name: 'Mar', revenue: 2000, volume: 9800 },
  { name: 'Apr', revenue: 2780, volume: 3908 },
  { name: 'May', revenue: 1890, volume: 4800 },
  { name: 'Jun', revenue: 2390, volume: 3800 },
  { name: 'Jul', revenue: 3490, volume: 4300 },
  { name: 'Aug', revenue: 4200, volume: 5500 },
];

export default function RevenueChart() {
  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={mockData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="40%" stopColor="var(--primary)" stopOpacity={0.06} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="40%" stopColor="#10B981" stopOpacity={0.04} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(16,24,40,0.06)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }} 
            tickFormatter={(value) => `$${value/1000}k`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '10px', border: '1px solid rgba(16,24,40,0.08)', boxShadow: '0 4px 16px rgba(16,24,40,0.1)', background: '#fff', padding: '8px 12px' }}
            itemStyle={{ fontWeight: 600, fontSize: '13px' }}
            labelStyle={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}
            cursor={{ stroke: 'rgba(106,76,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area 
            type="monotone" 
            dataKey="volume" 
            stroke="#10B981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVol)" 
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="var(--primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRev)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

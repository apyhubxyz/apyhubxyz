'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { HistoricalAPY } from '@/lib/api'

interface APYChartProps {
  data: HistoricalAPY[]
  showBorrowAPY?: boolean
}

export default function APYChart({ data, showBorrowAPY = false }: APYChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-600 dark:text-gray-400">No historical data available</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Supply APY': item.supplyAPY,
    'Borrow APY': item.borrowAPY || 0,
    'Total APY': item.totalAPY,
  }))

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">APY History</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any) => `${Number(value).toFixed(2)}%`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Total APY"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Supply APY"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
          />
          {showBorrowAPY && (
            <Line
              type="monotone"
              dataKey="Borrow APY"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

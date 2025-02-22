'use client'
import { useEffect, useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'

type VoucherRequest = Database['public']['Tables']['voucher_requests']['Row']

type ChartData = {
  name: string
  value: number
}

type TrendData = {
  date: string
  amount: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function AnalyticsCharts() {
  const [expenseData, setExpenseData] = useState<ChartData[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [statusData, setStatusData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('voucher_requests')
        .select()
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (error) throw error

      const voucherRequests = data as VoucherRequest[]

      // Process data for expense by head of account
      const groupedByAccount = voucherRequests.reduce<Record<string, number>>((acc, curr) => {
        const key = curr.head_of_account
        acc[key] = (acc[key] || 0) + Number(curr.amount)
        return acc
      }, {})

      const expenseChartData: ChartData[] = Object.entries(groupedByAccount).map(([name, value]) => ({
        name,
        value
      }))

      // Process data for daily trend
      const groupedByDate = voucherRequests.reduce<Record<string, number>>((acc, curr) => {
        const date = new Date(curr.created_at).toLocaleDateString()
        acc[date] = (acc[date] || 0) + Number(curr.amount)
        return acc
      }, {})

      const trendChartData: TrendData[] = Object.entries(groupedByDate)
        .map(([date, amount]) => ({
          date,
          amount
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Process data for status distribution
      const groupedByStatus = voucherRequests.reduce<Record<string, number>>((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
      }, {})

      const statusChartData: ChartData[] = Object.entries(groupedByStatus).map(([name, value]) => ({
        name,
        value
      }))

      setExpenseData(expenseChartData)
      setTrendData(trendChartData)
      setStatusData(statusChartData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center p-8">Loading analytics...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="space-y-8">
      {/* Expense Distribution by Head of Account */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Expense Distribution by Head of Account</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={expenseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Expense Trend */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Daily Expense Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#82ca9d" name="Daily Total" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Request Status Distribution */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Request Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

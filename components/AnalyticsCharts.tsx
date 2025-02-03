'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'
import { supabase } from '@/lib/supabaseClient'

export default function AnalyticsCharts() {
  const [expenseData, setExpenseData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('voucher_requests')
        .select('head_of_account, amount, created_at')
        .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())

      const groupedData = data?.reduce((acc, curr) => {
        const key = curr.head_of_account
        acc[key] = (acc[key] || 0) + curr.amount
        return acc
      }, {})

      setExpenseData(Object.entries(groupedData || {}).map(([name, value]) => ({ name, value })))
    }

    fetchData()
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-4">Expenses by Head of Account</h3>
        <BarChart width={500} height={300} data={expenseData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-4">Expense Trends</h3>
        <LineChart width={500} height={300} data={expenseData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        </LineChart>
      </div>
    </div>
  )
}

import React, { useState } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { api } from "../../lib/api";
import { Button } from "../ui/Button"
import { PieChart as PieIcon, BarChart3 } from "lucide-react"

interface RiskDistributionChartProps {
  data: RiskDistribution[]
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")

  const chartData = data.map(item => ({
    name: item.priority,
    count: item.count,
    percentage: item.percentage,
    color: item.color
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Nombre: {data.count}
          </p>
          <p className="text-sm text-gray-600">
            Pourcentage: {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          label={({ name, percentage }) => `${name}: ${percentage}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={chartType === "pie" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("pie")}
          className="flex items-center space-x-2"
        >
          <PieIcon className="w-4 h-4" />
          <span>Camembert</span>
        </Button>
        <Button
          variant={chartType === "bar" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("bar")}
          className="flex items-center space-x-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Barres</span>
        </Button>
      </div>

      <div className="h-80">
        {chartType === "pie" ? renderPieChart() : renderBarChart()}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {chartData.map((item, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-4 h-4 rounded mx-auto mb-2"
              style={{ backgroundColor: item.color }}
            ></div>
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-600">{item.count} ({item.percentage}%)</p>
          </div>
        ))}
      </div>
    </div>
  )
}

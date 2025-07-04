import React, { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { SectorAnalytics } from "../../types/analytics"
import { Button } from "../ui/Button"
import { BarChart3, TrendingUp, Users } from "lucide-react"

interface SectorAnalyticsChartProps {
  data: SectorAnalytics[]
}

export const SectorAnalyticsChart: React.FC<SectorAnalyticsChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<"totalEvaluations" | "averageScore" | "completionRate">("averageScore")

  const chartData = data.map(item => ({
    name: item.sector,
    totalEvaluations: item.totalEvaluations,
    averageScore: item.averageScore,
    completionRate: item.completionRate,
    riskLevel: item.riskLevel
  }))

  const metricConfigs = {
    totalEvaluations: {
      title: "Total Évaluations",
      color: "#3b82f6",
      icon: BarChart3
    },
    averageScore: {
      title: "Score Moyen",
      color: "#22c55e", 
      icon: TrendingUp
    },
    completionRate: {
      title: "Taux de Completion",
      color: "#f59e0b",
      icon: Users
    }
  }

  const currentConfig = metricConfigs[metric]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {currentConfig.title}: {payload[0].value}
            {metric === "completionRate" ? "%" : ""}
          </p>
          <p className="text-sm text-gray-600">
            Niveau de risque: {data.riskLevel}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.entries(metricConfigs).map(([key, config]) => {
          const IconComponent = config.icon
          return (
            <Button
              key={key}
              variant={metric === key ? "default" : "outline"}
              size="sm"
              onClick={() => setMetric(key as any)}
              className="flex items-center space-x-2"
            >
              <IconComponent className="w-4 h-4" />
              <span className="hidden sm:inline">{config.title}</span>
            </Button>
          )
        })}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={metric} 
              fill={currentConfig.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

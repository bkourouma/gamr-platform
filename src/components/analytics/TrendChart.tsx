import React, { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { TrendData } from "../../types/analytics"
import { Button } from "../ui/Button"
import { TrendingUp, BarChart3, Activity } from "lucide-react"

interface TrendChartProps {
  data: {
    risks: TrendData[]
    evaluations: TrendData[]
    scores: TrendData[]
  }
  timeRange: string
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, timeRange }) => {
  const [activeChart, setActiveChart] = useState<"risks" | "evaluations" | "scores">("risks")

  const chartConfigs = {
    risks: {
      title: "Création de Risques",
      data: data.risks || [],
      color: "#ef4444",
      icon: TrendingUp
    },
    evaluations: {
      title: "Évaluations Complétées", 
      data: data.evaluations || [],
      color: "#22c55e",
      icon: BarChart3
    },
    scores: {
      title: "Évolution des Scores",
      data: data.scores || [],
      color: "#3b82f6", 
      icon: Activity
    }
  }

  const currentConfig = chartConfigs[activeChart]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Object.entries(chartConfigs).map(([key, config]) => {
          const IconComponent = config.icon
          return (
            <Button
              key={key}
              variant={activeChart === key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveChart(key as any)}
              className="flex items-center space-x-2"
            >
              <IconComponent className="w-4 h-4" />
              <span>{config.title}</span>
            </Button>
          )
        })}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentConfig.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={currentConfig.color}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

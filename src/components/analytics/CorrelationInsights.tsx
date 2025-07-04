import React from "react"
import type { CorrelationInsight } from "../../types/analytics"
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react"

interface CorrelationInsightsProps {
  data: CorrelationInsight[]
}

export const CorrelationInsights: React.FC<CorrelationInsightsProps> = ({ data }) => {
  const getCorrelationIcon = (correlation: number) => {
    if (correlation > 0.3) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (correlation < -0.3) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case "high": return "bg-red-100 text-red-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation)
    if (abs >= 0.8) return "Très forte"
    if (abs >= 0.6) return "Forte"
    if (abs >= 0.4) return "Modérée"
    if (abs >= 0.2) return "Faible"
    return "Très faible"
  }

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune corrélation significative détectée</p>
        </div>
      ) : (
        data.map((insight, index) => (
          <div
            key={index}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getCorrelationIcon(insight.correlation)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSignificanceColor(insight.significance)}`}>
                  {insight.significance.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {insight.correlation > 0 ? "+" : ""}{insight.correlation.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {getCorrelationStrength(insight.correlation)}
                </p>
              </div>
            </div>

            <div className="mb-3">
              <h4 className="font-semibold text-gray-900 mb-1">
                {insight.factor1} ↔ {insight.factor2}
              </h4>
              <p className="text-sm text-gray-600">
                {insight.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Corrélation {insight.correlation > 0 ? "positive" : "négative"}
              </span>
              <span>
                Significativité: {insight.significance}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

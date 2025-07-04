import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import { Brain, AlertTriangle } from "lucide-react"

interface PredictiveInsightsChartProps {
  insights: any[]
}

export const PredictiveInsightsChart: React.FC<PredictiveInsightsChartProps> = ({ insights }) => {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>Insights Prédictifs IA</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Données insuffisantes pour les prédictions</p>
            </div>
          ) : (
            insights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200 bg-white">
                <h4 className="font-semibold text-gray-900 mb-2">{insight.metric}</h4>
                <p className="text-sm text-gray-600">{insight.recommendation}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

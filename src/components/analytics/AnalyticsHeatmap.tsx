import React from "react"

interface AnalyticsHeatmapProps {
  data: {
    objectives: string[]
    sectors: string[]
    scores: number[][]
  }
}

export const AnalyticsHeatmap: React.FC<AnalyticsHeatmapProps> = ({ data }) => {
  const getColorIntensity = (score: number) => {
    const intensity = score / 100
    return `rgba(59, 130, 246, ${intensity})`
  }

  const getTextColor = (score: number) => {
    return score > 50 ? "text-white" : "text-gray-900"
  }

  return (
    <div className="space-y-4">
      {data.objectives.length === 0 || data.sectors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Données insuffisantes pour la carte de chaleur</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-gray-700">Secteur / Objectif</th>
                {data.objectives.map((objective, index) => (
                  <th
                    key={index}
                    className="p-2 text-center font-medium text-gray-700 min-w-20"
                    title={objective}
                  >
                    <div className="transform -rotate-45 origin-center text-xs">
                      {objective.substring(0, 10)}...
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sectors.map((sector, sectorIndex) => (
                <tr key={sectorIndex}>
                  <td className="p-2 font-medium text-gray-700 border-r border-gray-200">
                    {sector}
                  </td>
                  {data.objectives.map((_, objectiveIndex) => {
                    const score = data.scores[sectorIndex]?.[objectiveIndex] || 0
                    return (
                      <td
                        key={objectiveIndex}
                        className={`p-2 text-center text-sm font-medium border border-gray-200 ${getTextColor(score)}`}
                        style={{ backgroundColor: getColorIntensity(score) }}
                        title={`${sector} - ${data.objectives[objectiveIndex]}: ${score}`}
                      >
                        {score}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border border-gray-300"></div>
          <span>Score faible (0-25)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-300 border border-gray-300"></div>
          <span>Score moyen (26-75)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 border border-gray-300"></div>
          <span>Score élevé (76-100)</span>
        </div>
      </div>
    </div>
  )
}

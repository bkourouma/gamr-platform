import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import { Network, Info } from "lucide-react"

interface CorrelationMatrixProps {
  matrix: number[][]
  labels: string[]
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ matrix, labels }) => {
  const getCorrelationColor = (value: number) => {
    const intensity = Math.abs(value)
    if (value > 0) {
      return `rgba(34, 197, 94, ${intensity})`
    } else {
      return `rgba(239, 68, 68, ${intensity})`
    }
  }

  if (matrix.length === 0 || labels.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-purple-600" />
            <span>Matrice de Correlation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Network className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Donnees insuffisantes pour analyse de correlation</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-purple-600" />
          <span>Matrice de Correlation des Objectifs</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Correlation positive</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Correlation negative</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-32"></th>
                  {labels.map((label, index) => (
                    <th key={index} className="p-2 text-xs font-medium text-gray-700 min-w-12">
                      <div className="truncate" title={label}>
                        {label.substring(0, 10)}...
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="p-2 text-xs font-medium text-gray-700 text-right w-32">
                      <div className="truncate" title={labels[rowIndex]}>
                        {labels[rowIndex]}
                      </div>
                    </td>
                    {row.map((value, colIndex) => (
                      <td key={colIndex} className="relative p-0 border border-gray-200" style={{ width: "40px", height: "40px" }}>
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: getCorrelationColor(value) }}
                        >
                          {value.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

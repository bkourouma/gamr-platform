import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import { AlertTriangle, CheckCircle, Eye } from "lucide-react"

interface AnomalyDetectionPanelProps {
  anomalies: any[]
}

export const AnomalyDetectionPanel: React.FC<AnomalyDetectionPanelProps> = ({ anomalies }) => {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          <span>Detection Anomalies</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune anomalie detectee</h3>
            <p className="text-gray-600">Toutes les metriques sont normales</p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="p-4 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">{anomaly.metric}</h4>
                </div>
                <p className="text-sm text-red-700">{anomaly.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

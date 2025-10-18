// Minimal JSX test to isolate the syntax issue
import React from 'react';

export default function MinimalTest() {
  const aiAnalysis = {
    vulnerability: {
      positivePoints: ['Test point 1', 'Test point 2'],
      negativePoints: ['Test negative 1']
    }
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Probabilité */}
        <div>
          <label>Probabilité (1-3)</label>
        </div>

        {/* Vulnérabilité */}
        <div>
          <label>Vulnérabilité (1-4)</label>
          
          {/* Protections identifiées */}
          {aiAnalysis.vulnerability.positivePoints.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center space-x-1 mb-2">
                <span>Protections en place:</span>
              </div>
              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                <ul className="text-xs text-green-700 space-y-1">
                  {aiAnalysis.vulnerability.positivePoints.map((point, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span className="flex-1">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Vulnérabilités identifiées */}
          {aiAnalysis.vulnerability.negativePoints.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center space-x-1 mb-2">
                <span>Vulnérabilités détectées:</span>
              </div>
            </div>
          )}
        </div>

        {/* Repercussions */}
        <div>
          <label>Repercussions (1-5)</label>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Download, AlertCircle } from "lucide-react";

const RiskReports = () => {
  const patientRisks = {
    patientId: "P001",
    name: "John Doe",
    overallScore: 75,
    systemScores: [
      { system: "Cardiovascular", score: 80 },
      { system: "Respiratory", score: 60 },
      { system: "Endocrine", score: 75 },
      { system: "Renal", score: 85 },
    ],
    riskFactors: [
      "History of hypertension",
      "Type 2 diabetes",
      "Family history of CVD",
    ],
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Risk Report</h2>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Risk Score */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Overall Risk Score
              </h3>
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {patientRisks.overallScore}%
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${patientRisks.overallScore}%` }}
              />
            </div>
          </div>

          {/* System Scores */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">
              System Analysis
            </h3>
            <div className="space-y-4">
              {patientRisks.systemScores.map((system) => (
                <div key={system.system}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{system.system}</span>
                    <span className="font-medium">{system.score}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${system.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-4">
              Risk Factors
            </h3>
            <ul className="space-y-2">
              {patientRisks.riskFactors.map((factor, index) => (
                <li
                  key={index}
                  className="flex items-center text-sm text-gray-700"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskReports;

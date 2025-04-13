import React, { useState } from "react";
import {
  Activity,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  Search,
} from "lucide-react";

const ReadmissionPredictor = () => {
  const [patientId, setPatientId] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mockPrediction = {
    risk: "High",
    probability: 76,
    factors: [
      {
        name: "Recent Hospitalizations",
        impact: "High",
        details: "2 admissions in last 6 months",
      },
      {
        name: "Medication Adherence",
        impact: "Medium",
        details: "80% adherence rate",
      },
      {
        name: "Chronic Conditions",
        impact: "High",
        details: "Multiple comorbidities present",
      },
    ],
  };

  const handlePredict = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPrediction(mockPrediction);
      setIsLoading(false);
    }, 1500);
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Readmission Risk Predictor
        </h2>
        <div className="flex space-x-4">
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handlePredict}
            disabled={!patientId || isLoading}
            className={`px-4 py-2 rounded-lg text-white font-medium
              ${
                !patientId || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing...
              </div>
            ) : (
              "Predict Risk"
            )}
          </button>
        </div>
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">
              Prediction Results
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Score */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-600">
                    Risk Level
                  </h4>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-3xl font-bold ${getRiskColor(
                      prediction.risk
                    )}`}
                  >
                    {prediction.risk}
                  </span>
                  <span className="text-2xl text-gray-400">•</span>
                  <span className="text-3xl font-bold text-gray-900">
                    {prediction.probability}%
                  </span>
                </div>
              </div>

              {/* Contributing Factors */}
              <div className="space-y-4">
                {prediction.factors.map((factor, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {factor.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(
                          factor.impact
                        )}`}
                      >
                        {factor.impact} Impact
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {factor.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadmissionPredictor;

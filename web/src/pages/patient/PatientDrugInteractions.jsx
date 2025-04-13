import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, ChevronLeft, Pill } from "lucide-react";

const PatientDrugInteractions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const interactions = [
    {
      drugs: ["Metformin", "Lisinopril"],
      severity: "Low",
      description: "Minimal risk of interaction. Monitor blood pressure.",
      recommendation: "Continue as prescribed, regular BP monitoring advised.",
    },
    {
      drugs: ["Aspirin", "Warfarin"],
      severity: "High",
      description: "Increased risk of bleeding when used together.",
      recommendation: "Consider alternative antiplatelet therapy.",
    },
  ];

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case "high":
        return <AlertTriangle className="w-6 h-6 text-white" />;
      case "medium":
        return <AlertCircle className="w-6 h-6 text-white" />;
      case "low":
        return <Info className="w-6 h-6 text-white" />;
      default:
        return null;
    }
  };

  const getSeverityColors = (severity) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "from-red-500 to-rose-600";
      case "medium":
        return "from-amber-500 to-orange-600";
      case "low":
        return "from-blue-500 to-indigo-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto relative z-10 space-y-6">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center px-3 py-2 bg-white rounded-xl shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Patient
        </button>
        
        {/* Main content */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Pill className="w-5 h-5 mr-2" />
              Drug Interactions
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Patient ID: {id}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {interactions.map((interaction, index) => (
              <div
                key={index}
                className="rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start p-5">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getSeverityColors(interaction.severity)} text-white shadow-md mr-4 flex-shrink-0`}>
                    {getSeverityIcon(interaction.severity)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-800">
                        {interaction.drugs.join(" + ")}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          interaction.severity.toLowerCase() === "high"
                            ? "bg-red-100 text-red-800"
                            : interaction.severity.toLowerCase() === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {interaction.severity} Risk
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {interaction.description}
                    </p>
                    
                    <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Recommendation:</span>{" "}
                        <span className="text-gray-700">{interaction.recommendation}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {interactions.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Pill className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Drug Interactions</h3>
                <p className="text-gray-600">This patient has no significant drug interactions at this time.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Understanding Risk Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 mr-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700">High Risk</h4>
                <p className="text-sm text-gray-600">Potentially dangerous interaction that requires immediate attention</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 mr-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Medium Risk</h4>
                <p className="text-sm text-gray-600">May require dosage adjustment or monitoring</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Low Risk</h4>
                <p className="text-sm text-gray-600">Minor interaction with minimal clinical significance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDrugInteractions;

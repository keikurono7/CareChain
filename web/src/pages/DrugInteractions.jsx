import React, { useState } from "react";
import { AlertTriangle, AlertCircle, Info, PlusCircle, Pill, Shield } from "lucide-react";

const DrugInteractions = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const interactions = [
    {
      drugs: ["Metformin", "Lisinopril"],
      severity: "Low",
      description: "Minimal risk of interaction. Monitor blood pressure.",
      recommendation: "Continue as prescribed, regular BP monitoring advised.",
      explanation: "Metformin (antidiabetic) and Lisinopril (ACE inhibitor) can both affect kidney function and potassium levels when used together. However, this combination is commonly prescribed and generally well-tolerated with appropriate monitoring."
    },
    {
      drugs: ["Aspirin", "Warfarin"],
      severity: "High",
      description: "Increased risk of bleeding when used together.",
      recommendation: "Consider alternative antiplatelet therapy.",
      explanation: "Both Aspirin and Warfarin have anticoagulant properties. When combined, they significantly increase the risk of bleeding complications. The antiplatelet effects of aspirin can potentiate the anticoagulant effects of warfarin, leading to dangerous bleeding events."
    },
    {
      drugs: ["Simvastatin", "Clarithromycin"],
      severity: "Medium",
      description: "May increase statin levels and risk of muscle damage.",
      recommendation: "Consider temporary statin suspension during antibiotic treatment.",
      explanation: "Clarithromycin inhibits CYP3A4 enzymes that metabolize simvastatin, leading to increased blood levels of the statin. This can increase the risk of myopathy and rhabdomyolysis (severe muscle breakdown)."
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

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Pill className="w-8 h-8 mr-2 text-purple-600" />
            Drug Interactions Analysis
          </h1>
          <p className="text-gray-600">Review potential interactions between medications</p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Medication
          </button>
          
          <button className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Run Safety Check
          </button>
        </div>
        
        {/* Main interactions card */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Detected Interactions
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {interactions.map((interaction, index) => (
              <div
                key={index}
                className="rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="flex items-center p-4 bg-white border border-gray-100">
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
                    <p className="mt-1 text-sm text-gray-600">
                      {interaction.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Recommendation:</span>
                      <span className="text-sm text-gray-600">{interaction.recommendation}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleExpand(index)}
                    className={`ml-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex-shrink-0 text-sm font-medium`}
                  >
                    {expandedIndex === index ? "Hide Details" : "Explain This"}
                  </button>
                </div>
                
                {expandedIndex === index && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100">
                    <h4 className="font-medium text-purple-800 mb-2">Detailed Explanation</h4>
                    <p className="text-gray-700">{interaction.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Empty state for when there are no interactions */}
          {interactions.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Interactions Detected</h3>
              <p className="text-gray-600 mb-6">The current medications appear to be safe to use together.</p>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all">
                Add Medications to Check
              </button>
            </div>
          )}
        </div>
        
        {/* Additional info card */}
        <div className="mt-6 bg-white rounded-xl shadow-md border border-purple-100 p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Understanding Interaction Severity</h3>
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

export default DrugInteractions;

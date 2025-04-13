import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText, ChevronRight, User, ChevronLeft, FilePlus, Shield } from "lucide-react";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const patient = {
    id: id,
    name: "John Doe",
    age: 45,
    lastVisit: "2024-04-10",
    wellness: {
      breakfast: "Oatmeal with berries",
      exercise: "30 min walking",
    },
    prescription: {
      medication: "Lisinopril 10mg",
      doctor: "Dr. Emily Chen",
      date: "2024-04-05",
    },
    riskLevel: "LOW",
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
          Back to Patients
        </button>
        
        {/* Patient Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <User className="w-5 h-5 mr-2" />
              Patient Information
            </h2>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 gap-x-2 gap-y-1">
                  <span className="px-2 py-1 bg-gray-100 rounded-lg">ID: {patient.id}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-lg">Age: {patient.age}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-lg">Last Visit: {patient.lastVisit}</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/patients/${id}/upload-prescription`)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center"
              >
                <FilePlus className="w-5 h-5 mr-2" />
                Upload Prescription
              </button>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wellness Plan Card */}
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-600">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Wellness Plan
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Breakfast</p>
                  <p className="text-gray-800">{patient.wellness.breakfast}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Exercise</p>
                  <p className="text-gray-800">{patient.wellness.exercise}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => navigate(`/patients/${id}/wellness-plan`)}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                >
                  View Full Plan
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Latest Prescription Card */}
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 to-purple-700">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Latest Prescription
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Medication</p>
                  <p className="text-gray-800">{patient.prescription.medication}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Doctor</p>
                  <p className="text-gray-800">{patient.prescription.doctor}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Prescribed Date</p>
                  <p className="text-gray-800">{patient.prescription.date}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => navigate(`/patients/${id}/prescriptions`)}
                  className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-2 rounded-lg transition-colors"
                >
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Health Risk Assessment Card */}
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-green-600">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Health Risk Assessment
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${
                      patient.riskLevel === "LOW" ? "bg-green-500" : "bg-red-500"
                    } mr-2`}></div>
                    <span className="font-medium text-gray-800">Risk Level</span>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      patient.riskLevel === "LOW"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {patient.riskLevel}
                  </span>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Your health metrics are within normal ranges.
                  </p>
                </div>
                
                <div className="text-center mt-4">
                  <button
                    onClick={() => navigate(`/patients/${id}/risk-assessment`)}
                    className="inline-flex items-center justify-center w-full text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    View Full Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;

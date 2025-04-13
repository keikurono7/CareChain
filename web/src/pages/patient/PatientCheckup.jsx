import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, Stethoscope, ChevronLeft, FilePlus, User, Activity } from "lucide-react";
import BackButton from "../../components/shared/BackButton";

const PatientCheckup = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const checkupData = {
    nextAppointment: "2024-04-20",
    time: "10:00 AM",
    doctor: "Dr. Sarah Johnson",
    vitals: {
      bp: "120/80",
      pulse: "72",
      temp: "98.6°F",
      weight: "70 kg",
    },
    notes: "Regular follow-up for diabetes management. Blood pressure stable.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <User className="w-6 h-6 mr-2 text-purple-600" />
              Checkup Details
            </h1>
            <p className="text-gray-600">Patient ID: {id}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Health Information
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointment Info */}
              <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="ml-2 text-lg font-medium text-gray-800">
                    Next Appointment
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-24">Date:</span>
                    <span className="text-gray-800 font-medium">{checkupData.nextAppointment}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-24">Time:</span>
                    <span className="text-gray-800 font-medium">{checkupData.time}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-24">Doctor:</span>
                    <span className="text-gray-800 font-medium">{checkupData.doctor}</span>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-sm">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h3 className="ml-2 text-lg font-medium text-gray-800">
                    Vitals
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      Blood Pressure
                    </p>
                    <p className="text-gray-800 font-medium text-lg">
                      {checkupData.vitals.bp}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      Pulse Rate
                    </p>
                    <p className="text-gray-800 font-medium text-lg">
                      {checkupData.vitals.pulse} <span className="text-sm">bpm</span>
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      Temperature
                    </p>
                    <p className="text-gray-800 font-medium text-lg">
                      {checkupData.vitals.temp}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      Weight
                    </p>
                    <p className="text-gray-800 font-medium text-lg">
                      {checkupData.vitals.weight}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="ml-2 text-lg font-medium text-gray-800">
                    Notes
                  </h3>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-gray-700">
                    {checkupData.notes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center">
            <FilePlus className="w-5 h-5 mr-2" />
            Schedule Follow-up
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientCheckup;

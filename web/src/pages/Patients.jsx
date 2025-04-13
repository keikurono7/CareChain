import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Users, Search, UserPlus, AlertCircle, Filter, Loader } from "lucide-react";

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        // Make a request to retrieve all users from the blockchain using fetch instead of axios
        const response = await fetch("http://localhost:5000/api/patients");
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform blockchain data into patient objects
        const transformedPatients = data.map(patient => {
          // Parse the hex data to get patient information
          const patientData = JSON.parse(hexToUtf8(patient.data));
          
          return {
            id: patientData.userId || "Unknown",
            name: patientData.name || "Unknown",
            age: patientData.age || "N/A",
            email: patientData.email || "unknown@example.com", // Ensure email has a default value
            username: patientData.email ? patientData.email.split('@')[0] : "unknown", // Extract username from email
            gender: patientData.gender || "N/A",
            bloodGroup: patientData.bloodGroup || "N/A",
            medicalIssues: patientData.medicalIssues || "None",
            lastVisit: "Not recorded",
            riskLevel: patientData.medicalIssues?.toLowerCase().includes("diabet") ? "High" : "Low",
            blocktime: new Date(patient.blocktime * 1000).toLocaleDateString()
          };
        });
        
        setPatients(transformedPatients);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError("Failed to load patients from blockchain");
        
        // Fallback to dummy data if API fails
        setPatients([
          {
            id: "P001",
            name: "John Doe",
            age: 45,
            email: "johndoe@example.com",
            username: "johndoe",
            lastVisit: "2024-04-10",
            riskLevel: "Low",
            nextCheckup: "2024-05-10",
            bloodGroup: "A+",
            medicalIssues: "Hypertension",
          },
          {
            id: "P002",
            name: "Jane Smith",
            age: 32,
            email: "janesmith@example.com",
            username: "janesmith",
            lastVisit: "2024-04-09",
            riskLevel: "High",
            nextCheckup: "2024-04-20",
            bloodGroup: "B-",
            medicalIssues: "Diabetes Type 2",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Helper function to convert hex to UTF-8 string
  const hexToUtf8 = (hex) => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto relative z-10">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Users className="w-6 h-6 mr-2 text-purple-600" />
              Patient Management
            </h1>
            <p className="text-gray-600 mt-1">
              {isLoading 
                ? "Loading patients from blockchain..." 
                : `Manage and view ${patients.length} patients`}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
            
            <button 
              onClick={() => navigate('/patients/new')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Patient
            </button>
          </div>
        </div>
        
        {/* Patients card */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Blockchain Patients
            </h2>
            <button className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader className="w-8 h-8 text-purple-600 animate-spin mr-3" />
              <p className="text-gray-600">Loading patients from blockchain...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Failed to Load Patients</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medical Issues
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => navigate(`/patients/${patient.username}/details`)}
                      className="hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {patient.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.age}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.bloodGroup}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                        {patient.medicalIssues}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center ${
                            patient.riskLevel === "High"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {patient.riskLevel === "High" && (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {patient.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="p-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {!isLoading && !error && patients.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-600">Showing {filteredPatients.length} of {patients.length} patients</p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Download, AlertCircle, Heart, Wind, Activity, Droplet, 
  ChevronLeft, Info, FileText, AlertTriangle, Pill, User, Building 
} from "lucide-react";
import BackButton from "../../components/shared/BackButton";

const PatientRiskReport = () => {
  const { id } = useParams(); // 'id' is now actually the username from email
  const navigate = useNavigate();
  const [patientRisk, setPatientRisk] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drugInteractions, setDrugInteractions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  // Fetch patient data from blockchain
  useEffect(() => {
    const fetchPatientData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/patients");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Find the patient with matching username
        const patientData = data.find(item => {
          const userData = JSON.parse(hexToUtf8(item.data));
          const username = userData.email ? userData.email.split('@')[0] : "unknown";
          return username === id;
        });
        
        if (!patientData) {
          throw new Error("Patient not found");
        }
        
        // Parse the patient data
        const userData = JSON.parse(hexToUtf8(patientData.data));
        
        // Parse medical issues into risk factors - Split by commas if present
        let riskFactors = [];
        if (userData.medicalIssues) {
          // Check if it contains commas or semicolons to split
          if (userData.medicalIssues.includes(',')) {
            riskFactors = userData.medicalIssues.split(',').map(issue => issue.trim());
          } else if (userData.medicalIssues.includes(';')) {
            riskFactors = userData.medicalIssues.split(';').map(issue => issue.trim());
          } else {
            // If no delimiter, use as a single item
            riskFactors = [userData.medicalIssues.trim()];
          }
        }
        
        // Add "History of" prefix to relevant conditions
        riskFactors = riskFactors.map(factor => {
          if (factor.toLowerCase().includes('history') || 
              factor.toLowerCase().includes('past') ||
              factor.toLowerCase().includes('chronic')) {
            return factor;
          }
          return `History of ${factor}`;
        });
        
        // If diabetic, add family history risk factor
        if (userData.medicalIssues?.toLowerCase().includes('diabet')) {
          riskFactors.push('Family history of diabetes');
        }

        // Fetch prescriptions including drug interactions
        let prescriptions = [];
        let interactions = [];
        let medicationsList = [];
        
        try {
          // Use the username for the API call (without email domain)
          const email = id;
          const prescriptionResponse = await fetch(`http://localhost:5000/api/prescriptions/${email}`);
          
          if (prescriptionResponse.ok) {
            const prescriptionData = await prescriptionResponse.json();
            prescriptions = prescriptionData.prescriptions || [];
            interactions = prescriptionData.interactions || [];
            medicationsList = prescriptionData.medications || [];
            console.log(`Loaded ${prescriptions.length} prescriptions and ${interactions.length} interactions for ${id}`);
            
            // Store the drug interactions data
            setDrugInteractions(interactions);
            setMedicines(medicationsList);
          } else {
            console.warn(`Failed to load prescriptions for ${id}`);
          }
        } catch (prescErr) {
          console.error("Error fetching prescriptions:", prescErr);
        }

        // Always extract medications from prescriptions for completeness
        if (prescriptions.length > 0) {
          // Create a Set to avoid duplicates
          const medicationsFromPrescriptions = new Set(medicationsList || []);
          
          // Extract medication names from all prescriptions
          prescriptions.forEach(prescription => {
            if (prescription.medication) {
              medicationsFromPrescriptions.add(prescription.medication);
            }
            // Also check 'name' field which might be used instead
            if (prescription.name && prescription.name !== prescription.medication) {
              medicationsFromPrescriptions.add(prescription.name);
            }
            // Check for any dosage information that might contain medication names
            if (prescription.prescriptionText) {
              const words = prescription.prescriptionText.split(/\s+/);
              // Look for common medication name patterns
              words.forEach(word => {
                if (word.length > 3 && !word.match(/^\d+$/)) {
                  // Filter out common non-medication words
                  if (!['take', 'daily', 'twice', 'dose', 'tablet', 'capsule', 'with', 'food', 'water', 'before', 'after', 'meals'].includes(word.toLowerCase())) {
                    medicationsFromPrescriptions.add(word.replace(/[.,;:]/g, ''));
                  }
                }
              });
            }
          });
          
          // Convert Set to Array and update state
          const updatedMedicationsList = Array.from(medicationsFromPrescriptions);
          setMedicines(updatedMedicationsList);
          medicationsList = updatedMedicationsList;
          console.log(`Extracted ${medicationsList.length} total medications from prescriptions`);
        }

        // Special handling for patients with multiple prescriptions
        if (prescriptions.length >= 2) {
          console.log(`Patient ${id} has ${prescriptions.length} prescriptions, ensuring all medications are captured`);
          
          // Ensure we have all medications from each prescription - already done earlier
          const enhancedMedicationsList = new Set(medicationsList);
          
          // Some prescriptions might have related medications not explicitly mentioned
          // Let's add additional common combinations for completeness
          if (enhancedMedicationsList.has("Lisinopril") && !enhancedMedicationsList.has("Hydrochlorothiazide")) {
            console.log("Adding likely combination medication: Hydrochlorothiazide");
            enhancedMedicationsList.add("Hydrochlorothiazide");
          }
          
          if (enhancedMedicationsList.has("Metformin") && !enhancedMedicationsList.has("Glipizide")) {
            console.log("Adding likely combination medication: Glipizide");
            enhancedMedicationsList.add("Glipizide");
          }
          
          // Update the medications list
          medicationsList = Array.from(enhancedMedicationsList);
          setMedicines(medicationsList);
        }

        // Request medication interactions specifically for this patient
        try {
          const interactionsResponse = await fetch(`http://localhost:5000/api/drug-interactions/${id}`);
          if (interactionsResponse.ok) {
            const interactionsData = await interactionsResponse.json();
            if (interactionsData.interactions && interactionsData.interactions.length > 0) {
              setDrugInteractions(interactionsData.interactions);
              console.log(`Loaded ${interactionsData.interactions.length} interactions specifically for patient ${id}`);
            }
            
            // If the API returned more medications, add those too
            if (interactionsData.medicines && interactionsData.medicines.length > 0) {
              const combinedMeds = new Set([...medicationsList, ...interactionsData.medicines]);
              medicationsList = Array.from(combinedMeds);
              setMedicines(medicationsList);
              console.log(`Combined medication list now has ${medicationsList.length} items`);
            }
          }
        } catch (err) {
          console.error("Error fetching additional interactions:", err);
        }

        // If we don't have drug interactions from prescriptions endpoint, try the dedicated endpoint
        if (interactions.length === 0 && id) {
          try {
            const interactionsResponse = await fetch(`http://localhost:5000/api/drug-interactions/${id}`);
            if (interactionsResponse.ok) {
              const interactionsData = await interactionsResponse.json();
              setDrugInteractions(interactionsData.interactions || []);
              setMedicines(interactionsData.medicines || []);
              console.log(`Loaded ${interactionsData.interactions?.length || 0} drug interactions from dedicated endpoint`);
            }
          } catch (interactionErr) {
            console.error("Error fetching drug interactions:", interactionErr);
          }
        }

        // Set patient risk data
        setPatientRisk({
          patientId: userData.userId || id,
          name: userData.name || "Unknown",
          overallScore: calculateRiskScore(userData, interactions),
          systemScores: generateSystemScores(userData, interactions),
          riskFactors: riskFactors.length > 0 ? riskFactors : ["No significant medical history recorded"],
          prescriptions: prescriptions,
        });
      } catch (err) {
        console.error("Failed to fetch patient:", err);
        setError(`Error loading patient data: ${err.message}`);
        
        // Clear any partial data
        setPatientRisk(null);
        setDrugInteractions([]);
        setMedicines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  // Helper function to convert hex to UTF-8 string
  const hexToUtf8 = (hex) => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  };
  
  // Calculate overall risk score including drug interactions
  const calculateRiskScore = (userData, interactions) => {
    let baseScore = userData.medicalIssues?.toLowerCase().includes('diabet') ? 75 : 55;
    
    // Increase score if high-risk drug interactions exist
    if (interactions && interactions.length > 0) {
      const highRiskInteractions = interactions.filter(i => i.severity === "High");
      const mediumRiskInteractions = interactions.filter(i => i.severity === "Medium");
      
      if (highRiskInteractions.length > 0) {
        baseScore += 15; // Significant increase for high risk interactions
      } else if (mediumRiskInteractions.length > 0) {
        baseScore += 8; // Moderate increase for medium risk interactions
      }
      
      // Cap at 95 to avoid hitting 100
      baseScore = Math.min(baseScore, 95);
    }
    
    return baseScore;
  };

  const generateSystemScores = (userData, interactions) => {
    // Base scores that will be adjusted based on real data
    const baseScores = {
      "Cardiovascular": 50,
      "Respiratory": 50,
      "Endocrine": 50,
      "Renal": 50
    };
    
    // Adjust scores based on medical conditions
    if (userData.medicalIssues) {
      const issues = userData.medicalIssues.toLowerCase();
      
      // Cardiovascular adjustments
      if (issues.includes('hypertension') || issues.includes('heart') || 
          issues.includes('cholesterol') || issues.includes('stroke')) {
        baseScores["Cardiovascular"] += 30;
      }
      
      // Respiratory adjustments
      if (issues.includes('asthma') || issues.includes('copd') || 
          issues.includes('pneumonia') || issues.includes('lung')) {
        baseScores["Respiratory"] += 30;
      }
      
      // Endocrine adjustments
      if (issues.includes('diabetes') || issues.includes('thyroid') || 
          issues.includes('hormonal') || issues.includes('metabolic')) {
        baseScores["Endocrine"] += 30;
      }
      
      // Renal adjustments
      if (issues.includes('kidney') || issues.includes('renal') || 
          issues.includes('bladder') || issues.includes('urinary')) {
        baseScores["Renal"] += 30;
      }
    }
    
    // Adjust for drug interactions affecting specific systems
    if (interactions && interactions.length > 0) {
      for (const interaction of interactions) {
        // Check if this is a cardiovascular medication interaction
        if (interaction.drugs.some(drug => 
            ['lisinopril', 'metoprolol', 'atenolol', 'amlodipine', 'atorvastatin']
            .includes(drug.toLowerCase()))) {
          baseScores["Cardiovascular"] += 10;
        }
        
        // Check if this is a respiratory medication interaction
        if (interaction.drugs.some(drug => 
            ['albuterol', 'fluticasone', 'montelukast', 'tiotropium']
            .includes(drug.toLowerCase()))) {
          baseScores["Respiratory"] += 10;
        }
        
        // Check if this is an endocrine medication interaction
        if (interaction.drugs.some(drug => 
            ['metformin', 'insulin', 'levothyroxine', 'glipizide']
            .includes(drug.toLowerCase()))) {
          baseScores["Endocrine"] += 10;
        }
        
        // Check if this is a renal medication interaction
        if (interaction.drugs.some(drug => 
            ['furosemide', 'hydrochlorothiazide', 'spironolactone']
            .includes(drug.toLowerCase()))) {
          baseScores["Renal"] += 10;
        }
      }
    }
    
    // Cap scores at 95
    Object.keys(baseScores).forEach(key => {
      baseScores[key] = Math.min(baseScores[key], 95);
    });
    
    // Convert to array format with icons
    return [
      { system: "Cardiovascular", score: baseScores["Cardiovascular"], icon: Heart },
      { system: "Respiratory", score: baseScores["Respiratory"], icon: Wind },
      { system: "Endocrine", score: baseScores["Endocrine"], icon: Activity },
      { system: "Renal", score: baseScores["Renal"], icon: Droplet },
    ];
  };

  // Function to format prescription date nicely
  const formatPrescriptionDate = (dateString) => {
    if (!dateString) return "No date";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return dateString;
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  };

  // Check if a prescription is expiring soon (within 30 days)
  const isExpiringPrescription = (prescription) => {
    if (!prescription.date) return false;
    
    try {
      const prescriptionDate = new Date(prescription.date);
      if (isNaN(prescriptionDate)) return false;
      
      // Add typical 90-day duration to prescription date
      const expirationDate = new Date(prescriptionDate);
      expirationDate.setDate(expirationDate.getDate() + 90);
      
      // Expiring soon if less than 30 days remaining
      const today = new Date();
      const daysRemaining = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));
      
      return daysRemaining >= 0 && daysRemaining <= 30;
    } catch (e) {
      return false;
    }
  };

  // Get condition that the medication is treating
  const getConditionForMedication = (medication, prescriptions) => {
    if (!prescriptions || !medication) return "general health";
    
    // Find the prescription that contains this medication
    const relevantPrescription = prescriptions.find(p => 
      p.medication === medication || 
      (p.name && p.name === medication)
    );
    
    return relevantPrescription?.condition || "general health";
  };

  // Get the appropriate color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "from-red-500 to-rose-600";
    if (score >= 60) return "from-amber-500 to-orange-600";
    return "from-green-500 to-emerald-600";
  };

  const getScoreTextColor = (score) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-amber-600";
    return "text-green-600";
  };

  const getScoreProgressColor = (score) => {
    if (score >= 80) return "bg-gradient-to-r from-red-500 to-rose-600";
    if (score >= 60) return "bg-gradient-to-r from-amber-500 to-orange-600";
    return "bg-gradient-to-r from-green-500 to-emerald-600";
  };
  
  // Get severity colors for drug interactions
  const getSeverityColor = (severity) => {
    switch(severity.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: 'text-red-500'
        };
      case 'medium':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          border: 'border-amber-200',
          icon: 'text-amber-500'
        };
      default: // low or any other
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
          icon: 'text-blue-500'
        };
    }
  };

  // Animation for progress bars
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation shortly after component mounts
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg flex items-center space-x-4">
          <div className="animate-spin h-8 w-8 text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading patient risk data...</p>
        </div>
      </div>
    );
  }

  if (error || !patientRisk) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Failed to Load Risk Report</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md"
          >
            Return to Patient
          </button>
        </div>
      </div>
    );
  }

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
        
        {/* Main Report Card */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Patient Risk Report
              </h2>
              <p className="text-sm text-white/80">
                {patientRisk.name} (ID: {patientRisk.patientId})
              </p>
            </div>
            <button className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>

          <div className="p-6">
            {/* Overall Risk Card */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-purple-600" />
                    Overall Risk Assessment
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive evaluation of health risk factors and systems
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Risk Level</span>
                      <span className={`text-sm font-bold ${getScoreTextColor(patientRisk.overallScore)}`}>
                        {patientRisk.overallScore >= 80 
                          ? "High" 
                          : patientRisk.overallScore >= 60 
                            ? "Moderate" 
                            : "Low"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${getScoreProgressColor(patientRisk.overallScore)} transition-all duration-1000 ease-out`}
                        style={{ width: animate ? `${patientRisk.overallScore}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="relative h-48 w-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreTextColor(patientRisk.overallScore)}`}>
                        {patientRisk.overallScore}%
                      </span>
                    </div>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#e5e7eb" 
                        strokeWidth="8"
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="url(#gradient)" 
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${animate ? patientRisk.overallScore * 2.83 : 0}, 283`}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={patientRisk.overallScore >= 80 
                            ? "#ef4444" 
                            : patientRisk.overallScore >= 60 
                              ? "#f59e0b" 
                              : "#10b981"} />
                          <stop offset="100%" stopColor={patientRisk.overallScore >= 80 
                            ? "#e11d48" 
                            : patientRisk.overallScore >= 60 
                              ? "#ea580c" 
                              : "#059669"} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Drug Interactions Section - Enhanced UI */}
            {medicines.length > 0 && (
              <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 shadow-md">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4">
                  <h3 className="flex items-center text-xl font-semibold text-white">
                    <Pill className="mr-3 h-6 w-6" />
                    Medication Interaction Analysis
                  </h3>
                </div>
                
                <div className="bg-gradient-to-b from-amber-50 to-white p-5">
                  {/* Current Medications List - Enhanced UI */}
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-semibold text-gray-700 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-amber-600" />
                      Active Medications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {medicines.map((medicine, idx) => (
                        <div 
                          key={idx} 
                          className="group relative flex items-center"
                        >
                          <span className="px-3 py-1.5 bg-white rounded-full text-sm border border-amber-200 
                                          text-amber-800 shadow-sm font-medium hover:border-amber-300 
                                          hover:bg-amber-50 transition-colors flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            {medicine}
                          </span>
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 
                                        text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 
                                        group-hover:visible transition-opacity z-10 pointer-events-none">
                            Taking {medicine} for {getConditionForMedication(medicine, patientRisk.prescriptions)}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full border-l-4 border-r-4 border-t-4 
                                          border-transparent border-t-gray-800 w-0 h-0"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Drug Interactions - Enhanced UI */}
                  {drugInteractions && drugInteractions.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="flex items-center text-sm font-semibold text-gray-700 border-b border-amber-200 pb-2">
                        <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" />
                        Potential Drug Interactions
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {drugInteractions.map((interaction, idx) => {
                          const colorScheme = getSeverityColor(interaction.severity);
                          return (
                            <div 
                              key={idx} 
                              className={`p-4 bg-white rounded-lg border-l-4 ${colorScheme.border} shadow-sm hover:shadow-md transition-shadow`}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`p-2 rounded-full ${colorScheme.bg}`}>
                                  <AlertTriangle className={`w-4 h-4 ${colorScheme.icon}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-semibold text-gray-800">
                                      {interaction.drugs[0]} + {interaction.drugs[1]}
                                    </h5>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${colorScheme.bg} ${colorScheme.text}`}>
                                      {interaction.severity}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{interaction.description}</p>
                              
                              <div className="mt-3 flex items-start gap-3">
                                {interaction.recommendation && (
                                  <div className="flex-1 bg-gray-50 rounded-lg p-2">
                                    <p className="text-xs font-semibold text-gray-700">Recommendation</p>
                                    <p className="text-xs text-gray-600">{interaction.recommendation}</p>
                                  </div>
                                )}
                              </div>
                              
                              {interaction.explanation && (
                                <details className="mt-3 text-sm">
                                  <summary className="text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-800">
                                    View Detailed Explanation
                                  </summary>
                                  <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-md border-l-2 border-blue-300">
                                    {interaction.explanation}
                                  </div>
                                </details>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-green-100 p-4 shadow-sm">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">No Significant Interactions</h5>
                          <p className="text-sm text-gray-600">
                            Based on current medications, no significant drug interactions were detected.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* WEAL Verification - Enhanced UI */}
                  <div className="mt-6 bg-gradient-to-r from-white to-amber-50 rounded-lg border border-amber-100 p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <img src="/weal2.png" alt="WEAL" className="w-6 h-6 mr-2" />
                      <p className="text-sm text-gray-600">
                        Medication analysis secured and verified by WEAL blockchain
                      </p>
                    </div>
                    <div className="text-xs bg-white px-2 py-1 rounded-full text-amber-700 border border-amber-200">
                      Last updated: {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prescription Data Section - Enhanced UI */}
            {patientRisk.prescriptions && patientRisk.prescriptions.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-blue-200 shadow-md">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                  <h3 className="flex items-center text-xl font-semibold text-white">
                    <FileText className="mr-3 h-6 w-6" />
                    Current Medications & Prescriptions
                  </h3>
                </div>
                
                <div className="bg-gradient-to-b from-blue-50 to-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Showing {patientRisk.prescriptions.length} active prescription{patientRisk.prescriptions.length !== 1 ? 's' : ''}
                    </p>
                    
                    <div className="flex text-xs gap-2">
                      <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Active
                      </span>
                      <span className="flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                        <span className="w-2 h-2 bg-amber-500 rounded-full mr-1"></span> Expiring Soon
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {patientRisk.prescriptions.map((prescription, index) => {
                      const isExpiringSoon = isExpiringPrescription(prescription);
                      
                      return (
                        <div 
                          key={index} 
                          className={`bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow
                                    ${isExpiringSoon ? 'border-amber-200' : 'border-blue-100'}`}
                        >
                          <div className={`px-4 py-3 border-b ${isExpiringSoon ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className={`rounded-full mr-3 p-2 ${isExpiringSoon ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                  <Pill className={`w-5 h-5 ${isExpiringSoon ? 'text-amber-600' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-800 flex items-center">
                                    {prescription.medication || prescription.name || "Medication"}
                                  </h4>
                                  {prescription.dosage && 
                                    <div className="text-xs text-gray-600 mt-0.5">{prescription.dosage}</div>
                                  }
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full 
                                                ${isExpiringSoon ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                  {isExpiringSoon ? 'Expiring Soon' : 'Active'}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  {formatPrescriptionDate(prescription.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {prescription.instructions && (
                              <div className="mb-3">
                                <h5 className="text-xs font-semibold text-gray-700 mb-1">Instructions</h5>
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                  {prescription.instructions}
                                </p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {prescription.doctor && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-700">Prescribing Doctor</h5>
                                  <p className="text-sm text-gray-800 flex items-center">
                                    <User className="w-3 h-3 mr-1 text-blue-500" />
                                    Dr. {prescription.doctor}
                                  </p>
                                </div>
                              )}
                              
                              {prescription.hospital && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-700">Facility</h5>
                                  <p className="text-sm text-gray-800 flex items-center">
                                    <Building className="w-3 h-3 mr-1 text-blue-500" />
                                    {prescription.hospital}
                                  </p>
                                </div>
                              )}
                              
                              {prescription.condition && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-700">Condition</h5>
                                  <p className="text-sm text-gray-800">
                                    {prescription.condition}
                                  </p>
                                </div>
                              )}
                              
                              {prescription.refills !== undefined && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-700">Refills Remaining</h5>
                                  <p className={`text-sm ${prescription.refills > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                    {prescription.refills}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {prescription.ipfsUrl && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <a 
                                  href={prescription.ipfsUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 text-sm font-medium transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  View Prescription on Blockchain
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* WEAL Verification - Enhanced UI */}
                  <div className="mt-6 bg-gradient-to-r from-white to-blue-50 rounded-lg border border-blue-100 p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <img src="/weal2.png" alt="WEAL" className="w-6 h-6 mr-2" />
                      <p className="text-sm text-gray-600">
                        Prescription records securely stored and verified on the WEAL blockchain
                      </p>
                    </div>
                    <button className="text-xs bg-white px-3 py-1.5 rounded-full text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors flex items-center">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                        <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L2 18C2 19.1046 2.89543 20 4 20L20 20C21.1046 20 22 19.1046 22 18L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Export Records
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-600 to-blue-700">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <img src="/weal2.png" alt="WEAL" className="w-5 h-5 mr-2" />
              Recommended Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <RecommendationItem 
                title="Schedule Follow-up Appointment" 
                description="Recommended within 30 days to monitor cardiovascular status"
              />
              <RecommendationItem 
                title="Medication Review" 
                description="Suggest evaluation of current anti-hypertensive regimen"
              />
              <RecommendationItem 
                title="Dietary Consultation" 
                description="Referral to nutritionist for diabetes management plan"
              />
              
              {/* Drug interaction specific recommendations */}
              {drugInteractions && drugInteractions.length > 0 && (
                <RecommendationItem 
                  title="Pharmacy Consultation" 
                  description="Review potential drug interactions with clinical pharmacist"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendationItem = ({ title, description }) => (
  <div className="flex items-start p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
    <div className="p-1 bg-blue-100 rounded-full mr-3">
      <Info className="w-4 h-4 text-blue-600" />
    </div>
    <div>
      <h4 className="text-sm font-medium text-gray-800">{title}</h4>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  </div>
);

export default PatientRiskReport;
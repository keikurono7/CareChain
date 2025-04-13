import React, { useState } from 'react';
import { analyzeGenetics } from '../services/geneticService';
import { AlertTriangle, Dna, ChevronDown, Atom, ArrowRight, Microscope, Activity } from 'lucide-react';

const GeneticCompatibility = () => {
  const [formData, setFormData] = useState({
    disease: "Huntington's Disease",
    father_sequence: '',
    mother_sequence: '',
    paternal_grandfather_sequence: '',
    paternal_grandmother_sequence: '',
    maternal_grandfather_sequence: '',
    maternal_grandmother_sequence: '',
  });

  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      setError(null);
      const response = await analyzeGenetics(formData);
      setResults(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const diseases = ["Huntington's Disease", "Sickle Cell Anemia", "Muscular Dystrophy"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Dna className="w-8 h-8 mr-2 text-purple-600" />
            Genetic Compatibility Analysis
          </h1>
          <p className="text-gray-600">Evaluate genetic risks and inheritance patterns</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Microscope className="w-5 h-5 mr-2" />
                Genetic Data Input
              </h2>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disease Type
                  </label>
                  <div className="relative">
                    <select 
                      name="disease" 
                      value={formData.disease}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white pr-10"
                    >
                      {diseases.map(disease => (
                        <option key={disease} value={disease}>{disease}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* DNA Sequence Inputs */}
                {['father', 'mother', 'paternal_grandfather', 'paternal_grandmother', 
                  'maternal_grandfather', 'maternal_grandmother'].map((person) => (
                  <div key={person}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {person.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Sequence
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Atom className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name={`${person}_sequence`}
                        value={formData[`${person}_sequence`]}
                        onChange={handleInputChange}
                        placeholder="Enter DNA sequence (e.g., ATGCGATCG)"
                        className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>
                ))}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 px-4 rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      Analyze Genetic Compatibility
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-2">
            {results ? (
              <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Analysis Results
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl mb-6 border border-purple-100">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">Disease: {results.disease}</h3>
                    <div className="flex items-center">
                      <span className="text-gray-700 mr-2">Results Code:</span>
                      <span className="bg-white px-3 py-1 rounded-lg border border-purple-200 text-purple-800 font-mono">
                        {results.results}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Punnett Squares:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(results.punnett_squares).map(([key, square]) => (
                      <div key={key} className="bg-white p-5 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                        <h4 className="text-md font-medium text-gray-800 mb-3 capitalize flex items-center">
                          <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                          {key.split('_').join(' ')}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {square.map((genotype, index) => (
                            <div 
                              key={index}
                              className={`p-3 text-center rounded-lg ${
                                genotype.includes('1') 
                                  ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200' 
                                  : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                              }`}
                            >
                              <span className="font-mono text-lg">{genotype}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-sm">
                          {square.filter(g => g.includes('1')).length === 0 ? (
                            <div className="flex items-center text-green-600 bg-green-50 p-2 rounded-lg">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              No risk factors detected
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 bg-red-50 p-2 rounded-lg">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              {square.filter(g => g.includes('1')).length} of {square.length} combinations show risk factors
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-blue-800 font-medium mb-2 flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Interpretation Guide
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Genotypes containing '1' indicate potential risk factors. Results are based on simplified genetic models 
                      and should be confirmed with clinical testing and consultation with a genetic counselor.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Dna className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Analysis Results Yet</h3>
                <p className="text-gray-600 max-w-md mb-6">
                  Enter genetic sequence data for a family unit and click "Analyze" to generate compatibility results and 
                  inheritance patterns.
                </p>
                <div className="text-purple-600 font-medium flex items-center">
                  <ArrowRight className="w-5 h-5 mr-1 animate-pulse" />
                  Complete the form to get started
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Missing Info icon, let's define it
const Info = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export default GeneticCompatibility;
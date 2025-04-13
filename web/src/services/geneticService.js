export const analyzeGenetics = async (geneticData) => {
  try {
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'omit',
      body: JSON.stringify(geneticData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Failed to analyze genetics: ${error.message}`);
  }
};
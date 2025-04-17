import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../global';

export default function DietScreen() {
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);

  // Fetch user email from secure storage on component mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        if (storedEmail) {
          setUserEmail(storedEmail);
          fetchDietPlan(storedEmail); // Fetch diet plan once we have the email
        }
      } catch (error) {
        console.error('Failed to retrieve email:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserEmail();
  }, []);

  const fetchDietPlan = async (email = userEmail) => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/diet-plan/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success && data.plan) {
        setDietPlan(data.plan);
      }
    } catch (error) {
      console.error('Error fetching diet plan:', error);
      Alert.alert('Error', 'Failed to fetch diet plan. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateDietPlan = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'You must be logged in to generate a diet plan.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-diet-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDietPlan(data.plan);
        Alert.alert('Success', 'Diet plan generated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to generate diet plan.');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      Alert.alert('Error', 'Failed to generate diet plan. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };

  const renderDietPlan = () => {
    if (!dietPlan) return null;

    return (
      <View style={styles.planContainer}>
        <Text style={styles.generatedDate}>Generated on: {dietPlan.generatedAt}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.text}>{dietPlan.overview}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Meal Plan</Text>
          {dietPlan.mealPlan.map((meal, i) => (
            <View key={i} style={styles.mealItem}>
              <Text style={styles.mealTitle}>{meal.meal}</Text>
              <Text style={styles.text}>{meal.description}</Text>
              <Text style={styles.foodList}>{meal.suggestions.join(', ')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Recommendations</Text>
          {dietPlan.recommendations.map((rec, i) => (
            <Text key={i} style={styles.listItem}>• {rec}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.text}>{dietPlan.notes}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Personal Diet Plan</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, generating && styles.disabledButton]}
          onPress={generateDietPlan}
          disabled={generating || !userEmail}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate Diet Plan</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]}
          onPress={() => fetchDietPlan()}
          disabled={loading || !userEmail}
        >
          {loading ? (
            <ActivityIndicator color="#3498db" />
          ) : (
            <Text style={styles.secondaryButtonText}>View Diet Plan</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : !userEmail ? (
        <Text style={styles.noDataText}>
          Please log in to view or generate your diet plan.
        </Text>
      ) : dietPlan ? (
        renderDietPlan()
      ) : (
        <Text style={styles.noDataText}>
          No diet plan found. Generate a personalized diet plan based on your health data.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // All styles remain the same
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  button: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loader: {
    marginTop: 50,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 50,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  planContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generatedDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 5,
  },
  mealItem: {
    marginBottom: 15,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#34495e',
    marginBottom: 5,
  },
  foodList: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#7f8c8d',
  },
  listItem: {
    fontSize: 15,
    lineHeight: 24,
    color: '#34495e',
    marginBottom: 5,
    paddingLeft: 5,
  },
});
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const userName = "Sarah"; // This would come from user profile data
  
  // Mock data for the dashboard
  const alerts = [
    { id: 1, type: 'medication', title: 'Medication Reminder', message: 'Take Lisinopril at 8:00 PM', time: '30 min ago' },
    { id: 2, type: 'appointment', title: 'Upcoming Appointment', message: 'Dr. Johnson on April 15, 10:00 AM', time: '2 hours ago' },
    { id: 3, type: 'report', title: 'Lab Results Available', message: 'Your blood work results are ready to view', time: '1 day ago' },
    { id: 4, type: 'wellness', title: 'Wellness Milestone', message: 'You reached your step goal for 5 days in a row!', time: '2 days ago' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {userName}</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/profile')}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        {/* Wellness Plan Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/(tabs)/diet')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="nutrition" size={24} color="#4a6da7" />
            <Text style={styles.cardTitle}>Today's Wellness Plan</Text>
          </View>
          <Text style={styles.cardDescription}>Your personalized health plan for today</Text>
          <View style={styles.cardContent}>
            <View style={styles.planItem}>
              <Text style={styles.planItemLabel}>Breakfast:</Text>
              <Text style={styles.planItemValue}>Oatmeal with berries</Text>
            </View>
            <View style={styles.planItem}>
              <Text style={styles.planItemLabel}>Exercise:</Text>
              <Text style={styles.planItemValue}>30 min walking</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardAction}>View Plan</Text>
            <Ionicons name="chevron-forward" size={20} color="#4a6da7" />
          </View>
        </TouchableOpacity>

        {/* Latest Prescription Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/prescriptions')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="medical" size={24} color="#4a6da7" />
            <Text style={styles.cardTitle}>Latest Prescription</Text>
          </View>
          <Text style={styles.cardDescription}>Your most recent medication</Text>
          <View style={styles.prescriptionContent}>
            <Text style={styles.medicationName}>Lisinopril 10mg</Text>
            <Text style={styles.medicationDetails}>Take once daily • Dr. Emily Chen</Text>
            <Text style={styles.medicationDate}>Prescribed: April 5, 2025</Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardAction}>View Details</Text>
            <Ionicons name="chevron-forward" size={20} color="#4a6da7" />
          </View>
        </TouchableOpacity>

        {/* Risk Level Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push('/reports')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="analytics" size={24} color="#4a6da7" />
            <Text style={styles.cardTitle}>Health Risk Assessment</Text>
          </View>
          <Text style={styles.cardDescription}>Your current health status</Text>
          <View style={styles.riskContent}>
            <View style={styles.riskBadge}>
              <Text style={styles.riskText}>LOW RISK</Text>
            </View>
            <Text style={styles.riskDescription}>
              Your health metrics are within normal ranges.
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardAction}>View Report</Text>
            <Ionicons name="chevron-forward" size={20} color="#4a6da7" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.alertsSection}>
        <Text style={styles.alertsTitle}>Recent Alerts</Text>
        
        {alerts.map(alert => (
          <TouchableOpacity key={alert.id} style={styles.alertCard}>
            <View style={styles.alertIconContainer}>
              <Ionicons 
                name={
                  alert.type === 'medication' ? 'medical' : 
                  alert.type === 'appointment' ? 'calendar' : 
                  alert.type === 'report' ? 'document-text' : 'fitness'
                } 
                size={24} 
                color="#4a6da7" 
              />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  cardContent: {
    marginBottom: 15,
  },
  planItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  planItemLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    width: 80,
  },
  planItemValue: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  cardAction: {
    fontSize: 15,
    color: '#4a6da7',
    fontWeight: 'bold',
    marginRight: 5,
  },
  prescriptionContent: {
    marginBottom: 15,
  },
  medicationName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  medicationDetails: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5,
  },
  medicationDate: {
    fontSize: 14,
    color: '#777',
  },
  riskContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  riskBadge: {
    backgroundColor: '#e7f7e7',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  riskText: {
    color: '#2a9d2a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  riskDescription: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  alertsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  alertsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 5,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  alertMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
});
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function ReportView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [report, setReport] = useState(null);
  
  useEffect(() => {
    if (params.report) {
      try {
        const reportData = JSON.parse(params.report);
        setReport(reportData);
      } catch (error) {
        console.error('Error parsing report:', error);
      }
    }
  }, [params]);

  const handleShare = async () => {
    if (!report) return;
    
    try {
      let shareText = `
MEDICAL REPORT SUMMARY
----------------------

${report.summary}

HEALTH INSIGHTS
--------------

${report.insights.map(insight => `• ${insight}`).join('\n')}

RECOMMENDATIONS
--------------

${report.recommendations.map(rec => `• ${rec}`).join('\n')}

Note: This AI-generated report is for informational purposes only and does not replace professional medical advice.
`;

      await Share.share({
        message: shareText,
        title: "Medical Report"
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Report data not available</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Report</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#4a6da7" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContent}>
        <View style={styles.reportContainer}>
          <View style={styles.reportHeader}>
            <MaterialIcons name="description" size={24} color="#4a6da7" />
            <Text style={styles.reportTitle}>Health Summary Report</Text>
          </View>
          
          <View style={styles.reportDate}>
            <Text style={styles.dateText}>
              Generated: {report.generatedAt || new Date().toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.sectionText}>{report.summary}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Insights</Text>
            {report.insights.map((insight, index) => (
              <View key={index} style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{insight}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {report.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{recommendation}</Text>
              </View>
            ))}
          </View>
          
          {report.medications && report.medications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Medications</Text>
              {report.medications.map((medication, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{medication}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerTitle}>Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              This AI-generated report is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. 
              Always consult with qualified healthcare providers regarding any medical conditions or treatments.
            </Text>
          </View>
          
          <View style={styles.aiNote}>
            <Ionicons name="logo-google" size={14} color="#4a6da7" />
            <Text style={styles.aiNoteText}>Generated with Google Gemini 1.5 Pro</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  reportContainer: {
    padding: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  reportDate: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 34,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6da7',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4a6da7',
    marginTop: 8,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  disclaimerContainer: {
    backgroundColor: '#f6f1ea',
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#e8a04a',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b16a0e',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#6b5c46',
    lineHeight: 20,
  },
  aiNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  aiNoteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a6da7',
  },
});
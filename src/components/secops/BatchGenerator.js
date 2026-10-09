import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Key, Copy, CheckCircle2, ShieldCheck, Sparkles, Download, Layers } from 'lucide-react-native';

export default function BatchGenerator() {
  const [coursePrefix, setCoursePrefix] = useState('CC105');
  const [courseName, setCourseName] = useState('Applications Development & Emerging Tech');
  const [sectionCount, setSectionCount] = useState('4');
  const [academicTerm, setAcademicTerm] = useState('1st Sem 2026-2027');
  const [generatedCodes, setGeneratedCodes] = useState([
    { id: '1', code: 'CC105-SEC01-78A9', section: 'Section 01 (Day)', created: 'Just now', capacity: 50 },
    { id: '2', code: 'CC105-SEC02-31F4', section: 'Section 02 (Evening)', created: 'Just now', capacity: 50 },
  ]);
  const [copiedId, setCopiedId] = useState(null);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateBatch = () => {
    const count = parseInt(sectionCount, 10);
    if (isNaN(count) || count < 1 || count > 20) {
      Alert.alert('Invalid Count', 'Please specify between 1 and 20 sections to generate.');
      return;
    }

    const newItems = [];
    for (let i = 1; i <= count; i++) {
      const secNum = i < 10 ? `0${i}` : `${i}`;
      const codeSuffix = generateRandomCode();
      const codeString = `${coursePrefix.toUpperCase().trim()}-SEC${secNum}-${codeSuffix}`;
      newItems.push({
        id: Date.now().toString() + i,
        code: codeString,
        section: `Section ${secNum} (${academicTerm})`,
        created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        capacity: 50,
      });
    }

    setGeneratedCodes(newItems);
    Alert.alert('Batch Created', `Successfully generated ${count} course access codes for ${coursePrefix}!`);
  };

  const handleCopy = (id, code) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const csvContent =
      'Section,Access Code,Academic Term,Capacity\n' +
      generatedCodes.map((c) => `"${c.section}","${c.code}","${academicTerm}",${c.capacity}`).join('\n');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${coursePrefix}_Batch_Codes_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Export CSV', 'CSV generated with ' + generatedCodes.length + ' entries.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          <View style={styles.iconCircle}>
            <Key size={22} color="#38BDF8" />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Course Access Code Batch Generator</Text>
            <Text style={styles.bannerSub}>
              Batch instantiate multi-section course join keys with automated SOC audit tracking
            </Text>
          </View>
        </View>

        {/* Form Grid */}
        <View style={styles.formGrid}>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Course Code Prefix:</Text>
            <TextInput
              style={styles.input}
              value={coursePrefix}
              onChangeText={setCoursePrefix}
              placeholder="e.g. CC105, IT12"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={[styles.inputCol, { flex: 2 }]}>
            <Text style={styles.label}>Course Title / Description:</Text>
            <TextInput
              style={styles.input}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g. Database Management Systems"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputCol}>
            <Text style={styles.label}>Number of Sections:</Text>
            <TextInput
              style={styles.input}
              value={sectionCount}
              onChangeText={setSectionCount}
              keyboardType="numeric"
              placeholder="e.g. 4"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputCol}>
            <Text style={styles.label}>Academic Term:</Text>
            <TextInput
              style={styles.input}
              value={academicTerm}
              onChangeText={setAcademicTerm}
              placeholder="e.g. 1st Sem 2026-2027"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateBatch} activeOpacity={0.85}>
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={styles.generateBtnText}>Generate Section Access Codes</Text>
        </TouchableOpacity>
      </View>

      {/* Generated Codes Table Card */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderBar}>
          <View style={styles.tableTitleGroup}>
            <Layers size={18} color="#38BDF8" />
            <Text style={styles.tableTitle}>Generated Course Access Matrix ({generatedCodes.length})</Text>
          </View>

          <TouchableOpacity style={styles.exportCsvBtn} onPress={handleExportCSV} activeOpacity={0.8}>
            <Download size={14} color="#38BDF8" />
            <Text style={styles.exportCsvText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { flex: 1.2 }]}>SECTION / TERM</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: 'center' }]}>INSTITUTIONAL ACCESS CODE</Text>
          <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>CAPACITY</Text>
          <Text style={[styles.th, { width: 100, textAlign: 'right' }]}>ACTION</Text>
        </View>

        {generatedCodes.map((item) => {
          const isCopied = copiedId === item.id;
          return (
            <View key={item.id} style={styles.tableRow}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.sectionName}>{item.section}</Text>
                <Text style={styles.timeText}>Created {item.created}</Text>
              </View>

              <View style={{ flex: 1.5, alignItems: 'center' }}>
                <View style={styles.codePill}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
              </View>

              <View style={{ width: 100, alignItems: 'center' }}>
                <Text style={styles.capacityText}>{item.capacity} Seats</Text>
              </View>

              <View style={{ width: 100, alignItems: 'flex-end' }}>
                <TouchableOpacity
                  style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                  onPress={() => handleCopy(item.id, item.code)}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 size={13} color="#10B981" />
                      <Text style={styles.copyTextSuccess}>COPIED</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={13} color="#38BDF8" />
                      <Text style={styles.copyText}>COPY</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerCard: {
    backgroundColor: '#0B132B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    marginBottom: 20,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 16,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  bannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  inputCol: {
    flex: 1,
    minWidth: 200,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#F8FAFC',
  },
  generateBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableCard: {
    backgroundColor: '#0B132B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  tableHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tableTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  exportCsvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportCsvText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#060D1F',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  th: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#131F37',
  },
  sectionName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  codePill: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },
  capacityText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  copyText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  copyTextSuccess: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
});

/**
 * ============================================================================
 * MODULE: Institutional Privacy Notice & Data Governance Modal
 * DIRECTORY: src/components/PrivacyNoticeModal.js
 * ROLE/SCOPE: RA 10173 (Philippine Data Privacy Act) Compliance Dialogue
 * DESCRIPTION:
 *   Comprehensive compliance modal informing students, faculty, and administrators
 *   of data collection practices, automated SecOps WAF telemetry, user rights
 *   under RA 10173, and official Data Protection Officer (DPO) contact channels.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT INSTANTIATION & TAB CONFIGURATION
 *   3. RENDER: HEADER & TAB NAVIGATION
 *   4. RENDER: TAB CONTENT PANELS
 *   5. RENDER: MODAL FOOTER & ACKNOWLEDGEMENT
 *   6. COMPONENT STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import UIcon from './UIcon';
import theme from '../theme';

// ============================================================================
// SECTION 2: COMPONENT INSTANTIATION & TAB CONFIGURATION
// ============================================================================

/**
 * Institutional privacy notice dialog component.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal dialog is displayed
 * @param {Function} props.onClose - Dismissal callback function
 * @returns {React.ReactElement} Compliance modal dialog
 */
export default function PrivacyNoticeModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'collection' | 'security' | 'rights' | 'dpo'

  // F-04 Remediation: Keyboard trap & Escape key dismissal for WCAG 2.1 AA dialog compliance
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof window === 'undefined') return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  const tabs = [
    { id: 'summary', label: 'Overview' },
    { id: 'collection', label: 'Data Collected' },
    { id: 'security', label: 'Security & WAF' },
    { id: 'rights', label: 'Your Rights' },
    { id: 'dpo', label: 'DPO Contact' },
  ];

  // ==========================================================================
  // SECTION 3: RENDER: HEADER & TAB NAVIGATION
  // ==========================================================================
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      accessibilityRole="dialog"
      accessibilityModal={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard} accessibilityRole="dialog">
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.shieldIconBox}>
                <UIcon name="institution" size={20} color="#059669" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.modalTitle}>Institutional Privacy Notice</Text>
                  <View style={styles.lawBadge}>
                    <Text style={styles.lawBadgeText}>RA 10173 COMPLIANT</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>
                  University of Mindanao - Academic Data Governance Policy
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <UIcon name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={styles.tabBarContent}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[styles.tabItemText, activeTab === tab.id && styles.tabItemTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ================================================================ */}
          {/* SECTION 4: RENDER: TAB CONTENT PANELS                            */}
          {/* ================================================================ */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {activeTab === 'summary' && (
              <View style={styles.tabContentSection}>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightTitle}>Commitment to Privacy</Text>
                  <Text style={styles.highlightText}>
                    The University of Mindanao and the UMINIKTA Academic Portal are committed to safeguarding the personal, academic, and behavioral data of all students, faculty members, and institutional personnel in accordance with the Republic Act No. 10173, otherwise known as the Philippine Data Privacy Act of 2012 (DPA), its Implementing Rules and Regulations (IRR), and relevant National Privacy Commission (NPC) issuances.
                  </Text>
                </View>

                <Text style={styles.paragraphHeading}>Key Privacy Principles</Text>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Transparency:</Text> We explicitly inform you about what data is collected, why it is needed, and how it is processed.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Legitimate Purpose:</Text> Data is processed exclusively for enrolled academic classes, LMS instruction, grading, and cyber defense.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Proportionality:</Text> Only the minimum necessary information required to facilitate university learning and prevent malicious traffic is collected.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'collection' && (
              <View style={styles.tabContentSection}>
                <Text style={styles.paragraphHeading}>Categories of Data We Process</Text>

                <View style={styles.dataCategoryCard}>
                  <Text style={styles.dataCategoryTitle}>1. Personal Identity & Credentials</Text>
                  <Text style={styles.dataCategoryText}>
                    Full Name, Institutional Email Address (`@umindanao.edu.ph`), Student/Faculty ID Number, Chosen Campus (e.g. Matina, Bolton), Profile Avatar, and Encrypted Authentication Tokens.
                  </Text>
                </View>

                <View style={styles.dataCategoryCard}>
                  <Text style={styles.dataCategoryTitle}>2. Academic & Course Records</Text>
                  <Text style={styles.dataCategoryText}>
                    Class Enrollments, Class Code Submissions, Instructor Assignments, Classroom Announcements, Submitted Files, Discussion Posts, and Academic Timestamps.
                  </Text>
                </View>

                <View style={styles.dataCategoryCard}>
                  <Text style={styles.dataCategoryTitle}>3. Cybersecurity & Telemetry Logs (007 Hardened)</Text>
                  <Text style={styles.dataCategoryText}>
                    Client IP Address, Country/Geolocation, Node Verification (detection of unauthorized proxies, Tor, and VPNs), Network User Agent, and WAF Security Verdicts.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'security' && (
              <View style={styles.tabContentSection}>
                <View style={styles.securityAlertBox}>
                  <UIcon name="institution" size={24} color="#3B82F6" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.securityAlertTitle}>Multi-Tiered Technical Defense</Text>
                    <Text style={styles.securityAlertSub}>
                      UMINIKTA implements institutional-grade encryption, database row-level security (RLS), and automated Web Application Firewall (WAF) perimeter monitoring.
                    </Text>
                  </View>
                </View>

                <Text style={styles.paragraphHeading}>Security Safeguards in Place</Text>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Supabase Row Level Security (RLS):</Text> Students can only view classes and posts they are legitimately enrolled in.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Encrypted Keystores:</Text> Native mobile credentials use hardware-backed Expo SecureStore; web sessions use segregated local storage.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Security WAF & Geo-Fencing:</Text> Automated defense blocks credential-stuffing bots, non-Philippine proxy nodes, and brute-force actors.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>
                    <Text style={styles.boldText}>Offline Mutation Queue:</Text> Encrypted offline queue ensures local mutations sync cleanly when an authenticated network connection returns.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'rights' && (
              <View style={styles.tabContentSection}>
                <Text style={styles.paragraphHeading}>Your Statutory Rights under RA 10173</Text>
                <Text style={styles.paragraphIntro}>
                  As an enrolled student or faculty data subject of the University of Mindanao, you are endowed with the following statutory rights:
                </Text>

                <View style={styles.rightsGrid}>
                  <View style={styles.rightCard}>
                    <Text style={styles.rightCardTitle}>Right to be Informed</Text>
                    <Text style={styles.rightCardDesc}>
                      To know whether your personal academic data is being collected and how it will be processed.
                    </Text>
                  </View>

                  <View style={styles.rightCard}>
                    <Text style={styles.rightCardTitle}>Right to Access</Text>
                    <Text style={styles.rightCardDesc}>
                      To view your enrolled classes, submitted academic materials, and profile details anytime.
                    </Text>
                  </View>

                  <View style={styles.rightCard}>
                    <Text style={styles.rightCardTitle}>Right to Rectification</Text>
                    <Text style={styles.rightCardDesc}>
                      To dispute and correct inaccurate academic information through your faculty advisor or SecOps.
                    </Text>
                  </View>

                  <View style={styles.rightCard}>
                    <Text style={styles.rightCardTitle}>Right to Erasure</Text>
                    <Text style={styles.rightCardDesc}>
                      To request suspension, withdrawal, or removal of unauthorized or unlawfully obtained personal data.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'dpo' && (
              <View style={styles.tabContentSection}>
                <Text style={styles.paragraphHeading}>Data Protection Officer (DPO) Contact</Text>
                <Text style={styles.paragraphIntro}>
                  For privacy inquiries, rights assertions, or reporting potential data incidents involving UMINIKTA:
                </Text>

                <View style={styles.dpoCard}>
                  <Text style={styles.dpoOrgTitle}>University of Mindanao Data Protection Office</Text>
                  <Text style={styles.dpoDetailText}>Office: University DPO, Matina Campus, Davao City, Philippines</Text>
                  <Text style={styles.dpoDetailText}>Email: dpo@umindanao.edu.ph</Text>
                  <Text style={styles.dpoDetailText}>Portal Security: secops@umindanao.edu.ph</Text>
                  <Text style={styles.dpoDetailText}>Telephone: (082) 300-5456 local 128</Text>
                  <Text style={styles.dpoDetailText}>Official Portal: https://umindanao.edu.ph</Text>
                </View>

                <Text style={styles.dpoNote}>
                  National Privacy Commission (NPC) Circular No. 16-01: You may also file formal complaints directly with the National Privacy Commission at privacy.gov.ph if you believe your privacy rights have been violated.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* ================================================================ */}
          {/* SECTION 5: RENDER: MODAL FOOTER & ACKNOWLEDGEMENT                */}
          {/* ================================================================ */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerNote}>
              By using UMINIKTA, you acknowledge and agree to this Privacy Notice.
            </Text>
            <TouchableOpacity style={styles.acceptBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.acceptBtnText}>I Understand & Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// SECTION 6: COMPONENT STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: '100%',
    maxWidth: 680,
    maxHeight: '88%',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  shieldIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  lawBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lawBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    maxHeight: 48,
  },
  tabBarContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabItemTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: 440,
  },
  tabContentSection: {
    gap: 16,
  },
  highlightCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 16,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 20,
  },
  paragraphHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  paragraphIntro: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  dataCategoryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  dataCategoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  dataCategoryText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  securityAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 16,
  },
  securityAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  securityAlertSub: {
    fontSize: 12,
    color: '#2563EB',
    lineHeight: 18,
    marginTop: 2,
  },
  rightsGrid: {
    gap: 10,
  },
  rightCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  rightCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
  },
  rightCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  dpoCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 18,
    gap: 8,
  },
  dpoOrgTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  dpoDetailText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  dpoNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerNote: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    minWidth: 200,
  },
  acceptBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

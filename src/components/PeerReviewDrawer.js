/**
 * ============================================================================
 * MODULE: Collaborative Peer Review & Team Evaluation Drawer
 * DIRECTORY: src/components/PeerReviewDrawer.js
 * ROLE/SCOPE: Confidential Multi-Criteria Peer Rubric & Draft Repository
 * DESCRIPTION:
 *   Collaborative capstone evaluation drawer enabling students to perform
 *   confidential peer scoring across Technical Execution, Work Quality, and
 *   Team Collaboration metrics. Also provides team roster overview and shared
 *   draft repository tracking.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT INSTANTIATION & EVALUATION STATE
 *   3. SUBMISSION HANDLERS & SCORE COMPUTATION
 *   4. RENDER: DRAWER HEADER & TAB CONTROLS
 *   5. RENDER: PEER SCORING & RUBRIC PANEL
 *   6. RENDER: TEAM ROSTER & DRAFTS REPOSITORY
 *   7. COMPONENT STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import UIcon from './UIcon';
import { useConfirm } from '../context/ConfirmContext';

// ============================================================================
// SECTION 2: COMPONENT INSTANTIATION & EVALUATION STATE
// ============================================================================

/**
 * Peer evaluation and capstone team collaboration drawer.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal display status
 * @param {Function} props.onClose - Drawer dismissal callback
 * @param {string} [props.taskTitle='Term Capstone Project'] - Capstone assignment name
 * @param {string} [props.teamName='Team Delta: Distributed Systems Lab'] - Student group name
 * @param {string} [props.subjectCode='CC105'] - Subject catalog identifier
 * @returns {React.ReactElement} Peer evaluation modal drawer
 */
export default function PeerReviewDrawer({
  visible,
  onClose,
  taskTitle = 'Term Capstone Project',
  teamName = 'Team Delta: Distributed Systems Lab',
  subjectCode = 'CC105',
}) {
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'team' | 'drafts'
  const [selectedTeammateId, setSelectedTeammateId] = useState('st-2');
  
  // Peer Scoring Criteria (Max 100 Pts total)
  const [techScore, setTechScore] = useState(38); // Max 40
  const [qualityScore, setQualityScore] = useState(28); // Max 30
  const [collabScore, setCollabScore] = useState(29); // Max 30
  const [writtenRemarks, setWrittenRemarks] = useState('');
  const [submittedReviews, setSubmittedReviews] = useState({});

  const teammates = [
    { id: 'st-1', name: 'Alex Rivera', role: 'Full-Stack Lead Architect', idNumber: '2023-88129', status: 'Self' },
    { id: 'st-2', name: 'Beatriz Santos', role: 'Database & Security Specialist', idNumber: '2023-90451', status: 'Pending Review' },
    { id: 'st-3', name: 'Christian Garcia', role: 'API Integration & Middleware', idNumber: '2023-77402', status: 'Pending Review' },
    { id: 'st-4', name: 'Danielle Cruz', role: 'QA & Unit Testing Lead', idNumber: '2023-66190', status: 'Pending Review' },
  ];

  const teamDrafts = [
    { id: 'd-1', version: 'v3 (Final Candidate)', fileName: 'TeamDelta_CC105_FinalBuild.zip', size: '14.8 MB', uploadedAt: 'Oct 5, 2026 - 09:30 PM', uploadedBy: 'Beatriz Santos' },
    { id: 'd-2', version: 'v2 (Integration Draft)', fileName: 'TeamDelta_CC105_Integration_v2.zip', size: '13.2 MB', uploadedAt: 'Oct 3, 2026 - 04:15 PM', uploadedBy: 'Alex Rivera' },
    { id: 'd-3', version: 'v1 (Starter Schema)', fileName: 'TeamDelta_ERD_Architecture_v1.pdf', size: '2.4 MB', uploadedAt: 'Sep 28, 2026 - 11:20 AM', uploadedBy: 'Danielle Cruz' },
  ];

  const { confirm } = useConfirm();
  const totalScore = Math.min(100, Math.max(0, techScore + qualityScore + collabScore));

  // ==========================================================================
  // SECTION 3: SUBMISSION HANDLERS & SCORE COMPUTATION
  // ==========================================================================

  const handleSubmitEvaluation = async () => {
    const targetTeammate = teammates.find((t) => t.id === selectedTeammateId);
    if (!targetTeammate) return;

    const proceed = await confirm({
      title: 'Confirm Confidential Evaluation',
      message: `Submit ${totalScore}/100 peer review evaluation for ${targetTeammate.name}? This confidential assessment is directly integrated into the instructor gradebook weighting.`,
      confirmText: 'Submit Evaluation',
      confirmColor: '#059669',
      icon: 'check',
      isDestructive: false,
    });

    if (proceed) {
      setSubmittedReviews((prev) => ({
        ...prev,
        [selectedTeammateId]: {
          score: totalScore,
          remarks: writtenRemarks || 'Peer met and exceeded technical project milestones.',
          submittedAt: new Date().toLocaleTimeString(),
        },
      }));
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Evaluation for ${targetTeammate.name} recorded successfully. Score: ${totalScore}/100`);
      } else {
        Alert.alert(
          'Peer Evaluation Submitted',
          `Evaluation for ${targetTeammate.name} recorded successfully. Score: ${totalScore}/100`
        );
      }
    }
  };

  const handleReEvaluate = async () => {
    const proceed = await confirm({
      title: 'Reset Peer Evaluation',
      message: 'Are you sure you want to clear your recorded evaluation and re-score this teammate?',
      confirmText: 'Re-Evaluate',
      confirmColor: '#4F46E5',
      icon: 'alert',
      isDestructive: false,
    });
    if (proceed) {
      setSubmittedReviews((prev) => {
        const copy = { ...prev };
        delete copy[selectedTeammateId];
        return copy;
      });
    }
  };

  const currentReview = submittedReviews[selectedTeammateId];

  // ==========================================================================
  // SECTION 4: RENDER: DRAWER HEADER & TAB CONTROLS
  // ==========================================================================
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.drawerCard}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.courseBadge}>
                  <Text style={styles.courseBadgeText}>{subjectCode} CAPSTONE</Text>
                </View>
                <View style={styles.teamBadge}>
                  <Text style={styles.teamBadgeText}>{teamName}</Text>
                </View>
              </View>
              <Text style={styles.drawerTitle} numberOfLines={1}>{taskTitle}</Text>
              <Text style={styles.drawerSubtitle}>
                Sub-Team Workspaces, Iterative Drafts & Confidential Peer Reviews
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <UIcon name="close" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tab Bar */}
          <View style={styles.tabBar}>
            {[
              { key: 'review', label: 'Peer Evaluation', icon: 'clipboard' },
              { key: 'team', label: 'Team Roster', icon: 'users' },
              { key: 'drafts', label: 'Draft Revisions', icon: 'file' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <UIcon
                    name={tab.icon}
                    size={14}
                    color={isActive ? '#064E3B' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Drawer Body */}
          <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
            {/* ============================================================== */}
            {/* SECTION 5: RENDER: PEER SCORING & RUBRIC PANEL                 */}
            {/* ============================================================== */}
            {activeTab === 'review' && (
              <View style={styles.tabContent}>
                {/* Teammate Selection Chips */}
                <Text style={styles.sectionHeading}>Select Teammate to Review:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teammateScroll}>
                  {teammates.filter(t => t.status !== 'Self').map((tm) => {
                    const isSelected = selectedTeammateId === tm.id;
                    const isEvaluated = Boolean(submittedReviews[tm.id]);
                    return (
                      <TouchableOpacity
                        key={tm.id}
                        style={[
                          styles.teammateChip,
                          isSelected && styles.teammateChipActive,
                          isEvaluated && styles.teammateChipDone,
                        ]}
                        onPress={() => setSelectedTeammateId(tm.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.teammateChipTop}>
                          <Text style={[styles.teammateName, isSelected && styles.teammateNameActive]}>
                            {tm.name}
                          </Text>
                          {isEvaluated && (
                            <View style={styles.doneBadge}>
                              <UIcon name="check" size={10} color="#059669" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.teammateRole}>{tm.role}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {currentReview ? (
                  /* Review Summary State */
                  <View style={styles.evaluationSummaryCard}>
                    <View style={styles.summaryTopRow}>
                      <View>
                        <Text style={styles.summaryTitle}>Evaluation Recorded</Text>
                        <Text style={styles.summaryTimestamp}>Submitted at {currentReview.submittedAt}</Text>
                      </View>
                      <View style={styles.summaryScoreBox}>
                        <Text style={styles.summaryScoreNum}>{currentReview.score}</Text>
                        <Text style={styles.summaryScoreDenom}>/100</Text>
                      </View>
                    </View>
                    <Text style={styles.summaryRemarksLabel}>Confidential Remarks:</Text>
                    <Text style={styles.summaryRemarksBody}>"{currentReview.remarks}"</Text>
                    <TouchableOpacity
                      style={styles.reEditBtn}
                      onPress={handleReEvaluate}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.reEditText}>Re-Evaluate Teammate</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Interactive Peer Scoring Form */
                  <View style={styles.scoringFormCard}>
                    <View style={styles.scoreHeroRow}>
                      <View>
                        <Text style={styles.scoreHeroLabel}>Aggregate Peer Mark</Text>
                        <Text style={styles.scoreHeroSub}>Weighted contribution composite</Text>
                      </View>
                      <View style={styles.scoreHeroValueBox}>
                        <Text style={styles.scoreHeroValueNum}>{totalScore}</Text>
                        <Text style={styles.scoreHeroValueDenom}>/100</Text>
                      </View>
                    </View>

                    {/* Criteria 1: Technical Implementation (Max 40) */}
                    <View style={styles.criteriaRow}>
                      <View style={styles.criteriaHeader}>
                        <Text style={styles.criteriaTitle}>1. Technical Execution & Code Logic</Text>
                        <Text style={styles.criteriaScoreText}>{techScore} / 40 Pts</Text>
                      </View>
                      <View style={styles.stepperRow}>
                        {[25, 30, 35, 40].map((val) => (
                          <TouchableOpacity
                            key={'tech-' + val}
                            style={[styles.stepperPill, techScore === val && styles.stepperPillActive]}
                            onPress={() => setTechScore(val)}
                          >
                            <Text style={[styles.stepperText, techScore === val && styles.stepperTextActive]}>
                              {val} Pts
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Criteria 2: Code Quality & Architecture (Max 30) */}
                    <View style={styles.criteriaRow}>
                      <View style={styles.criteriaHeader}>
                        <Text style={styles.criteriaTitle}>2. Code Quality & Modularity</Text>
                        <Text style={styles.criteriaScoreText}>{qualityScore} / 30 Pts</Text>
                      </View>
                      <View style={styles.stepperRow}>
                        {[15, 20, 25, 30].map((val) => (
                          <TouchableOpacity
                            key={'qual-' + val}
                            style={[styles.stepperPill, qualityScore === val && styles.stepperPillActive]}
                            onPress={() => setQualityScore(val)}
                          >
                            <Text style={[styles.stepperText, qualityScore === val && styles.stepperTextActive]}>
                              {val} Pts
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Criteria 3: Collaboration & Accountability (Max 30) */}
                    <View style={styles.criteriaRow}>
                      <View style={styles.criteriaHeader}>
                        <Text style={styles.criteriaTitle}>3. Collaboration & Communication</Text>
                        <Text style={styles.criteriaScoreText}>{collabScore} / 30 Pts</Text>
                      </View>
                      <View style={styles.stepperRow}>
                        {[15, 20, 25, 30].map((val) => (
                          <TouchableOpacity
                            key={'collab-' + val}
                            style={[styles.stepperPill, collabScore === val && styles.stepperPillActive]}
                            onPress={() => setCollabScore(val)}
                          >
                            <Text style={[styles.stepperText, collabScore === val && styles.stepperTextActive]}>
                              {val} Pts
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Written Feedback Input */}
                    <View style={styles.remarksInputGroup}>
                      <Text style={styles.remarksInputLabel}>Confidential Qualitative Remarks:</Text>
                      <TextInput
                        style={styles.remarksTextInput}
                        placeholder="Detail technical strengths and areas for milestone improvement..."
                        placeholderTextColor="#9CA3AF"
                        multiline={true}
                        numberOfLines={3}
                        value={writtenRemarks}
                        onChangeText={setWrittenRemarks}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.submitEvalBtn}
                      onPress={handleSubmitEvaluation}
                      activeOpacity={0.85}
                    >
                      <UIcon name="check" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitEvalText}>Submit Peer Evaluation</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ============================================================== */}
            {/* SECTION 6: RENDER: TEAM ROSTER & DRAFTS REPOSITORY             */}
            {/* ============================================================== */}
            {activeTab === 'team' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeading}>Active Sub-Team Roster:</Text>
                <View style={styles.teamRosterList}>
                  {teammates.map((tm) => (
                    <View key={tm.id} style={styles.rosterCard}>
                      <View style={styles.rosterLeftCol}>
                        <View style={styles.rosterAvatar}>
                          <Text style={styles.rosterAvatarText}>{tm.name.charAt(0)}</Text>
                        </View>
                        <View>
                          <Text style={styles.rosterName}>{tm.name}</Text>
                          <Text style={styles.rosterRoleText}>{tm.role}</Text>
                          <Text style={styles.rosterIdText}>ID: {tm.idNumber}</Text>
                        </View>
                      </View>
                      <View style={[styles.rosterStatusBadge, tm.status === 'Self' ? styles.selfBadge : styles.pendingBadge]}>
                        <Text style={[styles.rosterStatusText, tm.status === 'Self' ? styles.selfBadgeText : styles.pendingBadgeText]}>
                          {tm.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'drafts' && (
              <View style={styles.tabContent}>
                <View style={styles.draftsTopBar}>
                  <Text style={styles.sectionHeading}>Shared Project Drafts:</Text>
                  <TouchableOpacity
                    style={styles.uploadDraftBtn}
                    onPress={() => Alert.alert('Upload Draft Iteration', 'Select revised zip or document to commit to the team repository.')}
                    activeOpacity={0.8}
                  >
                    <UIcon name="paperclip" size={13} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.uploadDraftText}>Upload Revision</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.draftsList}>
                  {teamDrafts.map((df) => (
                    <View key={df.id} style={styles.draftCard}>
                      <View style={styles.draftTopRow}>
                        <View style={styles.draftVersionPill}>
                          <Text style={styles.draftVersionText}>{df.version}</Text>
                        </View>
                        <Text style={styles.draftSize}>{df.size}</Text>
                      </View>
                      <Text style={styles.draftFileName}>{df.fileName}</Text>
                      <View style={styles.draftFooter}>
                        <Text style={styles.draftMeta}>Committed by {df.uploadedBy}</Text>
                        <Text style={styles.draftTimestamp}>{df.uploadedAt}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================================
// SECTION 7: COMPONENT STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  drawerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1.5,
    borderBottomColor: '#BBF7D0',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  courseBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  courseBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  teamBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabItemTextActive: {
    color: '#064E3B',
    fontWeight: '800',
  },
  drawerBody: {
    padding: 20,
  },
  tabContent: {
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  teammateScroll: {
    marginBottom: 20,
  },
  teammateChip: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    minWidth: 160,
  },
  teammateChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  teammateChipDone: {
    borderColor: '#10B981',
  },
  teammateChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teammateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  teammateNameActive: {
    color: '#064E3B',
  },
  doneBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 3,
  },
  teammateRole: {
    fontSize: 11,
    color: '#6B7280',
  },
  scoringFormCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 20,
  },
  scoreHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  scoreHeroLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  scoreHeroSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreHeroValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreHeroValueNum: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
  },
  scoreHeroValueDenom: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 2,
  },
  criteriaRow: {
    marginBottom: 18,
  },
  criteriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  criteriaScoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperPill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperPillActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  stepperText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  stepperTextActive: {
    color: '#FFFFFF',
  },
  remarksInputGroup: {
    marginVertical: 14,
  },
  remarksInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  remarksTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
  },
  submitEvalBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitEvalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  evaluationSummaryCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
  },
  summaryTimestamp: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  summaryScoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryScoreNum: {
    fontSize: 28,
    fontWeight: '900',
    color: '#064E3B',
  },
  summaryScoreDenom: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
  summaryRemarksLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryRemarksBody: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#1F2937',
    lineHeight: 18,
  },
  reEditBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  teamRosterList: {
    gap: 10,
  },
  rosterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
  },
  rosterLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rosterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  rosterName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  rosterRoleText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  rosterIdText: {
    fontSize: 11,
    color: '#6B7280',
  },
  rosterStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selfBadge: {
    backgroundColor: '#E5E7EB',
  },
  selfBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  draftsTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  uploadDraftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  draftsList: {
    gap: 10,
  },
  draftCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
  },
  draftTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  draftVersionPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  draftVersionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  draftSize: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  draftFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  draftMeta: {
    fontSize: 11,
    color: '#4B5563',
  },
  draftTimestamp: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

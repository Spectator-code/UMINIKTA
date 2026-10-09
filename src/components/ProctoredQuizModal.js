/**
 * ============================================================================
 * MODULE: Anti-Cheat Proctored Knowledge Assessment Modal
 * DIRECTORY: src/components/ProctoredQuizModal.js
 * ROLE/SCOPE: Secure High-Stakes Exam Supervision & Integrity Engine
 * DESCRIPTION:
 *   Proctored assessment runtime for students featuring page visibility / blur
 *   listeners (detecting tab switching or window defocusing), countdown exam timer,
 *   automated lockdown violation enforcement (maximum 3 violations allowed), and
 *   automatic submission scoring.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. QUESTION BANK DATASET
 *   3. COMPONENT INSTANTIATION & PROCTORING STATE
 *   4. PROCTORING TELEMETRY & COUNTDOWN TIMER HOOKS
 *   5. QUIZ EVALUATION & SUBMISSION HANDLERS
 *   6. RENDER: PROCTORED EXAM SHELL
 *   7. COMPONENT STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  AppState,
} from 'react-native';
import UIcon from './UIcon';

// ============================================================================
// SECTION 2: QUESTION BANK DATASET
// ============================================================================
const SAMPLE_QUESTIONS = [
  {
    id: 'q1',
    question: 'In database normalization, which normal form eliminates transitive functional dependencies?',
    options: [
      { id: 'a', text: 'First Normal Form (1NF)' },
      { id: 'b', text: 'Second Normal Form (2NF)' },
      { id: 'c', text: 'Third Normal Form (3NF)', correct: true },
      { id: 'd', text: 'Boyce-Codd Normal Form (BCNF)' },
    ],
  },
  {
    id: 'q2',
    question: 'Which ACID property guarantees that database transactions are committed to non-volatile memory and survive system crashes?',
    options: [
      { id: 'a', text: 'Atomicity' },
      { id: 'b', text: 'Consistency' },
      { id: 'c', text: 'Isolation' },
      { id: 'd', text: 'Durability', correct: true },
    ],
  },
  {
    id: 'q3',
    question: 'What is the worst-case time complexity of searching an unbalanced Binary Search Tree (BST)?',
    options: [
      { id: 'a', text: 'O(log N)' },
      { id: 'b', text: 'O(1)' },
      { id: 'c', text: 'O(N)', correct: true },
      { id: 'd', text: 'O(N log N)' },
    ],
  },
  {
    id: 'q4',
    question: 'In modern relational database architectures, what primary advantage does a B+ Tree index provide over a standard B-Tree index?',
    options: [
      { id: 'a', text: 'Requires zero disk space' },
      { id: 'b', text: 'Sequential range queries only traverse linked leaf nodes', correct: true },
      { id: 'c', text: 'Eliminates all foreign key constraints' },
      { id: 'd', text: 'Converts SQL queries into NoSQL documents' },
    ],
  },
];

// ============================================================================
// SECTION 3: COMPONENT INSTANTIATION & PROCTORING STATE
// ============================================================================

/**
 * High-stakes proctored assessment component.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal display status
 * @param {Function} props.onClose - Modal closure callback
 * @param {string} [props.quizTitle='Midterm Proctored Knowledge Assessment'] - Assessment header title
 * @param {string} [props.courseCode='CC105'] - Subject institutional catalog code
 * @param {Function} [props.onComplete] - Callback reporting score and violation telemetry
 * @returns {React.ReactElement} Secure proctored exam modal
 */
export default function ProctoredQuizModal({
  visible,
  onClose,
  quizTitle = 'Midterm Proctored Knowledge Assessment',
  courseCode = 'CC105',
  onComplete,
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const timerRef = useRef(null);

  // ==========================================================================
  // SECTION 4: PROCTORING TELEMETRY & COUNTDOWN TIMER HOOKS
  // ==========================================================================

  // Tab switch & visibility monitoring
  useEffect(() => {
    if (!visible || finished || lockedOut) return;

    // Web Page Visibility API
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleFocusLoss();
        }
      };

      const handleWindowBlur = () => {
        handleFocusLoss();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
      };
    } else {
      // Native AppState Listener
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState !== 'active') {
          handleFocusLoss();
        }
      });
      return () => subscription.remove();
    }
  }, [visible, finished, lockedOut]);

  // Countdown timer loop
  useEffect(() => {
    if (!visible || finished || lockedOut) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, finished, lockedOut]);

  // ==========================================================================
  // SECTION 5: QUIZ EVALUATION & SUBMISSION HANDLERS
  // ==========================================================================

  const handleFocusLoss = () => {
    setTabSwitchCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setLockedOut(true);
      }
      return next;
    });
  };

  const handleAutoSubmit = () => {
    finishQuiz(true);
  };

  const finishQuiz = (forced = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    SAMPLE_QUESTIONS.forEach((q) => {
      const chosen = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.correct);
      if (chosen === correctOpt?.id) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100);
    setFinalScore(scorePct);
    setFinished(true);

    if (onComplete) {
      onComplete({
        score: scorePct,
        tabSwitches: tabSwitchCount,
        forced,
      });
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const currentQ = SAMPLE_QUESTIONS[currentIdx];

  const handleSelectOption = (optId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optId,
    }));
  };

  const handleNext = () => {
    if (currentIdx < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm('Are you sure you want to finish and submit your proctored assessment? Answers cannot be revised after submission.')) {
          finishQuiz(false);
        }
        return;
      }
      Alert.alert(
        'Submit Assessment',
        'Are you sure you want to finish and submit your proctored assessment? Answers cannot be revised after submission.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm & Submit', onPress: () => finishQuiz(false) },
        ]
      );
    }
  };

  // ==========================================================================
  // SECTION 6: RENDER: PROCTORED EXAM SHELL
  // ==========================================================================
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        if (!finished && !lockedOut) {
          Alert.alert('Assessment in Progress', 'You cannot close the window during a proctored assessment.');
        } else {
          onClose();
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.quizCard}>
          {/* Header Bar */}
          <View style={styles.quizHeader}>
            <View>
              <View style={styles.headerBadgeRow}>
                <View style={styles.courseBadge}>
                  <Text style={styles.courseBadgeText}>{courseCode}</Text>
                </View>
                <View style={styles.proctoredBadge}>
                  <UIcon name="lock" size={11} color="#B45309" style={{ marginRight: 4 }} />
                  <Text style={styles.proctoredBadgeText}>LOCKDOWN MODE ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.quizTitle} numberOfLines={1}>{quizTitle}</Text>
            </View>

            {/* Timer Badge */}
            <View style={[styles.timerPill, secondsRemaining < 120 && styles.timerPillUrgent]}>
              <UIcon name="clock" size={13} color={secondsRemaining < 120 ? '#DC2626' : '#064E3B'} style={{ marginRight: 6 }} />
              <Text style={[styles.timerText, secondsRemaining < 120 && styles.timerTextUrgent]}>
                {formatTimer(secondsRemaining)}
              </Text>
            </View>
          </View>

          {/* Anti-Cheat Tab-Switch Warning Banner */}
          {tabSwitchCount > 0 && !lockedOut && !finished && (
            <View style={styles.violationBanner}>
              <UIcon name="shield" size={14} color="#B45309" style={{ marginRight: 8 }} />
              <Text style={styles.violationText}>
                Anti-Cheat Notice: Tab-switch detected ({tabSwitchCount}/3). Focus loss is logged to the faculty desk.
              </Text>
            </View>
          )}

          {/* Locked Out State */}
          {lockedOut && (
            <View style={styles.stateContainer}>
              <View style={styles.lockoutIconCircle}>
                <UIcon name="lock" size={36} color="#DC2626" />
              </View>
              <Text style={styles.lockoutHeading}>Assessment Locked Out</Text>
              <Text style={styles.lockoutSub}>
                Maximum window focus loss violations (3/3) exceeded. Your assessment has been flagged and submitted to the course instructor for academic review.
              </Text>
              <TouchableOpacity style={styles.lockoutDoneBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.lockoutDoneText}>Return to Course Stream</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Finished State */}
          {finished && !lockedOut && (
            <View style={styles.stateContainer}>
              <View style={styles.successIconCircle}>
                <UIcon name="check" size={38} color="#059669" />
              </View>
              <Text style={styles.successHeading}>Assessment Submitted</Text>
              <Text style={styles.successScoreNum}>{finalScore}%</Text>
              <Text style={styles.successSub}>
                {finalScore >= 75 ? 'Passing Score Verified' : 'Evaluation Completed'} • Integrated into Gradebook
              </Text>
              {tabSwitchCount === 0 ? (
                <View style={styles.integrityCleanBadge}>
                  <Text style={styles.integrityCleanText}>Integrity Verification: 0 Violations Recorded</Text>
                </View>
              ) : (
                <View style={styles.integrityWarningBadge}>
                  <Text style={styles.integrityWarningText}>Integrity Flag: {tabSwitchCount} Focus Loss Events Recorded</Text>
                </View>
              )}
              <TouchableOpacity style={styles.finishBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.finishBtnText}>Close & Return</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Quiz Content */}
          {!lockedOut && !finished && (
            <ScrollView style={styles.quizBody} showsVerticalScrollIndicator={false}>
              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  Question {currentIdx + 1} of {SAMPLE_QUESTIONS.length}
                </Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${((currentIdx + 1) / SAMPLE_QUESTIONS.length) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Question Box */}
              <View style={styles.questionCard}>
                <Text style={styles.questionText}>{currentQ.question}</Text>
              </View>

              {/* Options List */}
              <View style={styles.optionsList}>
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => handleSelectOption(opt.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Navigation Controls */}
              <View style={styles.actionsRow}>
                {currentIdx > 0 ? (
                  <TouchableOpacity
                    style={styles.prevBtn}
                    onPress={() => setCurrentIdx((prev) => prev - 1)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.prevBtnText}>Previous Question</Text>
                  </TouchableOpacity>
                ) : <View />}

                <TouchableOpacity
                  style={[styles.nextBtn, !selectedAnswers[currentQ.id] && styles.nextBtnDisabled]}
                  onPress={handleNext}
                  disabled={!selectedAnswers[currentQ.id]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextBtnText}>
                    {currentIdx === SAMPLE_QUESTIONS.length - 1 ? 'Finish & Submit' : 'Next Question ->'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// SECTION 7: COMPONENT STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 640,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 12,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
  },
  proctoredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  proctoredBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timerPillUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  timerText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#064E3B',
  },
  timerTextUrgent: {
    color: '#DC2626',
  },
  violationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  violationText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
    flex: 1,
  },
  quizBody: {
    padding: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBarBg: {
    width: 140,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 22,
  },
  optionsList: {
    gap: 10,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
  },
  optionCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#059669',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  optionTextSelected: {
    color: '#064E3B',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  prevBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  nextBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  nextBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockoutIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockoutHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#991B1B',
    marginBottom: 10,
  },
  lockoutSub: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 440,
    marginBottom: 24,
  },
  lockoutDoneBtn: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lockoutDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#064E3B',
    marginBottom: 6,
  },
  successScoreNum: {
    fontSize: 48,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 16,
  },
  integrityCleanBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  integrityCleanText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  integrityWarningBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  integrityWarningText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  finishBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

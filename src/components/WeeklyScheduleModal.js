/**
 * ============================================================================
 * MODULE: Weekly Academic Course Schedule Modal
 * DIRECTORY: src/components/WeeklyScheduleModal.js
 * ROLE/SCOPE: Role-Aware Weekly Calendar & Classroom Block Viewer
 * DESCRIPTION:
 *   Interactive academic calendar dialog mapping course meeting times, classroom
 *   locations, and instructional session types across days of the week (Mon-Fri)
 *   tailored for students and faculty.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. SCHEDULE CURATION DATASETS (STUDENT & FACULTY)
 *   3. COMPONENT INSTANTIATION & STATE HOOKS
 *   4. RENDER: HEADER & DAY SELECTOR PILLS
 *   5. RENDER: TIME SLOT TIMELINE & ROOM ALLOCATIONS
 *   6. RENDER: FOOTER SUMMARY & DISMISSAL
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
  Platform,
} from 'react-native';
import UIcon from './UIcon';

// ============================================================================
// SECTION 2: SCHEDULE CURATION DATASETS
// ============================================================================
const SCHEDULE_DATA_STUDENT = {
  Mon: [
    { code: 'CC105', name: 'Application Development & Emerging Tech', time: '08:00 AM - 10:00 AM', room: 'Lab 302', type: 'Lecture & Lab Practical' },
    { code: 'IT212', name: 'Information Management & Databases', time: '01:00 PM - 03:00 PM', room: 'Room 504', type: 'Lecture Discussion' },
  ],
  Tue: [
    { code: 'CS301', name: 'Algorithms & Data Structures', time: '09:00 AM - 11:00 AM', room: 'Lab 201', type: 'Hands-on Coding Lab' },
  ],
  Wed: [
    { code: 'CC105', name: 'Application Development & Emerging Tech', time: '08:00 AM - 10:00 AM', room: 'Lab 302', type: 'Project Review & Testing' },
    { code: 'IT212', name: 'Information Management & Databases', time: '01:00 PM - 03:00 PM', room: 'Room 504', type: 'SQL Normalization Lab' },
  ],
  Thu: [
    { code: 'CS301', name: 'Algorithms & Data Structures', time: '09:00 AM - 11:00 AM', room: 'Lab 201', type: 'Algorithm Complexity Analysis' },
    { code: 'EXAM', name: 'Midterm Assessment Period', time: '02:00 PM - 04:00 PM', room: 'Auditorium 1', type: 'Institutional Examination' },
  ],
  Fri: [
    { code: 'CC105', name: 'Capstone Group Consultation', time: '10:00 AM - 12:00 PM', room: 'Advisory Rm B', type: 'Faculty Consultation' },
  ],
};

const SCHEDULE_DATA_PROFESSOR = {
  Mon: [
    { code: 'CC105-01', name: 'App Dev Section 01', time: '08:00 AM - 10:00 AM', room: 'Lab 302', type: 'Instruction & Lab' },
    { code: 'IT212-02', name: 'Database Systems Section 02', time: '01:00 PM - 03:00 PM', room: 'Room 504', type: 'Lecture' },
  ],
  Tue: [
    { code: 'CS301-01', name: 'Data Structures Section 01', time: '09:00 AM - 11:00 AM', room: 'Lab 201', type: 'Lab Practical' },
    { code: 'OFFICE', name: 'Faculty Consultation Hours', time: '02:00 PM - 04:00 PM', room: 'Faculty Rm 204', type: 'Student Advising' },
  ],
  Wed: [
    { code: 'CC105-01', name: 'App Dev Section 01', time: '08:00 AM - 10:00 AM', room: 'Lab 302', type: 'Project Defense' },
    { code: 'IT212-02', name: 'Database Systems Section 02', time: '01:00 PM - 03:00 PM', room: 'Room 504', type: 'Schema Review' },
  ],
  Thu: [
    { code: 'CS301-01', name: 'Data Structures Section 01', time: '09:00 AM - 11:00 AM', room: 'Lab 201', type: 'Practical Exam' },
    { code: 'EXAM', name: 'Midterm Examination Proctoring', time: '02:00 PM - 04:00 PM', room: 'Auditorium 1', type: 'Exam Supervision' },
  ],
  Fri: [
    { code: 'DEPT', name: 'CCE Department Curriculum Meeting', time: '09:00 AM - 11:00 AM', room: 'Conference Hall', type: 'Departmental Session' },
    { code: 'OFFICE', name: 'Advising & Office Hours', time: '01:00 PM - 03:00 PM', room: 'Faculty Rm 204', type: 'Student Advising' },
  ],
};

// ============================================================================
// SECTION 3: COMPONENT INSTANTIATION & STATE HOOKS
// ============================================================================

/**
 * Role-aware weekly academic timetable dialog.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal visibility state
 * @param {Function} props.onClose - Modal dismissal handler
 * @param {'student'|'professor'} [props.role='student'] - Active user RBAC role
 * @param {Array} [props.subjects=[]] - Active registered subjects
 * @returns {React.ReactElement} Weekly schedule modal dialog
 */
export default function WeeklyScheduleModal({ visible, onClose, role = 'student', subjects = [] }) {
  const [selectedDay, setSelectedDay] = useState('Mon');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const isProfessor = role === 'professor';
  const primaryColor = isProfessor ? '#312E81' : '#064E3B';
  const accentColor = isProfessor ? '#4F46E5' : '#059669';
  const lightBg = isProfessor ? '#EEF2FF' : '#ECFDF5';

  const activeSchedule = isProfessor ? SCHEDULE_DATA_PROFESSOR : SCHEDULE_DATA_STUDENT;
  const currentSlots = activeSchedule[selectedDay] || [];

  // ==========================================================================
  // SECTION 4: RENDER: HEADER & DAY SELECTOR PILLS
  // ==========================================================================
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Row */}
          <View style={[styles.headerRow, { borderBottomColor: lightBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: lightBg }]}>
                <UIcon name="calendar" size={18} color={accentColor} />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {isProfessor ? 'Faculty Teaching Timetable' : 'Academic Class Timetable'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  First Semester 2026 - University of Mindanao Main Campus
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <UIcon name="close" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Day Navigation Tabs */}
          <View style={styles.daySelectorRow}>
            {days.map((day) => {
              const isActive = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayPill,
                    isActive && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      isActive && styles.dayPillTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ================================================================ */}
          {/* SECTION 5: RENDER: TIME SLOT TIMELINE & ROOM ALLOCATIONS         */}
          {/* ================================================================ */}
          <ScrollView
            style={styles.scheduleListScroll}
            contentContainerStyle={styles.scheduleListContent}
            showsVerticalScrollIndicator={false}
          >
            {currentSlots.length === 0 ? (
              <View style={styles.emptyDayCard}>
                <Text style={styles.emptyDayText}>No scheduled classes or sessions for {selectedDay}.</Text>
              </View>
            ) : (
              currentSlots.map((slot, index) => (
                <View key={index} style={styles.slotCard}>
                  {/* Time Column */}
                  <View style={[styles.slotTimeBox, { backgroundColor: lightBg }]}>
                    <Text style={[styles.slotTimeStart, { color: primaryColor }]}>
                      {slot.time.split(' - ')[0]}
                    </Text>
                    <Text style={styles.slotTimeDivider}>to</Text>
                    <Text style={styles.slotTimeEnd}>
                      {slot.time.split(' - ')[1]}
                    </Text>
                  </View>

                  {/* Course Details Column */}
                  <View style={styles.slotDetailsBox}>
                    <View style={styles.slotHeaderRow}>
                      <View style={[styles.codeBadge, { backgroundColor: lightBg }]}>
                        <Text style={[styles.codeBadgeText, { color: primaryColor }]}>
                          {slot.code}
                        </Text>
                      </View>
                      <View style={styles.roomPill}>
                        <UIcon name="location" size={11} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.roomText}>{slot.room}</Text>
                      </View>
                    </View>

                    <Text style={styles.slotNameText} numberOfLines={2}>
                      {slot.name}
                    </Text>

                    <View style={styles.slotTypeRow}>
                      <View style={[styles.slotTypeDot, { backgroundColor: accentColor }]} />
                      <Text style={styles.slotTypeText}>{slot.type}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* ================================================================ */}
          {/* SECTION 6: RENDER: FOOTER SUMMARY & DISMISSAL                    */}
          {/* ================================================================ */}
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>
              Active Cohort: Academic Year 2026-2027
            </Text>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: accentColor }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Close Timetable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// SECTION 7: COMPONENT STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  daySelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dayPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  scheduleListScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scheduleListContent: {
    paddingVertical: 16,
    gap: 12,
  },
  emptyDayCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDayText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  slotTimeBox: {
    width: 105,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  slotTimeStart: {
    fontSize: 12,
    fontWeight: '800',
  },
  slotTimeDivider: {
    fontSize: 10,
    color: '#64748B',
    marginVertical: 2,
  },
  slotTimeEnd: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  slotDetailsBox: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  slotNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  slotTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  slotTypeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  footerNote: {
    fontSize: 11,
    color: '#64748B',
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

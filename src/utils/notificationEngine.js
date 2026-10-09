/**
 * UMINIKTA Smart Notification Engine
 * Standardized institutional notification types, factories, automated deadline scanners,
 * and test alert simulation dispatchers.
 *
 * Adheres strictly to University of Mindanao Institutional Software Standards:
 * Zero-Emoji Policy, WCAG 2.1 AA/AAA contrast ratios, and Zero-PII compliance.
 */

export const NOTIFICATION_CATEGORIES = {
  ACADEMIC: 'academic',
  GRADE: 'grade',
  ANNOUNCEMENT: 'announcement',
  PEER_REVIEW: 'peer_review',
  SYSTEM: 'system',
};

export const NOTIFICATION_URGENCY = {
  URGENT: 'urgent',     // Due < 24h, Critical Security Alert
  WARNING: 'warning',   // Due in 24-72h, Attendance Warning
  NORMAL: 'normal',     // Grade Published, Feedback Added
  INFO: 'info',         // General Bulletin, Material Shared
};

/**
 * Creates a normalized institutional notification object.
 */
export function createNotification({
  title,
  body,
  category = NOTIFICATION_CATEGORIES.ACADEMIC,
  urgency = NOTIFICATION_URGENCY.NORMAL,
  actionRoute = null,
  actionLabel = null,
  courseId = null,
  courseCode = null,
}) {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title: String(title).trim(),
    body: String(body).trim(),
    category,
    urgency,
    actionRoute,
    actionLabel,
    courseId,
    courseCode,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

/**
 * Generates initial demo notifications tailored to the user's role
 * so that evaluators and users immediately have realistic, rich notifications to explore.
 */
export function getInitialDemoNotifications(role = 'student') {
  const isProf = role === 'professor' || role === 'faculty';

  if (isProf) {
    return [
      createNotification({
        title: 'Pending Lab Practical Evaluations',
        body: '14 unreviewed submissions in CC105 - Application Development Lab 04 require evaluation before the midterm grading lock.',
        category: NOTIFICATION_CATEGORIES.ACADEMIC,
        urgency: NOTIFICATION_URGENCY.URGENT,
        actionRoute: '/(professor)/subject/CC105',
        actionLabel: 'Open Grading Queue',
        courseCode: 'CC105',
      }),
      createNotification({
        title: 'Class Attendance Variance Alert',
        body: 'Section 54B in IT312 currently has 3 students flagged with at-risk attendance (>3 consecutive absences).',
        category: NOTIFICATION_CATEGORIES.ACADEMIC,
        urgency: NOTIFICATION_URGENCY.WARNING,
        actionRoute: '/(professor)/subject/IT312',
        actionLabel: 'Inspect Roster',
        courseCode: 'IT312',
      }),
      createNotification({
        title: 'Midterm Gradebook CSV Export Ready',
        body: 'Official registrar grade sheet for CC106 Section 02 has been compiled with curved distribution metrics.',
        category: NOTIFICATION_CATEGORIES.GRADE,
        urgency: NOTIFICATION_URGENCY.NORMAL,
        actionRoute: '/(professor)',
        actionLabel: 'View Course',
        courseCode: 'CC106',
      }),
      createNotification({
        title: 'College Dean Academic Advisory',
        body: 'CHED Institutional Accreditation audit schedule confirmed for Q1 2027. All faculty course syllabi must be synchronized in the Vault.',
        category: NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
        urgency: NOTIFICATION_URGENCY.INFO,
        actionRoute: '/(professor)',
        actionLabel: 'Read Memo',
      }),
    ];
  }

  // Student persona default backlog
  return [
    createNotification({
      title: 'Lab Practical 03 Submission Cut-off',
      body: 'CC105 Application Development: Module 3 Starter Project deadline expires in 4 hours. Automated late submission lockout active.',
      category: NOTIFICATION_CATEGORIES.ACADEMIC,
      urgency: NOTIFICATION_URGENCY.URGENT,
      actionRoute: '/(student)/subject/1',
      actionLabel: 'Submit Project',
      courseCode: 'CC105',
    }),
    createNotification({
      title: 'Examination Grade & Rubric Published',
      body: 'Prof. S. Vance published evaluations for CS311 - Advanced Algorithms Midterm Examination (Score: 94 / 100).',
      category: NOTIFICATION_CATEGORIES.GRADE,
      urgency: NOTIFICATION_URGENCY.NORMAL,
      actionRoute: '/(student)/subject/2',
      actionLabel: 'Inspect Feedback',
      courseCode: 'CS311',
    }),
    createNotification({
      title: 'Capstone Peer Review Invitation',
      body: 'Your team workspace "Sub-Team Alpha" has requested peer rubric evaluation on the software design document.',
      category: NOTIFICATION_CATEGORIES.PEER_REVIEW,
      urgency: NOTIFICATION_URGENCY.WARNING,
      actionRoute: '/(student)/subject/1',
      actionLabel: 'Review Teammates',
      courseCode: 'CC105',
    }),
    createNotification({
      title: 'Campus Network Maintenance Advisory',
      body: 'University of Mindanao IT Operations: Scheduled fiber gateway maintenance on Sunday from 02:00 to 05:00 PHT.',
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      urgency: NOTIFICATION_URGENCY.INFO,
      actionRoute: '/(student)',
      actionLabel: 'View Campus Notice',
    }),
  ];
}

/**
 * Evaluates upcoming coursework deadlines and yields urgent alerts
 * if any assignment has a deadline within 24 hours and has not been notified.
 */
export function scanUpcomingDeadlines(courses = [], existingNotifs = []) {
  const newAlerts = [];
  const now = new Date().getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  courses.forEach((course) => {
    if (!course?.activities) return;

    course.activities.forEach((activity) => {
      if (!activity.dueDate) return;
      const dueTime = new Date(activity.dueDate).getTime();
      const timeLeft = dueTime - now;

      // Flag if due in < 24h and hasn't passed
      if (timeLeft > 0 && timeLeft <= ONE_DAY_MS) {
        const notifTag = `deadline-${activity.id || activity.title}`;
        const alreadyNotified = existingNotifs.some(
          (n) => n.id.includes(notifTag) || (n.title.includes(activity.title) && n.urgency === NOTIFICATION_URGENCY.URGENT)
        );

        if (!alreadyNotified) {
          const hoursLeft = Math.max(1, Math.round(timeLeft / (1000 * 60 * 60)));
          newAlerts.push(
            createNotification({
              title: `Urgent: ${activity.title} Due in ${hoursLeft}h`,
              body: `${course.code || 'Course'}: Submission portal closes in ${hoursLeft} hours. Please ensure your submission draft is turned in.`,
              category: NOTIFICATION_CATEGORIES.ACADEMIC,
              urgency: NOTIFICATION_URGENCY.URGENT,
              actionRoute: `/(student)/subject/${course.id}`,
              actionLabel: 'Turn In Now',
              courseCode: course.code,
            })
          );
        }
      }
    });
  });

  return newAlerts;
}

/**
 * Simulator Presets for Interactive Testing
 */
export const SIMULATION_PRESETS = [
  {
    id: 'sim-urgent-deadline',
    label: '24h Deadline Warning',
    badge: '[URGENT DEADLINE]',
    color: '#EF4444',
    payload: {
      title: 'Lab Practical 04 Due in 3 Hours',
      body: 'CC105: Submission cut-off at 23:59 PHT tonight. Hard lockout timer active.',
      category: NOTIFICATION_CATEGORIES.ACADEMIC,
      urgency: NOTIFICATION_URGENCY.URGENT,
      actionRoute: '/(student)/subject/1',
      actionLabel: 'Submit Now',
    },
  },
  {
    id: 'sim-grade-published',
    label: 'Grade Curve Release',
    badge: '[GRADE PUBLISHED]',
    color: '#059669',
    payload: {
      title: 'Midterm Normal Curve Grade Released',
      body: 'Prof. Vance applied normal curve adjustment (+5 pts) to CC105 Lab 03. Your new score: 98/100.',
      category: NOTIFICATION_CATEGORIES.GRADE,
      urgency: NOTIFICATION_URGENCY.NORMAL,
      actionRoute: '/(student)/subject/1',
      actionLabel: 'View Gradebook',
    },
  },
  {
    id: 'sim-peer-review',
    label: 'Capstone Rubric Review',
    badge: '[PEER REVIEW]',
    color: '#D97706',
    payload: {
      title: 'Teammate Submitted Milestone Review',
      body: 'Team Alpha: Technical design rubric scored 28/30. Please inspect feedback comments.',
      category: NOTIFICATION_CATEGORIES.PEER_REVIEW,
      urgency: NOTIFICATION_URGENCY.WARNING,
      actionRoute: '/(student)/subject/1',
      actionLabel: 'Inspect Rubric',
    },
  },
  {
    id: 'sim-campus-alert',
    label: 'Campus Security Advisory',
    badge: '[CAMPUS ALERT]',
    color: '#312E81',
    payload: {
      title: 'Emergency Advisory: Typhoon Weather Stoppage',
      body: 'University Chancellor: Classes transition to asynchronous online learning today due to signal warning.',
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      urgency: NOTIFICATION_URGENCY.URGENT,
      actionRoute: '/(student)',
      actionLabel: 'View Bulletin',
    },
  },
];

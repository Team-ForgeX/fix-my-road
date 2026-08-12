export type NotificationType = "report_submitted" | "report_updated" | "report_resolved" | "new_report_alert" | "filter_match" | "system";

export type NotificationPriority = "low" | "medium" | "high";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  report_id?: string;
  incident_id?: string;
  related_user_id?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  action_url?: string;
};

export type NotificationFilter = {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  reportId?: string;
};

// Notification templates for different scenarios
export const NOTIFICATION_TEMPLATES = {
  REPORT_SUBMITTED: (reportTitle: string) => ({
    type: "report_submitted" as NotificationType,
    priority: "medium" as NotificationPriority,
    title: "Report Submitted",
    message: `Your report "${reportTitle}" has been successfully submitted and is awaiting verification.`
  }),
  
  REPORT_UPDATED: (reportTitle: string, stage: string) => ({
    type: "report_updated" as NotificationType,
    priority: "high" as NotificationPriority,
    title: "Report Update",
    message: `Your report "${reportTitle}" has been updated to stage: ${stage}`
  }),

  REPORT_RESOLVED: (reportTitle: string) => ({
    type: "report_resolved" as NotificationType,
    priority: "high" as NotificationPriority,
    title: "Report Resolved",
    message: `Your report "${reportTitle}" has been marked as resolved.`
  }),

  NEW_REPORT_ALERT: (reportTitle: string, severity: string, location: string) => ({
    type: "new_report_alert" as NotificationType,
    priority: severity === "high" ? ("high" as NotificationPriority) : ("medium" as NotificationPriority),
    title: "New Report Alert",
    message: `New ${severity} severity report: "${reportTitle}" in ${location}`
  }),

  LOCATION_FILTER_MATCH: (reportTitle: string, location: string) => ({
    type: "filter_match" as NotificationType,
    priority: "medium" as NotificationPriority,
    title: "Report in Your Area",
    message: `A new report matching your filter has been submitted in ${location}: "${reportTitle}"`
  })
};

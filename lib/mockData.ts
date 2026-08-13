import type { UserProfile } from "../types/user";
import type { Report, ReportMedia } from "../types/report";
import type { Incident } from "../types/incident";

export const currentUser: UserProfile = {
  id: "u100",
  full_name: "Aisha Verma",
  role: "client",
  avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=120&q=80"
};

export const reportMedia: ReportMedia[] = [
  {
    id: "m1",
    report_id: "r100",
    media_type: "image",
    file_name: "parking_lot.jpg",
    thumbnail_url: "https://images.unsplash.com/photo-1542224566-1c9b16db7ea4?auto=format&fit=crop&w=400&q=80",
    size: 220_000,
    created_at: "2026-08-06T09:15:00.000Z"
  },
  {
    id: "m2",
    report_id: "r102",
    media_type: "video",
    file_name: "flood_leak.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
    size: 1_400_000,
    created_at: "2026-08-07T07:24:00.000Z"
  }
];

export const incidentList: Incident[] = [
  {
    id: "I501",
    title: "Garbage accumulation near Oak Street",
    problem_type: "Garbage accumulation",
    severity: "high",
    status: "in_progress",
    description: "Multiple reports of unmanaged waste around the residential block.",
    latitude: 28.6139,
    longitude: 77.2090,
    address: "Oak Street, Sector 7",
    locality: "Sector 7",
    city: "New Delhi",
    report_count: 6,
    created_at: "2026-08-01T08:00:00.000Z",
    updated_at: "2026-08-07T14:42:00.000Z"
  },
  {
    id: "I502",
    title: "Broken streetlight near City Mall",
    problem_type: "Streetlight",
    severity: "medium",
    status: "assigned",
    description: "Darkness at night due to non-functioning pole fixtures.",
    latitude: 28.7041,
    longitude: 77.1025,
    address: "Main Road, City Mall",
    locality: "City Mall",
    city: "New Delhi",
    report_count: 2,
    created_at: "2026-08-03T10:00:00.000Z",
    updated_at: "2026-08-05T11:00:00.000Z"
  }
];

export const reports: Report[] = [
  {
    id: "R1024",
    user_id: "u100",
    incident_id: "I501",
    title: "Garbage accumulation at the corner",
    description: "A large pile of trash has been sitting near the bus stop for three days.",
    latitude: 28.6128,
    longitude: 77.2080,
    address: "Near Bus Stop, Oak Street",
    landmark: "Bus stop",
    locality: "Sector 7",
    city: "New Delhi",
    created_at: "2026-08-07T16:20:00.000Z",
    processing_state: "incident_matched",
    status: "in_progress",
    severity: "high",
    report_count: 6,
    is_duplicate: false,
    media: [reportMedia[0]]
  },
  {
    id: "R1031",
    user_id: "u100",
    title: "Broken streetlight near the mall",
    description: "The streetlight stays off after sundown, making the sidewalk unsafe.",
    latitude: 28.7041,
    longitude: 77.1025,
    address: "City Mall Road",
    locality: "City Mall",
    city: "New Delhi",
    created_at: "2026-08-05T11:10:00.000Z",
    processing_state: "assigned",
    status: "in_progress",
    severity: "medium",
    report_count: 2,
    is_duplicate: false,
    media: [reportMedia[1]]
  },
  {
    id: "R1035",
    user_id: "u100",
    title: "Water leakage near the market",
    description: "Water is pooling on the road after the pipeline break.",
    latitude: 28.7050,
    longitude: 77.1030,
    address: "Market Road",
    locality: "Sector 4",
    city: "New Delhi",
    created_at: "2026-08-04T09:00:00.000Z",
    processing_state: "submitted",
    status: "open",
    severity: "medium",
    report_count: 1,
    is_duplicate: false,
    media: []
  }
];

export const statistics = {
  totalReports: 42,
  activeReports: 17,
  resolvedReports: 21,
  communitiesEngaged: 540
};

import { supabase } from "./supabaseClient";
import type { Report, ReportStatus } from "../types/report";
import type { UserProfile } from "../types/user";

export { supabase };

export type SaveReportPayload = {
  userId: string;
  title?: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  mediaFiles?: File[];
};

export type AdminActionPayload = {
  incidentId: string;
  adminId: string;
  newStatus: ReportStatus | "rejected";
  departmentId?: string;
  officerId?: string;
  note?: string;
};

type SupabaseFallbackResult = {
  success: false;
  error: string;
  isFallback?: true;
};

type SubmitReportSuccess = {
  success: true;
  reportId: string;
  incidentId: string | null;
  message: string;
  isFallback?: true;
};

type AdminActionSuccess = {
  success: true;
  isFallback?: true;
};

export type SubmitReportResult = SubmitReportSuccess | SupabaseFallbackResult | { success: false; error: string; isFallback?: true };
export type ExecuteAdminActionResult = AdminActionSuccess | SupabaseFallbackResult | { success: false; error: string; isFallback?: true };

export async function fetchUserProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("id, full_name, role, phone, created_at, updated_at")
    .eq("id", userId)
    .single<UserProfile>();
}

export async function createCitizenProfile(profile: {
  id: string;
  full_name: string;
  phone?: string | null;
  role?: "client" | "citizen" | "admin";
}) {
  return supabase
    .from("profiles")
    .insert({
      id: profile.id,
      full_name: profile.full_name,
      phone: profile.phone || null,
      role: profile.role || "client"
    })
    .select("id, full_name, role, phone, created_at, updated_at")
    .single();
}

export async function updateIdentityVerification(userId: string, verified: boolean) {
  return supabase
    .from("profiles")
    .update({ identity_verified: verified, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, identity_verified")
    .single();
}

/**
 * Submits a new citizen report into Supabase.
 * Uploads media files to 'report-media' bucket and calls process_report_deduplication RPC.
 */
export async function submitReportToSupabase(payload: SaveReportPayload): Promise<SubmitReportResult> {
  try {
    // 1. Insert into reports table
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: payload.userId,
        description: payload.description,
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
        landmark: payload.landmark || null,
        city: payload.city || null,
        pincode: payload.pincode || null,
        source_type: "web",
        processing_state: "pending"
      })
      .select()
      .single();

    if (reportError || !report) {
      throw new Error(reportError?.message || "Failed to create report record.");
    }

    // 2. Upload media files if provided
    if (payload.mediaFiles && payload.mediaFiles.length > 0) {
      for (const file of payload.mediaFiles) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${report.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const mediaType = file.type.startsWith("video") ? "video" : "image";

        const { error: uploadError } = await supabase.storage
          .from("report-media")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("report-media")
            .getPublicUrl(filePath);

          await supabase.from("report_media").insert({
            report_id: report.id,
            media_type: mediaType,
            storage_bucket: "report-media",
            storage_path: publicUrlData?.publicUrl || filePath,
            mime_type: file.type,
            file_size: file.size
          });
        }
      }
    }

    // 3. Trigger smart deduplication PL/pgSQL function
    let incidentId: string | null = null;
    const { data: dedupeResult, error: dedupeErr } = await supabase.rpc(
      "process_report_deduplication",
      { p_report_id: report.id, p_radius_meters: 100.0 }
    );

    if (!dedupeErr && dedupeResult) {
      incidentId = dedupeResult;
    }

    return {
      success: true,
      reportId: report.id,
      incidentId,
      message: "Report submitted and processed successfully."
    };
  } catch (err: any) {
    console.warn("Supabase report submission error, falling back:", err?.message);
    return { success: false, error: err?.message || "Error communicating with Supabase." };
  }
}

/**
 * Process admin state update on an incident in Supabase.
 */
export async function executeAdminAction(payload: AdminActionPayload): Promise<ExecuteAdminActionResult> {
  try {
    // 1. Fetch existing incident state
    const { data: currentIncident, error: fetchErr } = await supabase
      .from("incidents")
      .select("status")
      .eq("id", payload.incidentId)
      .single();

    if (fetchErr || !currentIncident) {
      throw new Error(fetchErr?.message || "Incident not found");
    }

    // 2. Update status
    const { error: updateErr } = await supabase
      .from("incidents")
      .update({ status: payload.newStatus, updated_at: new Date().toISOString() })
      .eq("id", payload.incidentId);

    if (updateErr) throw updateErr;

    // 3. Insert assignment if department provided
    if (payload.departmentId) {
      await supabase.from("incident_assignments").insert({
        incident_id: payload.incidentId,
        department_id: payload.departmentId,
        officer_id: payload.officerId || null,
        assigned_by: payload.adminId,
        status: payload.newStatus
      });
    }

    // 4. Log status history audit
    await supabase.from("incident_status_history").insert({
      incident_id: payload.incidentId,
      old_status: currentIncident.status,
      new_status: payload.newStatus,
      changed_by: payload.adminId,
      note: payload.note || `Status changed from ${currentIncident.status} to ${payload.newStatus}`
    });

    // 5. Create user notifications for citizens who reported this incident
    const { data: linkedReports } = await supabase
      .from("reports")
      .select("user_id, id")
      .eq("incident_id", payload.incidentId);

    if (linkedReports && linkedReports.length > 0) {
      const notifs = linkedReports.map((r) => ({
        user_id: r.user_id,
        report_id: r.id,
        incident_id: payload.incidentId,
        title: `Issue Status Updated`,
        message: `Your reported issue status has been updated to "${payload.newStatus.replace("_", " ")}".`
      }));
      await supabase.from("notifications").insert(notifs);
    }

    return { success: true };
  } catch (err: any) {
    console.warn("Supabase admin action error:", err?.message);
    return { success: false, error: err?.message };
  }
}

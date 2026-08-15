import { supabase } from "./supabaseClient";
import type { ReportStatus } from "../types/report";

export type SaveReportPayload = {
  userId: string;
  title?: string;
  description: string;
  problemType?: string;
  severity?: "low" | "medium" | "high" | "critical";
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

export type SubmitReportResult = {
  success: boolean;
  reportId?: string;
  incidentId?: string | null;
  message?: string;
  error?: string;
  isFallback?: boolean;
};

export type ExecuteAdminActionResult = {
  success: boolean;
  error?: string;
  isFallback?: boolean;
};

export async function fetchUserProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("id, email, full_name, role, phone, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
}

export async function createCitizenProfile(profile: {
  id: string;
  email?: string | null;
  full_name: string;
  phone?: string | null;
  role?: "client" | "admin";
}) {
  return supabase
    .from("profiles")
    .upsert(
      {
        id: profile.id,
        email: profile.email || null,
        full_name: profile.full_name,
        phone: profile.phone || null,
        role: profile.role || "client",
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("id, email, full_name, role, phone, created_at, updated_at")
    .single();
}

/**
 * Submits a new citizen report into Supabase.
 * Uploads media files to 'report-media' bucket and calls process_report_deduplication RPC.
 */
export async function submitReportToSupabase(payload: SaveReportPayload) {
  try {

    // 1. Ensure profile exists in public.profiles table to prevent foreign key violation
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", payload.userId)
      .maybeSingle();

    if (!existingProfile) {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user) {
        await supabase.from("profiles").upsert(
          {
            id: authUser.user.id,
            email: authUser.user.email || null,
            full_name: (authUser.user.user_metadata?.full_name as string) || authUser.user.email?.split("@")[0] || "User",
            phone: (authUser.user.user_metadata?.phone as string) || null,
            role: (authUser.user.user_metadata?.requested_role as string) === "admin" ? "admin" : "client"
          },
          { onConflict: "id" }
        );
      }
    }

    // 2. Insert into reports table
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: payload.userId,
        description: payload.description,
        problem_type: payload.problemType || "general",
        severity: payload.severity || "medium",
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
      console.error("Supabase report insert error:", reportError);
      throw new Error(reportError?.message || "Failed to create report record.");
    }

    // 3. Upload media files if provided
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

    // 4. Trigger smart deduplication function if present
    let incidentId: string | null = null;
    const { data: dedupeResult, error: dedupeErr } = await supabase.rpc(
      "process_report_deduplication",
      { p_report_id: report.id, p_radius_meters: 500.0 }
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
    console.warn("Supabase report submission error:", err?.message);
    return {
      success: false,
      error: err?.message || "Error communicating with Supabase."
    };
  }
}

/**
 * Process admin state update on an incident in Supabase.
 */
export async function executeAdminAction(payload: AdminActionPayload) {
  try {

    const { data: currentIncident, error: fetchErr } = await supabase
      .from("incidents")
      .select("status")
      .eq("id", payload.incidentId)
      .single();

    if (fetchErr || !currentIncident) {
      throw new Error(fetchErr?.message || "Incident not found");
    }

    const { error: updateErr } = await supabase
      .from("incidents")
      .update({
        status: payload.newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.incidentId);

    if (updateErr) throw updateErr;

    if (payload.departmentId) {
      await supabase.from("incident_assignments").insert({
        incident_id: payload.incidentId,
        department_id: payload.departmentId,
        officer_id: payload.officerId || null,
        assigned_by: payload.adminId,
        status: payload.newStatus
      });
    }

    await supabase.from("incident_status_history").insert({
      incident_id: payload.incidentId,
      old_status: currentIncident.status,
      new_status: payload.newStatus,
      changed_by: payload.adminId,
      note: payload.note || `Status changed from ${currentIncident.status} to ${payload.newStatus}`
    });

    const { data: linkedReports } = await supabase
      .from("reports")
      .select("user_id, id")
      .eq("incident_id", payload.incidentId);

    if (linkedReports && linkedReports.length > 0) {
      const notifs = linkedReports.map((r) => ({
        user_id: r.user_id,
        report_id: r.id,
        incident_id: payload.incidentId,
        title: "Issue Status Updated",
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
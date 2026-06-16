"use client";

import {useState, useMemo, useEffect} from "react";
import {useRouter} from "next/navigation";

export type AnnouncementDraft = {
  id?: string;
  textEn: string;
  textAr: string;
  linkUrl: string;
  isActive: boolean;
  scheduleType: "indefinite" | "scheduled";
  startAt: string;
  endAt: string;
};

type AnnouncementSerialized = {
  id: string;
  textEn: string;
  textAr: string;
  linkUrl: string | null;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  bgColor: string;
  textColor: string;
  createdAt: string;
};

type Props = {
  locale: string;
  initialAnnouncements: AnnouncementSerialized[];
};

type AnnouncementStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE";

function getAnnouncementStatus(ann: AnnouncementSerialized): AnnouncementStatus {
  if (!ann.isActive) return "INACTIVE";

  const now = new Date();
  const start = ann.startAt ? new Date(ann.startAt) : null;
  const end = ann.endAt ? new Date(ann.endAt) : null;

  if (start && start > now) return "SCHEDULED";
  if (end && end < now) return "EXPIRED";

  return "ACTIVE";
}

function formatStatus(status: AnnouncementStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "SCHEDULED":
      return "Scheduled";
    case "EXPIRED":
      return "Expired";
    case "INACTIVE":
      return "Inactive";
  }
}

function getStatusBadgeClass(status: AnnouncementStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border border-green-200";
    case "SCHEDULED":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "EXPIRED":
      return "bg-gray-100 text-gray-800 border border-gray-200";
    case "INACTIVE":
      return "bg-amber-100 text-amber-800 border border-amber-200";
  }
}

function toDatetimeLocalString(isoString: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";

  const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(d.getTime() - tzOffset).toISOString();
  return localISOTime.slice(0, 16); // return YYYY-MM-DDTHH:MM
}

function inputClass() {
  return "w-full border-0 border-b border-outline bg-transparent px-0 py-2 text-sm text-parchment outline-none placeholder:text-on-surface/45 focus:border-gold focus:ring-0";
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <label className="block">
      <span className="label-caps mb-2 block text-gold">{label}</span>
      {children}
    </label>
  );
}

export default function AdminAnnouncementsClient({
  locale,
  initialAnnouncements
}: Props) {
  const router = useRouter();
  const isArabic = locale === "ar";

  const [announcements, setAnnouncements] = useState<AnnouncementSerialized[]>(initialAnnouncements);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formValues, setFormValues] = useState<AnnouncementDraft>({
    textEn: "",
    textAr: "",
    linkUrl: "",
    isActive: false,
    scheduleType: "indefinite",
    startAt: "",
    endAt: ""
  });

  // Preview State
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "ar">("en");

  // Keep state in sync with server props
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  const activeAnnouncement = useMemo(() => {
    return announcements.find((ann) => getAnnouncementStatus(ann) === "ACTIVE");
  }, [announcements]);

  const livePreviewText = useMemo(() => {
    const text = previewLanguage === "ar" ? formValues.textAr : formValues.textEn;
    return text.trim() || (previewLanguage === "ar" ? "نص الإعلان التجريبي يظهر هنا" : "Draft announcement text preview appears here");
  }, [formValues, previewLanguage]);

  function resetForm() {
    setFormValues({
      textEn: "",
      textAr: "",
      linkUrl: "",
      isActive: false,
      scheduleType: "indefinite",
      startAt: "",
      endAt: ""
    });
    setEditingId(null);
    setStatus("");
  }

  function startEdit(ann: AnnouncementSerialized) {
    setEditingId(ann.id);
    setFormValues({
      textEn: ann.textEn,
      textAr: ann.textAr,
      linkUrl: ann.linkUrl || "",
      isActive: ann.isActive,
      scheduleType: (ann.startAt || ann.endAt) ? "scheduled" : "indefinite",
      startAt: toDatetimeLocalString(ann.startAt),
      endAt: toDatetimeLocalString(ann.endAt)
    });
    setStatus("");
    // Scroll to form view smoothly
    document.getElementById("announcement-form-section")?.scrollIntoView({behavior: "smooth"});
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    setSubmitting(true);

    const payload = {
      textEn: formValues.textEn,
      textAr: formValues.textAr,
      linkUrl: formValues.linkUrl,
      isActive: formValues.isActive,
      startAt: formValues.scheduleType === "scheduled" && formValues.startAt ? new Date(formValues.startAt).toISOString() : null,
      endAt: formValues.scheduleType === "scheduled" && formValues.endAt ? new Date(formValues.endAt).toISOString() : null
    };

    try {
      const url = editingId ? `/api/admin/announcements/${editingId}` : "/api/admin/announcements";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message ?? "Something went wrong");

      resetForm();
      router.refresh();
      setStatus(editingId ? "Announcement updated successfully!" : "Announcement created successfully!");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message ?? "Failed to delete");

      setDeletingId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function toggleStatus(ann: AnnouncementSerialized) {
    try {
      const res = await fetch(`/api/admin/announcements/${ann.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          textEn: ann.textEn,
          textAr: ann.textAr,
          linkUrl: ann.linkUrl,
          isActive: !ann.isActive,
          startAt: ann.startAt,
          endAt: ann.endAt
        })
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message ?? "Failed to toggle status");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    }
  }

  function formatDateString(isoString: string | null) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric"
    }).format(date);
  }

  return (
    <section className="mx-auto max-w-container px-gutter py-10 text-parchment sm:py-12 lg:px-16">
      
      {/* Header */}
      <header className="mb-10 border-b border-outline/60 pb-5">
        <p className="label-caps mb-3 text-gold">Admin Console</p>
        <h1 className="font-serif text-[clamp(2.25rem,5vw,3.75rem)] leading-tight">Announcements Management</h1>
        <p className="mt-2 text-sm text-on-surface/75">
          Create, schedule, and manage banners displayed at the top of the customer storefront.
        </p>
      </header>

      {/* Live Preview Section */}
      <section className="mb-10 border border-outline/55 bg-surface/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-parchment">Live Storefront Preview</h2>
            <p className="text-xs text-on-surface/70">Visualizing banner appearance exactly as users will see it</p>
          </div>
          <div className="flex border border-outline bg-surface-mid/40">
            <button
              type="button"
              onClick={() => setPreviewLanguage("en")}
              className={`label-caps px-3 py-1 text-[10px] transition-colors ${previewLanguage === "en" ? "bg-parchment text-surface-hi" : "text-parchment hover:bg-surface-mid/60"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setPreviewLanguage("ar")}
              className={`label-caps px-3 py-1 text-[10px] transition-colors ${previewLanguage === "ar" ? "bg-parchment text-surface-hi" : "text-parchment hover:bg-surface-mid/60"}`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Sales Bar Render Emulator */}
        <div className="border border-outline/40 p-1 bg-surface-mid/20">
          <div className="relative z-10 w-full border border-outline bg-surface px-12 py-3 text-center transition-all duration-300">
            {formValues.linkUrl ? (
              <a href={formValues.linkUrl} target="_blank" rel="noopener noreferrer" className="label-caps mx-auto block max-w-container text-[10px] leading-4 tracking-[0.12em] text-gold sm:text-[11px] sm:tracking-[0.15em] hover:underline">
                {livePreviewText}
              </a>
            ) : (
              <p className="label-caps mx-auto max-w-container text-[10px] leading-4 tracking-[0.12em] text-gold sm:text-[11px] sm:tracking-[0.15em]">
                {livePreviewText}
              </p>
            )}
            <div className="absolute end-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-gold sm:end-4">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Form Left, Active & History Right */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        
        {/* Creation/Edit Form Section */}
        <section id="announcement-form-section" className="border border-outline/55 bg-surface/70 p-6 self-start">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-parchment">
              {editingId ? "Edit Announcement" : "New Announcement"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="label-caps border border-outline px-3 py-1 text-[10px] text-on-surface hover:border-gold hover:text-gold"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <Field label="English Announcement Text">
              <textarea
                value={formValues.textEn}
                onChange={(e) => setFormValues({...formValues, textEn: e.target.value})}
                placeholder="E.g., FREE SHIPPING ON ALL COLD-SEASON FRAGRANCES"
                rows={3}
                required
                className={inputClass()}
              />
            </Field>

            <Field label="Arabic Announcement Text (Optional)">
              <textarea
                value={formValues.textAr}
                onChange={(e) => setFormValues({...formValues, textAr: e.target.value})}
                placeholder="E.g., شحن مجاني على جميع عطور الشتاء والبرودة"
                rows={3}
                className={inputClass()}
              />
            </Field>

            <Field label="Link URL (Optional)">
              <input
                type="url"
                value={formValues.linkUrl}
                onChange={(e) => setFormValues({...formValues, linkUrl: e.target.value})}
                placeholder="https://valentro.com/collections/private-collection"
                className={inputClass()}
              />
            </Field>

            {/* Run Period / Scheduling */}
            <div>
              <span className="label-caps mb-3 block text-gold">Availability Period</span>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={formValues.scheduleType === "indefinite"}
                    onChange={() => setFormValues({...formValues, scheduleType: "indefinite"})}
                    className="h-4 w-4 accent-gold"
                  />
                  Run indefinitely until turned off manually
                </label>
                <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={formValues.scheduleType === "scheduled"}
                    onChange={() => setFormValues({...formValues, scheduleType: "scheduled"})}
                    className="h-4 w-4 accent-gold"
                  />
                  Schedule a specific period
                </label>
              </div>
            </div>

            {formValues.scheduleType === "scheduled" && (
              <div className="grid gap-4 sm:grid-cols-2 border border-outline/30 bg-surface-mid/20 p-4">
                <Field label="Start Date & Time">
                  <input
                    type="datetime-local"
                    value={formValues.startAt}
                    onChange={(e) => setFormValues({...formValues, startAt: e.target.value})}
                    required={formValues.scheduleType === "scheduled"}
                    className={inputClass()}
                  />
                </Field>
                <Field label="End Date & Time">
                  <input
                    type="datetime-local"
                    value={formValues.endAt}
                    onChange={(e) => setFormValues({...formValues, endAt: e.target.value})}
                    required={formValues.scheduleType === "scheduled"}
                    className={inputClass()}
                  />
                </Field>
              </div>
            )}

            {/* Active Switch */}
            <div className="flex items-start gap-3 border-t border-outline/30 pt-4">
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={formValues.isActive}
                onChange={(e) => setFormValues({...formValues, isActive: e.target.checked})}
                className="h-5 w-5 accent-gold cursor-pointer"
              />
              <label htmlFor="isActiveCheckbox" className="text-sm leading-tight text-on-surface cursor-pointer">
                <span className="font-semibold block text-parchment">Set as storefront active banner</span>
                <span className="text-xs text-on-surface/65">
                  Checking this turns off any other currently running active announcement when saved.
                </span>
              </label>
            </div>

            {status && (
              <p className={`text-sm ${status.toLowerCase().includes("success") ? "text-green-800 font-semibold" : "text-gold"}`}>
                {status}
              </p>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="label-caps min-h-12 flex-1 border border-parchment bg-parchment px-6 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Announcement"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="label-caps min-h-12 border border-outline px-6 text-parchment transition-colors hover:border-gold hover:text-gold"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* Right Section: Active & History list */}
        <div className="space-y-8">
          
          {/* Active Banner Showcase */}
          <section className="border border-outline/65 bg-surface-hi/80 p-6 shadow-[0_0_24px_rgba(111,70,24,0.05)]">
            <p className="label-caps mb-2 text-gold">Current Active Banner</p>
            {activeAnnouncement ? (
              <div className="space-y-4">
                <div className="border border-outline bg-surface p-4 text-center text-xs text-gold font-semibold tracking-wider">
                  {isArabic ? activeAnnouncement.textAr : activeAnnouncement.textEn}
                </div>
                <div className="text-xs text-on-surface/70 space-y-1">
                  <p><span className="font-semibold">English:</span> {activeAnnouncement.textEn}</p>
                  <p><span className="font-semibold">Arabic:</span> {activeAnnouncement.textAr}</p>
                  {activeAnnouncement.linkUrl && (
                    <p>
                      <span className="font-semibold">Link URL:</span>{" "}
                      <a href={activeAnnouncement.linkUrl} target="_blank" rel="noopener noreferrer" className="underline text-gold hover:text-gold-muted">
                        {activeAnnouncement.linkUrl}
                      </a>
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Run Period:</span>{" "}
                    {activeAnnouncement.startAt || activeAnnouncement.endAt ? (
                      <>
                        {formatDateString(activeAnnouncement.startAt) || "Indefinite"}
                        {" - "}
                        {formatDateString(activeAnnouncement.endAt) || "Indefinite"}
                      </>
                    ) : (
                      "Indefinite (Manual Override)"
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStatus(activeAnnouncement)}
                  className="label-caps w-full border border-gold px-4 py-2.5 text-center text-gold transition-colors hover:bg-gold hover:text-surface-hi text-xs"
                >
                  Deactivate Banner
                </button>
              </div>
            ) : (
              <p className="text-sm text-on-surface/65 italic py-3 border border-dashed border-outline/50 text-center bg-surface/30">
                No active banner is currently running on the storefront.
              </p>
            )}
          </section>

          {/* Complete History Table */}
          <section className="border border-outline/55 bg-surface/70">
            <div className="p-5 border-b border-outline/40">
              <h2 className="font-serif text-2xl text-parchment">Announcement History</h2>
              <p className="text-xs text-on-surface/70">Log of all promotions and scheduling status</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-outline/50 bg-surface-mid/20">
                    <th className="label-caps p-4 text-[10px] text-on-surface/75">Content</th>
                    <th className="label-caps p-4 text-[10px] text-on-surface/75">Run Period</th>
                    <th className="label-caps p-4 text-[10px] text-on-surface/75 text-center">Status</th>
                    <th className="label-caps p-4 text-[10px] text-on-surface/75 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/25">
                  {announcements.length > 0 ? (
                    announcements.map((ann) => {
                      const status = getAnnouncementStatus(ann);
                      const isCurrentlyEditing = editingId === ann.id;

                      return (
                        <tr
                          key={ann.id}
                          className={`transition-colors hover:bg-surface-hi/40 ${isCurrentlyEditing ? "bg-surface-hi/60 font-semibold" : ""}`}
                        >
                          <td className="p-4 align-top max-w-[240px]">
                            <div className="line-clamp-2 text-parchment" title={ann.textEn}>
                              {ann.textEn}
                            </div>
                            <div className="line-clamp-2 text-xs text-on-surface/60 mt-1" title={ann.textAr}>
                              {ann.textAr}
                            </div>
                            {ann.linkUrl && (
                              <span className="text-[10px] text-gold block mt-1 truncate" title={ann.linkUrl}>
                                Link: {ann.linkUrl}
                              </span>
                            )}
                          </td>
                          <td className="p-4 align-top text-xs text-on-surface/80">
                            {ann.startAt || ann.endAt ? (
                              <div className="space-y-1">
                                <div><span className="text-on-surface/50">From:</span> {formatDateString(ann.startAt) || "Immediate"}</div>
                                <div><span className="text-on-surface/50">To:</span> {formatDateString(ann.endAt) || "Indefinite"}</div>
                              </div>
                            ) : (
                              <span className="italic text-on-surface/60">Indefinite / Manual</span>
                            )}
                          </td>
                          <td className="p-4 align-top text-center">
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClass(status)}`}>
                              {formatStatus(status)}
                            </span>
                          </td>
                          <td className="p-4 align-top text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleStatus(ann)}
                              className="text-xs text-gold hover:underline"
                            >
                              {ann.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(ann)}
                              className="text-xs text-parchment hover:underline"
                            >
                              Edit
                            </button>
                            {deletingId === ann.id ? (
                              <span className="inline-flex gap-1.5 items-center">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(ann.id)}
                                  className="text-xs text-red-700 font-bold hover:underline"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  className="text-xs text-on-surface hover:underline"
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingId(ann.id)}
                                className="text-xs text-on-surface/60 hover:text-red-700 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-on-surface/50 italic">
                        No announcements created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </section>
  );
}

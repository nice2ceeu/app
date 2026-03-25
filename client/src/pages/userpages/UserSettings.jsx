import { useState, useEffect } from "react";
import LocationPicker from "../../components/MapComponents/UserLocationPicker";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

const Field = ({ label, name, value, onChange, type = "text", disabled = false }) => (
  <div className="flex flex-col gap-1">
    <label className="font-mono text-[10px] tracking-widest uppercase text-gray-400">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-gray-400 text-gray-800 placeholder-gray-300 transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-400"
    />
  </div>
);

const Section = ({ title, description, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-gray-100 last:border-none">
    <div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
    </div>
    <div className="md:col-span-2 flex flex-col gap-4">{children}</div>
  </div>
);

export default function UserSettings() {
  // Single source of truth — from context, not props
  const { profile, loading: profileLoading } = useProfile();

  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    address: "",
    jobTitle: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [location, setLocation] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
      if (!profileLoading && !profile) navigate("/login");
  }, [profile, profileLoading]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName || "",
      lastName:  profile.lastName  || "",
      username:  profile.username  || "",
      address:   profile.address   || "",
      jobTitle:  profile.jobTitle  || "",
    });
    if (profile.location) setLocation(profile.location);
  }, [profile]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePasswordChange = (e) =>
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update profile.");
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (passwords.next.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API_URL}/users/${profile.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.next,
        }),
      });
      if (!res.ok) throw new Error("Incorrect current password.");
      setPasswords({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="font-mono text-xs text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <Navbar userRole={profile?.userRole} verified={profile?.verified} />
      {/* Location Picker Modal */}
      {showPicker && (
        <LocationPicker
          userId={profile?.id}
          onSave={(saved) => {
            setLocation(saved);
            setShowPicker(false);
            showToast("Location saved.");
          }}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-mono tracking-wide transition-all ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-gray-900 text-white"
          }`}
        >
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Page Header */}
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Account
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your profile, password, and location.
          </p>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2 mb-8 pb-8 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-mono text-sm text-gray-500 font-medium">
            {form.firstName?.[0]}{form.lastName?.[0]}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              {form.firstName} {form.lastName}
            </p>

            <div className="flex gap-2 mt-1">
              <span className="font-mono text-[10px] tracking-widest uppercase bg-gray-100 text-gray-400 px-2 py-0.5 rounded">
                {profile?.userRole}
              </span>

              <span className={`font-mono text-[10px] tracking-widest uppercase bg-gray-100 ${ profile?.verified ? 'text-green-500' : 'text-red-500'} px-2 py-0.5 rounded`}>
                {profile?.verified ? "Verified" : "Not Verified"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <Section
          title="Profile"
          description="Update your personal information. Your username must be unique."
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
            <Field label="Last Name"  name="lastName"  value={form.lastName}  onChange={handleChange} />
          </div>
          <Field label="Username"  name="username"  value={form.username}  onChange={handleChange} disabled/>
          <Field label="Address"   name="address"   value={form.address}   onChange={handleChange} />
          <Field label="Job Title" name="jobTitle"  value={form.jobTitle}  onChange={handleChange} />

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer"
            >
              {saving ? "Saving…" : "Save Changes →"}
            </button>
          </div>
        </Section>

        {/* Password Section */}
        <Section
          title="Password"
          description="Choose a strong password at least 8 characters long."
        >
          <Field label="Current Password"      name="current" type="password" value={passwords.current} onChange={handlePasswordChange} />
          <Field label="New Password"          name="next"    type="password" value={passwords.next}    onChange={handlePasswordChange} />
          <Field label="Confirm New Password"  name="confirm" type="password" value={passwords.confirm} onChange={handlePasswordChange} />

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer"
            >
              {savingPassword ? "Updating…" : "Update Password →"}
            </button>
          </div>
        </Section>

        {/* Location Section */}
        <Section
          title="Location"
          description="Set your current location. Used for nearby job matching."
        >
          <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
            {location ? (
              <div>
                <p className="text-sm text-gray-700 font-medium">Location set</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">
                  {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">No location set</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">Drop a pin to set your location</p>
              </div>
            )}
            <button
              onClick={() => setShowPicker(true)}
              className="font-mono text-xs tracking-wider text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-900 bg-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {location ? "Update →" : "Set Location →"}
            </button>
          </div>
        </Section>

      </div>
    </>
  );
}
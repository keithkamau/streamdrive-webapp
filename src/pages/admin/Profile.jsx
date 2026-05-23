import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  Button,
  Input,
  PasswordInput,
  Alert,
  Badge,
} from "../../components/ui";
import { updateResident } from "../../services/residentService";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState("details");

  // ── Details form ──────────────────────────────────────────────────────────
  const [details, setDetails] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState("");
  const [detailsError, setDetailsError] = useState("");

  const setDetail = (field) => (e) =>
    setDetails((d) => ({ ...d, [field]: e.target.value }));

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!details.name.trim()) {
      setDetailsError("Name is required.");
      return;
    }
    setDetailsLoading(true);
    setDetailsError("");
    try {
      await updateResident(user.id, {
        name: details.name.trim(),
        phone: details.phone.trim(),
      });
      await refreshUser();
      setDetailsSaved("Profile updated successfully.");
      setTimeout(() => setDetailsSaved(""), 3000);
    } catch {
      setDetailsError("Failed to update profile. Please try again.");
    }
    setDetailsLoading(false);
  };

  // ── Password form ─────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const setPass = (field) => (e) =>
    setPasswords((p) => ({ ...p, [field]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwords.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current,
      });

      if (signInError) {
        setPasswordError("Current password is incorrect.");
        setPasswordLoading(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.next,
      });

      if (updateError) {
        setPasswordError(updateError.message);
      } else {
        setPasswordSaved("Password changed successfully.");
        setPasswords({ current: "", next: "", confirm: "" });
        setTimeout(() => setPasswordSaved(""), 3000);
      }
    } catch {
      setPasswordError("Failed to change password. Please try again.");
    }
    setPasswordLoading(false);
  };

  const TABS = ["details", "password"];

  return (
    <div className='max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <div className='w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0'>
          <span className='font-display font-bold text-green-700 text-xl'>
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </span>
        </div>
        <div>
          <h2 className='font-display font-bold text-zinc-900 text-xl'>
            {user?.name}
          </h2>
          <div className='flex items-center gap-2 mt-1'>
            <span className='text-sm text-zinc-400 font-mono'>
              {user?.houseNumber}
            </span>
            {user?.isAdmin && <Badge variant='admin'>Admin</Badge>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-xl w-fit'>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all duration-150 ${
              activeTab === tab
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {tab === "details" ? "Profile Details" : "Change Password"}
          </button>
        ))}
      </div>

      {/* ── Details tab ──────────────────────────────────────────────────────── */}
      {activeTab === "details" && (
        <Card className='p-6 flex flex-col gap-6'>
          <div>
            <h3 className='font-display font-bold text-zinc-900 text-base mb-1'>
              Profile Details
            </h3>
            <p className='text-xs text-zinc-400'>
              Update your name and phone number. Email cannot be changed here.
            </p>
          </div>

          {detailsSaved && <Alert variant='success'>{detailsSaved}</Alert>}
          {detailsError && <Alert variant='danger'>{detailsError}</Alert>}

          <form onSubmit={handleSaveDetails} className='flex flex-col gap-4'>
            <Input
              label='Full Name'
              value={details.name}
              onChange={setDetail("name")}
              placeholder='Your full name'
            />
            <Input
              label='Phone Number'
              type='tel'
              value={details.phone}
              onChange={setDetail("phone")}
              placeholder='+254 7XX XXX XXX'
            />

            {/* Read-only fields */}
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                Email Address
              </label>
              <div className='flex items-center gap-2 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg'>
                <span className='text-sm text-zinc-500 flex-1'>
                  {user?.email}
                </span>
                <span className='text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md'>
                  Read only
                </span>
              </div>
            </div>

            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                House Number
              </label>
              <div className='flex items-center gap-2 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg'>
                <span className='text-sm text-zinc-500 font-mono flex-1'>
                  {user?.houseNumber}
                </span>
                <span className='text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md'>
                  Read only
                </span>
              </div>
            </div>

            <div className='pt-2 border-t border-zinc-100 flex justify-end'>
              <Button type='submit' size='md' loading={detailsLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Password tab ─────────────────────────────────────────────────────── */}
      {activeTab === "password" && (
        <Card className='p-6 flex flex-col gap-6'>
          <div>
            <h3 className='font-display font-bold text-zinc-900 text-base mb-1'>
              Change Password
            </h3>
            <p className='text-xs text-zinc-400'>
              Enter your current password then choose a new one.
            </p>
          </div>

          {passwordSaved && <Alert variant='success'>{passwordSaved}</Alert>}
          {passwordError && <Alert variant='danger'>{passwordError}</Alert>}

          <form onSubmit={handleChangePassword} className='flex flex-col gap-4'>
            <PasswordInput
              label='Current Password'
              placeholder='Your current password'
              value={passwords.current}
              onChange={setPass("current")}
              autoComplete='current-password'
            />
            <PasswordInput
              label='New Password'
              placeholder='Min. 8 characters'
              value={passwords.next}
              onChange={setPass("next")}
              showStrength
              autoComplete='new-password'
            />
            <PasswordInput
              label='Confirm New Password'
              placeholder='Re-enter new password'
              value={passwords.confirm}
              onChange={setPass("confirm")}
              autoComplete='new-password'
            />

            <div className='pt-2 border-t border-zinc-100 flex justify-end'>
              <Button type='submit' size='md' loading={passwordLoading}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

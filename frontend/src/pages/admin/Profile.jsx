import { useEffect, useState } from "react";
import {
  UserCircle,
  Mail,
  ShieldCheck,
  CalendarDays,
  Save,
  LockKeyhole,
  Sun,
  Moon,
} from "lucide-react";
import API_URL from "../../config";
import { useTheme } from "../../context/ThemeContext";
import "./Profile.css";

export default function Profile() {
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);
const [twoFactorPassword, setTwoFactorPassword] = useState("");
const [twoFactorError, setTwoFactorError] = useState("");
const [twoFactorMessage, setTwoFactorMessage] = useState("");
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setProfileError("");

      const response = await fetch(`${API_URL}/profile`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.message || "Unable to load profile.");
        return;
      }

      setProfile(data.user);
      setName(data.user.name || "");
      setEmail(data.user.email || "");
    } catch (error) {
      console.error("Fetch profile error:", error);
      setProfileError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (value) => {
    if (!value) return "A";

    const words = value.trim().split(/\s+/);

    if (words.length >= 2) {
      return (
        words[0].charAt(0) + words[1].charAt(0)
      ).toUpperCase();
    }

    return value.charAt(0).toUpperCase();
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    const cleanedName = name.trim();
    const cleanedEmail = email.trim();

    if (!cleanedName || !cleanedEmail) {
      setProfileError("Name and email are required.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(
        `${API_URL}/profile`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cleanedName,
            email: cleanedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setProfileError(
          data.message || "Unable to update profile."
        );
        return;
      }

      setProfile(data.user);
      setName(data.user.name);
      setEmail(data.user.email);

      setProfileMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error("Update profile error:", error);
      setProfileError(
        "Unable to connect to the server."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${API_URL}/profile/password`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(
          data.message || "Unable to change password."
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Password changed successfully."
      );
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordError(
        "Unable to connect to the server."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-error-card">
          {profileError || "Unable to load profile."}
        </div>
      </div>
    );
  }
  const handleTwoFactorToggle = async (enabled) => {
  setTwoFactorError("");
  setTwoFactorMessage("");

  // When disabling, require the current password
  if (!enabled && !twoFactorPassword) {
    setTwoFactorError(
      "Enter your current password to disable two-factor authentication."
    );
    return;
  }

  setTwoFactorSaving(true);

  try {
    const response = await fetch(`${API_URL}/profile/2fa`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        enabled,
        password: enabled ? undefined : twoFactorPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setTwoFactorError(
        data.message || "Unable to update two-factor authentication."
      );
      return;
    }

    setProfile((prev) => ({
      ...prev,
      twoFactorEnabled: data.twoFactorEnabled,
    }));

    setTwoFactorPassword("");

    setTwoFactorMessage(
      enabled
        ? "Two-factor authentication enabled successfully."
        : "Two-factor authentication disabled successfully."
    );
  } catch (error) {
    console.error("2FA toggle error:", error);
    setTwoFactorError("Unable to connect to the server.");
  } finally {
    setTwoFactorSaving(false);
  }
};
  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <p className="profile-eyebrow">ACCOUNT</p>

          <h1>Admin Profile</h1>

          <p className="profile-header-description">
            Manage your administrator account information
            and password.
          </p>
        </div>
      </header>

      {/* Profile Overview */}
      <section className="profile-card profile-overview-card">
        <div className="profile-avatar-large">
          {getInitials(profile.name)}
        </div>

        <div className="profile-overview-content">
          <h2>{profile.name}</h2>

          <p>{profile.email}</p>

          <span className="profile-role-badge">
            <ShieldCheck size={13} />
            Administrator
          </span>
        </div>
      </section>

      {/* Account Information */}
      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <h2>Account Information</h2>

            <p>
              Your administrator account details.
            </p>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <div className="profile-info-icon">
              <UserCircle size={17} />
            </div>

            <div>
              <span>Name</span>
              <strong>{profile.name}</strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <Mail size={17} />
            </div>

            <div>
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <span>Role</span>
              <strong>Administrator</strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <CalendarDays size={17} />
            </div>

            <div>
              <span>Member Since</span>
              <strong>
                {formatDate(profile.createdAt)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <h2>Appearance</h2>

            <p>
              Choose how you want SubFlow to look.
            </p>
          </div>
        </div>

        <div className="profile-theme-options">
          <button
            type="button"
            className={`profile-theme-option ${
              theme === "light" ? "active" : ""
            }`}
            onClick={() => setTheme("light")}
            aria-pressed={theme === "light"}
          >
            <Sun size={15} />

            <span>Light</span>
          </button>

          <button
            type="button"
            className={`profile-theme-option ${
              theme === "dark" ? "active" : ""
            }`}
            onClick={() => setTheme("dark")}
            aria-pressed={theme === "dark"}
          >
            <Moon size={15} />

            <span>Dark</span>
          </button>
        </div>
      </section>
            {/* Two-Factor Authentication */}
<section className="profile-card profile-2fa-card">
  <div className="profile-card-header profile-2fa-header">
    <div>
      <h2>Two-Factor Authentication</h2>

      <p>
        Add an extra layer of security to your administrator account.
      </p>
    </div>

    <button
      type="button"
      className={`profile-2fa-toggle ${
        profile?.twoFactorEnabled ? "is-enabled" : ""
      }`}
      onClick={() =>
        !twoFactorSaving &&
        handleTwoFactorToggle(!profile?.twoFactorEnabled)
      }
      disabled={twoFactorSaving}
      aria-label={
        profile?.twoFactorEnabled
          ? "Disable two-factor authentication"
          : "Enable two-factor authentication"
      }
      aria-pressed={profile?.twoFactorEnabled || false}
    >
      <span className="profile-2fa-toggle-thumb" />
    </button>
  </div>

  <div className="profile-2fa-status">
    <div className="profile-2fa-status-icon">
      <ShieldCheck size={17} />
    </div>

    <div>
      <strong>
        {profile?.twoFactorEnabled
          ? "Two-factor authentication is enabled"
          : "Two-factor authentication is disabled"}
      </strong>

      <p>
        {profile?.twoFactorEnabled
          ? "A verification code will be required when you sign in."
          : "Enable 2FA to protect your administrator account with email verification."}
      </p>
    </div>
  </div>

  {profile?.twoFactorEnabled && (
    <div className="profile-2fa-disable">
      <div className="profile-field">
        <label htmlFor="twoFactorPassword">
          Current Password
        </label>

        <input
          id="twoFactorPassword"
          type="password"
          value={twoFactorPassword}
          onChange={(event) => {
            setTwoFactorPassword(event.target.value);
            setTwoFactorError("");
          }}
          placeholder="Enter your current password"
          disabled={twoFactorSaving}
        />
      </div>

      <button
        type="button"
        className="profile-2fa-disable-button"
        onClick={() => handleTwoFactorToggle(false)}
        disabled={twoFactorSaving}
      >
        {twoFactorSaving ? "Disabling..." : "Disable 2FA"}
      </button>
    </div>
  )}

  {twoFactorError && (
    <div className="profile-form-error">
      {twoFactorError}
    </div>
  )}

  {twoFactorMessage && (
    <div className="profile-form-success">
      {twoFactorMessage}
    </div>
  )}
</section>
      {/* Edit Profile */}
      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <h2>Edit Profile</h2>

            <p>
              Update your administrator name and email
              address.
            </p>
          </div>
        </div>

        <form
          className="profile-form"
          onSubmit={handleProfileSubmit}
        >
          <div className="profile-form-grid">
            <div className="profile-field">
              <label htmlFor="profile-name">
                Full Name
              </label>

              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
                maxLength={100}
                disabled={savingProfile}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-email">
                Email Address
              </label>

              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                maxLength={150}
                disabled={savingProfile}
              />
            </div>
          </div>

          {profileError && (
            <div className="profile-form-error">
              {profileError}
            </div>
          )}

          {profileMessage && (
            <div className="profile-form-success">
              {profileMessage}
            </div>
          )}

          <div className="profile-form-footer">
            <button
              type="submit"
              className="profile-save-button"
              disabled={savingProfile}
            >
              <Save size={15} />

              <span>
                {savingProfile
                  ? "Saving..."
                  : "Save Changes"}
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* Change Password */}
      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <h2>Change Password</h2>

            <p>
              Keep your administrator account secure with
              a strong password.
            </p>
          </div>

          <div className="profile-security-icon">
            <LockKeyhole size={18} />
          </div>
        </div>

        <form
          className="profile-form"
          onSubmit={handlePasswordSubmit}
        >
          <div className="profile-form-grid">
            <div className="profile-field profile-field-full">
              <label htmlFor="current-password">
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={changingPassword}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="new-password">
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                disabled={changingPassword}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={changingPassword}
              />
            </div>
          </div>

          {passwordError && (
            <div className="profile-form-error">
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div className="profile-form-success">
              {passwordMessage}
            </div>
          )}

          <div className="profile-form-footer">
            <button
              type="submit"
              className="profile-save-button"
              disabled={changingPassword}
            >
              <LockKeyhole size={15} />

              <span>
                {changingPassword
                  ? "Changing..."
                  : "Change Password"}
              </span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
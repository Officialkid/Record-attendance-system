'use client';

import { useState, useEffect, useRef } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { useAuth } from '@/lib/AuthContext';
import { updateOrganization } from '@/lib/firestore-multitenant';
import { Building2, User, Bell, HelpCircle, Camera, Lock, Users, Shield, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function SettingsPage() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('organization');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Organization form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    country: '',
    phone: '',
  });

  // Account form state
  const [accountData, setAccountData] = useState({
    displayName: '',
    email: '',
    photoURL: '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Team members (placeholder data)
  const [teamMembers] = useState([
    { id: '1', email: user?.email || '', role: 'Owner', status: 'Active' },
  ]);

  useEffect(() => {
    if (currentOrg) {
      setFormData({
        name: currentOrg.name,
        type: currentOrg.type,
        country: currentOrg.country,
        phone: currentOrg.phone,
      });
    }
  }, [currentOrg]);

  useEffect(() => {
    if (user) {
      setAccountData({
        displayName: user.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
      });
    }
  }, [user]);

  const sections = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleSave = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      await updateOrganization(currentOrg.id, {
        name: formData.name,
        type: formData.type,
        country: formData.country,
        phone: formData.phone,
      });

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual file upload to Firebase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccountData({ ...accountData, photoURL: reader.result as string });
        toast.success('Profile picture updated! (Note: Changes will be saved when implemented)');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateAccount = () => {
    // TODO: Implement actual account update with Firebase
    toast.success('Account details updated! (Coming soon)');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    // TODO: Implement password change with Firebase
    toast.success('Password change will be implemented soon');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleInviteMember = () => {
    toast.success('Team member invitation coming soon!');
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Settings</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-600">
          Manage your organization and account preferences
        </p>
      </div>

      {/* SETTINGS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                      ${isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="lg:col-span-3">
          
          {/* ORGANIZATION SETTINGS */}
          {activeSection === 'organization' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Organization Details
              </h2>

              <div className="space-y-6">
                
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Christhood Ministry"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name appears throughout the app
                  </p>
                </div>

                {/* Organization Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Church">Church</option>
                    <option value="Ministry">Ministry</option>
                    <option value="Community Group">Community Group</option>
                    <option value="Non-Profit">Non-Profit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="South Africa">South Africa</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+254 712 345 678"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for payment notifications
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setFormData({
                      name: currentOrg?.name || '',
                      type: currentOrg?.type || '',
                      country: currentOrg?.country || '',
                      phone: currentOrg?.phone || '',
                    })}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ACCOUNT SETTINGS */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              
              {/* PROFILE SECTION */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Profile Information
                </h2>

                <div className="space-y-6">
                  
                  {/* Profile Picture */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                          {accountData.photoURL ? (
                            <Image
                              src={accountData.photoURL}
                              alt="Profile"
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{accountData.displayName?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <button
                          onClick={handleProfilePictureClick}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Camera className="w-4 h-4 text-gray-600" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </div>
                      <div>
                        <button
                          onClick={handleProfilePictureClick}
                          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                        >
                          Change Photo
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG or GIF. Max size 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={accountData.displayName}
                      onChange={(e) => setAccountData({ ...accountData, displayName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This name will appear in reports and exports
                    </p>
                  </div>

                  {/* Primary Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Primary Email Address
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="email"
                        value={accountData.email}
                        disabled
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleUpdateAccount}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all"
                    >
                      Update Profile
                    </button>
                  </div>

                </div>
              </div>

              {/* PASSWORD SECTION */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="w-5 h-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Change Password
                  </h2>
                </div>

                <div className="space-y-4">
                  
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• At least 6 characters long</li>
                      <li>• Mix of letters and numbers recommended</li>
                      <li>• Avoid common passwords</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Change Password
                  </button>

                </div>
              </div>

              {/* TEAM MEMBERS SECTION */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-700" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Team Members
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage who has access to your organization
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleInviteMember}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                  </button>
                </div>

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{member.email}</div>
                          <div className="text-sm text-gray-600">{member.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {member.status}
                        </span>
                        {member.role !== 'Owner' && (
                          <button
                            onClick={() => toast.error('Remove member functionality coming soon')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coming Soon Notice */}
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900 text-sm mb-1">
                        Multi-User Access Coming Soon
                      </h4>
                      <p className="text-xs text-purple-800">
                        Invite team members, set roles & permissions, and collaborate on attendance tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* NOTIFICATIONS (Placeholder) */}
          {activeSection === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Notification Settings Coming Soon
              </h3>
              <p className="text-gray-600">
                Manage email notifications, reminders, and alerts.
              </p>
            </div>
          )}

          {/* HELP & SUPPORT (Placeholder) */}
          {activeSection === 'help' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Help & Support
              </h2>

              <div className="space-y-4">
                
                <a
                  href="mailto:support@yourapp.com"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Email Support
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get help via email: support@yourapp.com
                  </p>
                </a>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Documentation
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Learn how to use all features
                  </p>
                  <button
                    disabled
                    className="text-sm text-gray-400 cursor-not-allowed"
                  >
                    View Docs (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

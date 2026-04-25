import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const userRaw = localStorage.getItem('user');
  const parsedUser = userRaw ? JSON.parse(userRaw) : null;
  const [user, setUser] = useState(parsedUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: parsedUser?.fullName || '',
    email: parsedUser?.email || '',
    phoneNumber: parsedUser?.phoneNumber || parsedUser?.phone || ''
  });
  const isLoggedIn = Boolean(token || isAdmin) && Boolean(user);

  if (!isLoggedIn) {
    return (
      <div className="profile-page">
        <div className="profile-wrapper">
          <h1 className="profile-title">Please log in first</h1>
          <p className="profile-subtitle">
            You need to be logged in to access your profile.
          </p>
          <Link to="/" className="profile-action">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user.fullName || 'User';
  const displayEmail = user.email || 'N/A';
  const displayRole = user.role || (isAdmin ? 'admin' : 'user');
  const displayPhone = user.phoneNumber || user.phone || 'Not set';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    const updatedUser = {
      ...user,
      fullName: formData.fullName.trim() || user.fullName,
      email: formData.email.trim() || user.email,
      phoneNumber: formData.phoneNumber.trim() || user.phoneNumber || user.phone
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
    alert('Profile updated successfully.');
  };

  const handleDeleteUser = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this user from this device? This action cannot be undone.'
    );

    if (!confirmed) return;

    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('user');
    alert('User deleted successfully.');
    navigate('/');
  };

  const escapePdfText = (value) =>
    String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r?\n/g, ' ');

  const createPdfBlob = (streamContent) => {
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];

    objects.forEach((obj, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
    });

    const xrefPosition = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
  };

  const handleDownloadReport = () => {
    const reportName = user.fullName || 'User';
    const reportEmail = user.email || 'N/A';
    const reportPassword = user.password || 'Not available';
    const generatedAt = new Date().toLocaleString();

    const stream = [
      'BT',
      '/F1 18 Tf',
      '50 790 Td',
      `(User Profile Report) Tj`,
      '0 -30 Td',
      '/F1 12 Tf',
      `(Name: ${escapePdfText(reportName)}) Tj`,
      '0 -22 Td',
      `(Email: ${escapePdfText(reportEmail)}) Tj`,
      '0 -22 Td',
      `(Password: ${escapePdfText(reportPassword)}) Tj`,
      '0 -22 Td',
      `(Generated At: ${escapePdfText(generatedAt)}) Tj`,
      'ET'
    ].join('\n');

    const pdfBlob = createPdfBlob(stream);
    const fileUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${reportName.replace(/\s+/g, '_').toLowerCase() || 'user'}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(fileUrl);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <h1 className="profile-title">User Profile</h1>
        <p className="profile-subtitle">Manage your account information</p>

        <div className="profile-card">
          <div className="profile-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <div className="profile-row">
              <span className="label">Name</span>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  className="profile-input"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              ) : (
                <span className="value">{displayName}</span>
              )}
            </div>
            <div className="profile-row">
              <span className="label">Email</span>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  className="profile-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              ) : (
                <span className="value">{displayEmail}</span>
              )}
            </div>
            <div className="profile-row">
              <span className="label">Phone</span>
              {isEditing ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  className="profile-input"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              ) : (
                <span className="value">{displayPhone}</span>
              )}
            </div>
            <div className="profile-row">
              <span className="label">Role</span>
              <span className="value role">{displayRole}</span>
            </div>
          </div>
        </div>

        <div className="profile-buttons">
          {isEditing ? (
            <>
              <button type="button" onClick={handleUpdate} className="profile-action">
                Save Update
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="profile-action secondary">
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="profile-action">
              Update Profile
            </button>
          )}
          <button type="button" onClick={handleDeleteUser} className="profile-action danger">
            Delete User
          </button>
          <button type="button" onClick={handleDownloadReport} className="profile-action">
            Download Report
          </button>
          <Link to="/" className="profile-action secondary">
            Back to Home
          </Link>
          <button type="button" onClick={handleLogout} className="profile-action">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

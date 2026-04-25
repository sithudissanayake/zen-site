import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updateUserProfile, deleteUser } from '../services/api';
import './UserProfilePage.css';
import { jsPDF } from 'jspdf';
import Chart from 'chart.js/auto';

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
    phoneNumber: parsedUser?.phoneNumber || parsedUser?.phone || '',
    rating: parsedUser?.rating || 0
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

  const handleUpdate = async () => {
    try {
      const updates = {
        fullName: formData.fullName.trim() || user.fullName,
        email: formData.email.trim() || user.email,
        phoneNumber: formData.phoneNumber.trim() || user.phoneNumber || user.phone,
        rating: formData.rating || null
      };

      const response = await updateUserProfile(updates);

      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        setIsEditing(false);
        alert('Profile updated successfully.');
      } else {
        alert('Failed to update profile: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await deleteUser();

      if (response.data.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
        alert('Account deleted successfully.');
        navigate('/');
      } else {
        alert('Failed to delete account: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting account. Please try again.');
    }
  };



  const handleDownloadReport = async () => {
    const reportName = user.fullName || 'User';
    const reportEmail = user.email || 'N/A';
    const reportPassword = 'Not available';
    const reportPhone = user.phoneNumber || user.phone || 'Not set';
    const reportRole = user.role || (isAdmin ? 'admin' : 'user');
    const generatedAt = new Date().toLocaleString();

    // Generate fake data
    const dates = [];
    const activeTimes = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toLocaleDateString());
      activeTimes.push(parseFloat((Math.random() * 8 + 1).toFixed(2))); // random hours between 1 and 9
    }

    // Create canvas for chart
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [{
          label: 'Active Time (hours)',
          data: activeTimes,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'User Visits Active Time',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Active Time (hours)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });

    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Load logo
    const logoImg = new Image();
    logoImg.src = '/zen.jpg';
    await new Promise(resolve => {
      logoImg.onload = resolve;
    });

    // Create logo canvas
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = logoImg.width;
    logoCanvas.height = logoImg.height;
    const logoCtx = logoCanvas.getContext('2d');
    logoCtx.drawImage(logoImg, 0, 0);
    const logoData = logoCanvas.toDataURL('image/jpeg');

    // Create PDF
    const pdf = new jsPDF();
    pdf.addImage(logoData, 'JPEG', 85, 10, 40, 40); // Center logo
    pdf.setFontSize(18);
    pdf.text(`User Profile Report`, 105, 60, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Generated At: ${generatedAt}`, 105, 70, { align: 'center' });
    pdf.text(`Name: ${reportName}`, 20, 85);
    pdf.text(`Email: ${reportEmail}`, 20, 95);
    pdf.text(`Password: ${reportPassword}`, 20, 105);
    pdf.text(`Mobile Number: ${reportPhone}`, 20, 115);
    pdf.text(`Role: ${reportRole}`, 20, 125);

    // Add chart image
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 20, 135, 170, 80);

    // Download PDF
    pdf.save(`${reportName.replace(/\s+/g, '_').toLowerCase() || 'user'}_report.pdf`);
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
            <div className="profile-row">
              <span className="label">Overall Satisfaction Rating</span>
              {isEditing ? (
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= formData.rating ? 'filled' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                    >
                      ★
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rating-display">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= (user.rating || 0) ? 'filled' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="rating-text">
                    {user.rating ? `${user.rating}/5` : 'Not rated yet'}
                  </span>
                </div>
              )}
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
            Delete Account
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

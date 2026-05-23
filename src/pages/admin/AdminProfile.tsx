import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaUser, FaLock, FaSignOutAlt, FaSave, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';

interface AdminProfile {
  ownerName: string
  username: string
  password: string
  restaurantName: string
}

const AdminProfile: React.FC = () => {
  const navigate = useNavigate()
  
  // Get stored admin profile or use defaults
  const storedProfile = localStorage.getItem('adminProfile')
  const initialProfile: AdminProfile = storedProfile 
    ? JSON.parse(storedProfile)
    : {
        ownerName: '',
        username: 'admin',
        password: 'admin123',
        restaurantName: 'RestoM'
      }

  const [profile, setProfile] = useState<AdminProfile>(initialProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    if (!profile.username.trim()) {
      setMessage('Username is required!')
      return
    }
    // Save to localStorage (in real app, this would be API call)
    localStorage.setItem('adminProfile', JSON.stringify(profile))
    setMessage('✅ Profile updated successfully!')
    setIsEditing(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated')
    navigate('/admin')
  }

  return (
    <AdminLayout title="Admin Profile">
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        padding: '30px 20px'
      }}>
        {message && (
          <div style={{
            background: message.includes('success') ? '#d4edda' : '#f8d7da',
            color: message.includes('success') ? '#155724' : '#721c24',
            padding: '15px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Back Button */}
          <Link
            to="/admin/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#4F46E5',
              textDecoration: 'none',
              fontWeight: '600',
              marginBottom: '15px',
              padding: '8px 15px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff3e0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FaArrowLeft /> Back to Dashboard
          </Link>

          {/* Profile Header Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{
                width: '90px',
                height: '90px',
                background: 'linear-gradient(135deg, #FF6A00, #FF9900)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px'
              }}>
                <FaUser style={{ fontSize: '40px', color: 'white' }} />
              </div>
              <h2 style={{ color: '#212529', margin: 0, fontWeight: 'bold' }}>Admin Profile</h2>
              <p style={{ color: '#6c757d', margin: '5px 0 0' }}>Manage your account settings</p>
            </div>

            {/* Restaurant Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Restaurant Name
              </label>
              <input
                type="text"
                name="restaurantName"
                value={profile.restaurantName}
                onChange={handleInputChange}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: isEditing ? '2px solid #FF6A00' : '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: isEditing ? 'white' : '#f9fafb'
                }}
              />
            </div>

            {/* Owner Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Owner Name
              </label>
              <input
                type="text"
                name="ownerName"
                value={profile.ownerName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter owner name"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: isEditing ? '2px solid #FF6A00' : '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: isEditing ? 'white' : '#f9fafb'
                }}
              />
            </div>

            {/* Username */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                <FaUser style={{ marginRight: '8px' }} /> Username
              </label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter username"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: isEditing ? '2px solid #FF6A00' : '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: isEditing ? 'white' : '#f9fafb'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                <FaLock style={{ marginRight: '8px' }} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={profile.password}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "Enter new password" : "Click edit to change"}
                  style={{
                    width: '100%',
                    padding: '12px 45px 12px 15px',
                    border: isEditing ? '2px solid #FF6A00' : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: isEditing ? 'white' : '#f9fafb'
                  }}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                )}
              </div>
              {!isEditing && (
                <small style={{ color: '#6c757d' }}>Click edit to change password</small>
              )}
            </div>

            {/* Buttons */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(90deg, #4F46E5, #6366F1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(79,70,229,0.3)'
                }}
              >
                <FaUser style={{ marginRight: '8px' }} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <FaSave style={{ marginRight: '8px' }} /> Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setProfile(initialProfile)
                  }}
                  style={{
                    padding: '14px 25px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Logout Section */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h5 style={{ color: '#dc3545', marginBottom: '10px', fontWeight: 'bold' }}>
              <FaSignOutAlt style={{ marginRight: '8px' }} /> Security
            </h5>
            <p style={{ color: '#6c757d', marginBottom: '15px' }}>
              Logout from admin panel
            </p>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#dc3545',
                border: '2px solid #dc3545',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <FaSignOutAlt style={{ marginRight: '8px' }} /> Logout
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminProfile

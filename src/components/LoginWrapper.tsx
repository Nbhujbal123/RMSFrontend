import React from 'react'
import { useNavigate } from 'react-router-dom'
import Login from '../pages/customer/Login'
import { useAuth } from '../context/AuthContext'

const LoginWrapper: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleClose = () => navigate('/')

  const handleLoginSuccess = (token: string, user: any) => {
    localStorage.setItem('token', token)
    if (user.siteCode) {
      localStorage.setItem('siteCode', user.siteCode)
    }
    login({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      profilePicture: '',
    })
    navigate('/menu')
  }

  return (
    <Login
      onClose={handleClose}
      onLoginSuccess={handleLoginSuccess}
    />
  )
}

export default LoginWrapper

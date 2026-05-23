import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaFilePdf, FaFileExcel, FaChevronLeft, FaChevronRight, FaFilter, FaClock, FaCheck, FaBox, FaCog } from 'react-icons/fa'
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';
import { API_BASE_URL } from '../../config/api';

interface Order {
  _id: string
  user?: { name: string; email: string } | null
  items: Array<{ menuItemId: number; name: string; price: number; quantity: number }>
  total: number
  orderStatus: string
  createdAt: string
}

const Reports: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: '2020-01-01',
    end: '2030-12-31'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const ordersPerPage = 10

  // Status badge helper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#F59E0B', color: '#fff', icon: <FaClock /> };
      case 'PREPARING':
        return { bg: '#3B82F6', color: '#fff', icon: <FaCog /> };
      case 'READY':
        return { bg: '#10B981', color: '#fff', icon: <FaBox /> };
      case 'COMPLETED':
        return { bg: '#4F46E5', color: '#fff', icon: <FaCheck /> };
      case 'DELIVERED':
        return { bg: '#4F46E5', color: '#fff', icon: <FaCheck /> };
      default:
        return { bg: '#6B7280', color: '#fff', icon: null };
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated')
    if (!isAuthenticated) {
      navigate('/admin')
    }
  }, [navigate])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const siteCode = localStorage.getItem('siteCode') || ''
        const response = await fetch(`${API_BASE_URL}/orders`, {
          headers: {
            'x-site-code': siteCode
          }
        })
        if (response.ok) {
          const data = await response.json()
          setOrders(data)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Filter orders by date range and status
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
    const matchesDate = orderDate >= dateRange.start && orderDate <= dateRange.end
    const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter
    return matchesDate && matchesStatus
  })

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const totalOrders = filteredOrders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    const data = {
      dateRange,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      orders: filteredOrders
    }

    if (format === 'pdf') {
      console.log('Exporting PDF:', data)
      alert('PDF export functionality would be implemented here')
    } else {
      console.log('Exporting Excel:', data)
      alert('Excel export functionality would be implemented here')
    }
  }

  return (
    <AdminLayout title="Sales Reports">
      <div className="container-fluid " style={{
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        
      }}>
        <div className="row mb-4" style={{ marginTop: '50px' }}>
          <div className="col-12">
            <h1 className="display-5 fw-bold text-primary mb-4" style={{marginTop: '20px', fontSize: '2.5rem'}}>
              Sales Reports
            </h1>
          </div>
        </div>

        {/* Date Range Filter */}
        



        {/* Summary Statistics */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-primary">{totalOrders}</h3>
                <p className="text-muted mb-0">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-success">
                  ₹{totalRevenue.toFixed(2)}
                </h3>
                <p className="text-muted mb-0">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center">
                <h3 className="fw-bold text-info">
                  ₹{averageOrderValue.toFixed(2)}
                </h3>
                <p className="text-muted mb-0">Average Order Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Report */}
        <div className="row">
  <div className="col-12">
    <div className="card shadow-sm border-0">
      <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ backgroundColor: '#4F46E5', color: 'white' }}>
        <h5 className="mb-0 fw-semibold">Detailed Sales Report</h5>
        
        {/* Status Filter Buttons */}
        <div className="d-flex gap-1 flex-wrap">
          <button
            className="btn btn-sm"
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            style={{
              backgroundColor: statusFilter === 'ALL' ? 'white' : 'transparent',
              color: statusFilter === 'ALL' ? '#4F46E5' : 'white',
              border: '1px solid white',
              borderRadius: '15px',
              padding: '4px 12px',
              fontSize: '12px'
            }}
          >
            All
          </button>
          <button
            className="btn btn-sm"
            onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
            style={{
              backgroundColor: statusFilter === 'PENDING' ? '#F59E0B' : 'transparent',
              color: statusFilter === 'PENDING' ? '#fff' : 'white',
              border: '1px solid #F59E0B',
              borderRadius: '15px',
              padding: '4px 12px',
              fontSize: '12px'
            }}
          >
            Pending
          </button>
          <button
            className="btn btn-sm"
            onClick={() => { setStatusFilter('PREPARING'); setCurrentPage(1); }}
            style={{
              backgroundColor: statusFilter === 'PREPARING' ? '#3B82F6' : 'transparent',
              color: statusFilter === 'PREPARING' ? '#fff' : 'white',
              border: '1px solid #3B82F6',
              borderRadius: '15px',
              padding: '4px 12px',
              fontSize: '12px'
            }}
          >
            Preparing
          </button>
          <button
            className="btn btn-sm"
            onClick={() => { setStatusFilter('READY'); setCurrentPage(1); }}
            style={{
              backgroundColor: statusFilter === 'READY' ? '#10B981' : 'transparent',
              color: statusFilter === 'READY' ? '#fff' : 'white',
              border: '1px solid #10B981',
              borderRadius: '15px',
              padding: '4px 12px',
              fontSize: '12px'
            }}
          >
            Ready
          </button>
          <button
            className="btn btn-sm"
            onClick={() => { setStatusFilter('COMPLETED'); setCurrentPage(1); }}
            style={{
              backgroundColor: statusFilter === 'COMPLETED' ? '#fff' : 'transparent',
              color: statusFilter === 'COMPLETED' ? '#4F46E5' : 'white',
              border: '1px solid white',
              borderRadius: '15px',
              padding: '4px 12px',
              fontSize: '12px'
            }}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="card-body">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">
              No orders found for the selected date range.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map(order => (
                    <tr key={order._id}>
                      <td className="fw-bold">{order._id.slice(-6)}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div>
                          <div className="fw-bold">{order.user?.name || 'Unknown'}</div>
                          <small className="text-muted">{order.user?.email || 'N/A'}</small>
                        </div>
                      </td>
                      <td>
                        {order.items.map(item => (
                          <div key={item.menuItemId} className="small">
                            {item.name} <span className="text-muted">x{item.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="fw-bold text-success">
                        ₹{(order.total || 0).toFixed(2)}
                      </td>
                      <td>
                        {(() => {
                          const statusStyle = getStatusBadgeClass(order.orderStatus);
                          return (
                            <span
                              className="badge px-2 py-1"
                              style={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                fontWeight: '600',
                                fontSize: '11px'
                              }}
                            >
                              {statusStyle.icon && <span className="me-1">{statusStyle.icon}</span>}
                              {order.orderStatus}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="d-md-none">
              {currentOrders.map(order => (
                <div
                  key={order._id}
                  className="p-3 mb-3 bg-white rounded shadow-sm"
                  style={{
                    borderLeft: '5px solid #0d6efd',
                  }}
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold text-dark">{order.user?.name || 'Unknown'}</div>
                      <small className="text-muted">{order.user?.email || 'N/A'}</small>
                    </div>
                    {(() => {
                      const statusStyle = getStatusBadgeClass(order.orderStatus);
                      return (
                        <span
                          className="badge px-2 py-1"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: '600',
                            fontSize: '10px'
                          }}
                        >
                          {statusStyle.icon && <span className="me-1">{statusStyle.icon}</span>}
                          {order.orderStatus}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="mt-2 small text-muted">
                    Date: {new Date(order.createdAt).toLocaleDateString()}
                  </div>

                  <div className="mt-2">
                    {order.items.map(item => (
                      <div key={item.menuItemId} className="d-flex align-items-center small">
                        <span className="me-2 text-dark">{item.name}</span>
                        <span className="badge bg-light text-dark me-2">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-success">
                      ₹{(order.total || 0).toFixed(2)}
                    </span>
                    <span className="text-muted small">#{order._id.slice(-6)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4 px-3">
                <span className="text-muted small">
                  Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
                </span>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><FaChevronLeft /></button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><FaChevronRight /></button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
</div>

      </div>
    </AdminLayout>
  )
}

export default Reports
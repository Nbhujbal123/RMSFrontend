import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaEye,
  FaCheck,
  FaDownload,
  FaSearch,
  FaFilter,
  FaFileInvoiceDollar,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaPrint,
} from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';
import { API_BASE_URL } from '../../config/api';

// Type definitions
interface BillItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Bill {
  _id: string;
  invoiceNumber?: string;
  customerId?: {
    name: string;
    email: string;
  };
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tableNumber?: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: 'UNPAID' | 'PAID';
  paymentMethod?: string;
  createdAt: string;
}

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  // State
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'ALL' as 'ALL' | 'PAID' | 'UNPAID',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [billStats, setBillStats] = useState({
    totalBills: 0,
    paidBills: 0,
    unpaidBills: 0,
    todayRevenue: 0,
    todayBills: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  const billsPerPage = 10;

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) navigate('/admin');
  }, [navigate]);

  // Generate bills for completed orders on mount
  useEffect(() => {
    const generateBills = async () => {
      try {
        console.log('Generating bills for existing completed orders...');
        const siteCode = localStorage.getItem('siteCode') || ''
        const response = await fetch(`${API_BASE_URL}/orders/generate-bills`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'x-site-code': siteCode
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Bill generation result:', data);
        } else {
          console.error('Failed to generate bills');
        }
      } catch (error) {
        console.error('Error generating bills:', error);
      }
    };

    generateBills();
  }, []);

  // Fetch bills and stats - runs on mount and when filters change
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        console.log('Fetching bills from API...');
        const params = new URLSearchParams();
        if (filters.status !== 'ALL') params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        params.append('page', '1');
        params.append('limit', '100');

        const siteCode = localStorage.getItem('siteCode') || ''
        const response = await fetch(`${API_BASE_URL}/bills?${params}`, {
          headers: {
            'x-site-code': siteCode
          }
        });
        console.log('Bills API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Bills data received:', data);
          setBills(data.bills || data);
        } else {
          console.error('Failed to fetch bills, status:', response.status);
          // Try to get error message
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
        setError('Failed to connect to server. Please check if backend is running.');
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        console.log('Fetching bill stats...');
        const siteCode = localStorage.getItem('siteCode') || ''
        const response = await fetch(`${API_BASE_URL}/bills/stats`, {
          headers: {
            'x-site-code': siteCode
          }
        });
        console.log('Stats API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Stats data received:', data);
          setBillStats(data);
        } else {
          console.error('Failed to fetch stats, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    // Initial fetch
    fetchBills();
    fetchStats();
  }, [filters]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.status !== 'ALL') params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        params.append('page', '1');
        params.append('limit', '100');

        const siteCode = localStorage.getItem('siteCode') || ''
        const response = await fetch(`${API_BASE_URL}/bills?${params}`, {
          headers: {
            'x-site-code': siteCode
          }
        });
        if (response.ok) {
          const data = await response.json();
          setBills(data.bills || data);
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    };

    const fetchStats = async () => {
      try {
        const siteCode = localStorage.getItem('siteCode') || ''
        const response = await fetch(`${API_BASE_URL}/bills/stats`, {
          headers: {
            'x-site-code': siteCode
          }
        });
        if (response.ok) {
          const data = await response.json();
          setBillStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

  }, [filters]);

  // View bill details
  const handleView = (bill: Bill) => {
    setSelectedBill(bill);
    setShowModal(true);
  };

  // View invoice
  const handleViewInvoice = (bill: Bill) => {
    setSelectedBill(bill);
    setShowInvoiceModal(true);
  };

  // Mark as paid
  const handleMarkAsPaid = async (billId: string) => {
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const response = await fetch(`${API_BASE_URL}/bills/pay/${billId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-site-code': siteCode
        },
        body: JSON.stringify({ paymentMethod: 'CASH' })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the bill in the list
        setBills(prev => prev.map(b => b._id === billId ? { ...b, status: 'PAID', paymentMethod: 'CASH' } : b));
        // Update selected bill if it's the one being paid
        if (selectedBill?._id === billId) {
          setSelectedBill({ ...selectedBill, status: 'PAID' });
        }
      } else {
        console.error('Failed to mark as paid');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  // Toggle payment status
  const handleToggleStatus = async (billId: string) => {
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const response = await fetch(`${API_BASE_URL}/bills/toggle/${billId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-site-code': siteCode
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBills(prev => prev.map(b => b._id === billId ? { ...b, status: data.bill.status } : b));
        if (selectedBill?._id === billId) {
          setSelectedBill({ ...selectedBill, status: data.bill.status });
        }
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Download PDF - using browser print
  const handleDownloadPdf = async () => {
    // Use browser print as the PDF download method
    window.print()
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadgeClass = (status: string) => {
    return status === 'PAID' 
      ? 'badge bg-success' 
      : 'badge bg-warning text-dark';
  };

  // Calculate item subtotal
  const getItemSubtotal = (item: BillItem) => item.price * item.quantity;

  // Pagination
  const indexOfLastBill = currentPage * billsPerPage;
  const indexOfFirstBill = indexOfLastBill - billsPerPage;
  const currentBills = bills.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(bills.length / billsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Filter change handler
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout title="Billing & Payments">
        <div className="container-fluid py-4 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'var(--color-bg-secondary)', minHeight: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Billing & Payments">
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', color: '#212529', marginTop: '50px' }}>
        
        {/* Error Display */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#EEF2FF' }}>
                    <FaFileInvoiceDollar className="fs-4" style={{ color: '#4F46E5' }} />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Bills</p>
                    <h4 className="mb-0 fw-bold">{billStats.totalBills}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#DCFCE7' }}>
                    <FaCheck className="fs-4" style={{ color: '#16A34A' }} />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Paid Bills</p>
                    <h4 className="mb-0 fw-bold">{billStats.paidBills}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#FEF3C7' }}>
                    <FaMoneyBillWave className="fs-4" style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Unpaid Bills</p>
                    <h4 className="mb-0 fw-bold">{billStats.unpaidBills}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#E0E7FF' }}>
                    <FaCalendarAlt className="fs-4" style={{ color: '#4F46E5' }} />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Today's Revenue</p>
                    <h4 className="mb-0 fw-bold" style={{ color: '#4F46E5' }}>₹{billStats.todayRevenue.toFixed(2)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-3 mb-3">
                <label className="form-label small text-muted">Status</label>
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: '#fff', borderColor: '#dee2e6' }}>
                    <FaFilter />
                  </span>
                  <select 
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    style={{ borderColor: '#dee2e6' }}
                  >
                    <option value="ALL">All Bills</option>
                    <option value="PAID">Paid</option>
                    <option value="UNPAID">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label small text-muted">Search</label>
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: '#fff', borderColor: '#dee2e6' }}>
                    <FaSearch />
                  </span>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Invoice # or Customer"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    style={{ borderColor: '#dee2e6' }}
                  />
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label small text-muted">From Date</label>
                <input 
                  type="date"
                  className="form-control"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  style={{ borderColor: '#dee2e6' }}
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label small text-muted">To Date</label>
                <input 
                  type="date"
                  className="form-control"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  style={{ borderColor: '#dee2e6' }}
                />
              </div>
              <div className="col-md-2 mb-3">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => setFilters({ status: 'ALL', search: '', startDate: '', endDate: '' })}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-body p-0">
            <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '2px solid #dee2e6' }}>
              <h5 className="fw-semibold d-flex align-items-center mb-0">
                <FaFileInvoiceDollar className="me-2" style={{ color: '#4F46E5' }} /> Bills
              </h5>
              <div className="d-flex align-items-center gap-2">
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={() => {
                    // Force refresh bills
                    const fetchBills = async () => {
                      setLoading(true);
                      try {
                        const params = new URLSearchParams();
                        if (filters.status !== 'ALL') params.append('status', filters.status);
                        if (filters.search) params.append('search', filters.search);
                        if (filters.startDate) params.append('startDate', filters.startDate);
                        if (filters.endDate) params.append('endDate', filters.endDate);
                        params.append('page', '1');
                        params.append('limit', '100');
                        const siteCode = localStorage.getItem('siteCode') || ''
                        const response = await fetch(`${API_BASE_URL}/bills?${params}`, {
                          headers: {
                            'x-site-code': siteCode
                          }
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setBills(data.bills || data);
                        }
                      } catch (error) {
                        console.error('Error fetching bills:', error);
                      } finally {
                        setLoading(false);
                      }
                    };
                    fetchBills();
                    // Also refresh stats
                    const siteCode = localStorage.getItem('siteCode') || ''
                    fetch(`${API_BASE_URL}/bills/stats`, {
                      headers: {
                        'x-site-code': siteCode
                      }
                    })
                      .then(res => res.json())
                      .then(data => setBillStats(data))
                      .catch(err => console.error('Error refreshing stats:', err));
                  }}
                >
                  ↻ Refresh
                </button>
                <span className="badge" style={{ backgroundColor: '#4F46E5', color: '#fff' }}>{bills.length} bills</span>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#F9FAFB' }}>
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBills.length > 0 ? (
                    currentBills.map(bill => (
                      <tr key={bill._id} className="border-bottom">
                        <td className="px-4 py-3">
                          <span className="fw-semibold" style={{ color: '#4F46E5' }}>
                            {bill.invoiceNumber || bill._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="fw-medium">{bill.customerName}</span>
                            {bill.tableNumber && (
                              <span className="badge bg-secondary ms-2">Table {bill.tableNumber}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{bill.items.length} items</td>
                        <td className="px-4 py-3">
                          <span className="fw-bold text-success">₹{bill.totalAmount.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={getStatusBadgeClass(bill.status)}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted small">{formatDate(bill.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewInvoice(bill)}
                              title="View Invoice"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleView(bill)}
                              title="View Details"
                            >
                              <FaFilter />
                            </button>
                            {bill.status === 'UNPAID' ? (
                              <button
                                className="btn btn-sm"
                                style={{ backgroundColor: '#4F46E5', color: '#fff' }}
                                onClick={() => handleMarkAsPaid(bill._id)}
                                title="Mark as Paid"
                              >
                                <FaCheck />
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleToggleStatus(bill._id)}
                                title="Mark as Unpaid"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        No bills found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="d-md-none">
              {currentBills.map(bill => (
                <div key={bill._id} className="bill-card m-3 p-3" style={{
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #dee2e6'
                }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="fw-bold" style={{ color: '#4F46E5' }}>
                        {bill.invoiceNumber || bill._id.slice(-8).toUpperCase()}
                      </span>
                      {bill.tableNumber && (
                        <span className="badge bg-secondary ms-2">Table {bill.tableNumber}</span>
                      )}
                    </div>
                    <span className={getStatusBadgeClass(bill.status)}>
                      {bill.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Customer</small>
                    <span className="fw-semibold">{bill.customerName}</span>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Amount</small>
                    <span className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>₹{bill.totalAmount.toFixed(2)}</span>
                  </div>
                  <small className="text-muted d-block mb-3">{formatDate(bill.createdAt)}</small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill"
                      onClick={() => handleViewInvoice(bill)}
                    >
                      <FaEye className="me-1" /> Invoice
                    </button>
                    {bill.status === 'UNPAID' ? (
                      <button
                        className="btn btn-sm flex-fill"
                        style={{ backgroundColor: '#4F46E5', color: '#fff' }}
                        onClick={() => handleMarkAsPaid(bill._id)}
                      >
                        <FaCheck className="me-1" /> Pay
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-warning flex-fill"
                        onClick={() => handleToggleStatus(bill._id)}
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3">
                <span className="text-muted small">
                  Showing {indexOfFirstBill + 1} to {Math.min(indexOfLastBill, bills.length)} of {bills.length} bills
                </span>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                        <FaChevronLeft />
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginate(i + 1)}
                          style={currentPage === i + 1 ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5' } : {}}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                        <FaChevronRight />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Modal */}
        {showInvoiceModal && selectedBill && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-scrollable modal-lg">
              <div className="modal-content" style={{ borderRadius: '12px' }}>
                <div className="modal-header" style={{ borderBottom: '2px solid #4F46E5' }}>
                  <h5 className="modal-title fw-bold">
                    <FaFileInvoiceDollar className="me-2" style={{ color: '#4F46E5' }} />
                    Invoice
                  </h5>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: '#4F46E5', color: '#fff' }}
                      onClick={handleDownloadPdf}
                      title="Download PDF"
                    >
                      <FaDownload /> PDF
                    </button>
                    <button type="button" className="btn-close" onClick={() => setShowInvoiceModal(false)}></button>
                  </div>
                </div>
                <div className="modal-body p-0">
                  {/* Invoice Template */}
                  <div ref={invoiceRef} className="invoice-template p-4" style={{ backgroundColor: '#fff' }}>
                    {/* Invoice Header */}
                    <div className="text-center mb-4 pb-4" style={{ borderBottom: '2px solid #4F46E5' }}>
                      <h2 className="fw-bold mb-1" style={{ color: '#4F46E5' }}>RestoM Restaurant</h2>
                      <p className="text-muted mb-1">123 Restaurant Street, Food City, FC 12345</p>
                      <p className="text-muted mb-0">Phone: +91 9876543210 | Email: info@restom.com</p>
                    </div>

                    {/* Invoice Info */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="text-muted text-uppercase small">Invoice Number</h6>
                        <p className="fw-bold mb-0" style={{ color: '#4F46E5', fontSize: '1.1rem' }}>
                          {selectedBill.invoiceNumber || selectedBill._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <h6 className="text-muted text-uppercase small">Date</h6>
                        <p className="fw-bold mb-0">{formatDate(selectedBill.createdAt)}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="text-muted text-uppercase small">Bill To</h6>
                        <p className="fw-bold mb-0">{selectedBill.customerName}</p>
                        {selectedBill.customerEmail && <p className="text-muted mb-0 small">{selectedBill.customerEmail}</p>}
                        {selectedBill.customerPhone && <p className="text-muted mb-0 small">{selectedBill.customerPhone}</p>}
                        {selectedBill.tableNumber && <p className="text-muted mb-0 small">Table: {selectedBill.tableNumber}</p>}
                      </div>
                      <div className="col-md-6 text-md-end">
                        <h6 className="text-muted text-uppercase small">Status</h6>
                        <span className={getStatusBadgeClass(selectedBill.status)} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                          {selectedBill.status}
                        </span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="table mb-4" style={{ border: '1px solid #dee2e6' }}>
                      <thead style={{ backgroundColor: '#4F46E5', color: '#fff' }}>
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-end">Price</th>
                          <th className="px-3 py-2 text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-end">₹{item.price.toFixed(2)}</td>
                            <td className="px-3 py-2 text-end">₹{getItemSubtotal(item).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="row justify-content-end">
                      <div className="col-md-5">
                        <div className="d-flex justify-content-between py-2">
                          <span className="text-muted">Subtotal</span>
                          <span className="fw-medium">₹{(selectedBill.subtotal || selectedBill.items.reduce((sum, item) => sum + getItemSubtotal(item), 0)).toFixed(2)}</span>
                        </div>
                        {selectedBill.tax > 0 && (
                          <div className="d-flex justify-content-between py-2">
                            <span className="text-muted">Tax (8%)</span>
                            <span className="fw-medium">₹{selectedBill.tax.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedBill.deliveryFee > 0 && (
                          <div className="d-flex justify-content-between py-2">
                            <span className="text-muted">Delivery Fee</span>
                            <span className="fw-medium">₹{selectedBill.deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedBill.discount > 0 && (
                          <div className="d-flex justify-content-between py-2">
                            <span className="text-muted">Discount</span>
                            <span className="fw-medium text-success">-₹{selectedBill.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between py-3" style={{ borderTop: '2px solid #4F46E5', backgroundColor: '#F9FAFB' }}>
                          <span className="fw-bold" style={{ fontSize: '1.2rem' }}>Grand Total</span>
                          <span className="fw-bold" style={{ fontSize: '1.4rem', color: '#4F46E5' }}>₹{selectedBill.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-5 pt-4" style={{ borderTop: '1px solid #dee2e6' }}>
                      <p className="text-muted small mb-1">Thank you for dining with us!</p>
                      <p className="text-muted small mb-0">Powered by RestoM - Restaurant Management System</p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {selectedBill.status === 'UNPAID' && (
                    <button
                      className="btn"
                      style={{ backgroundColor: '#4F46E5', color: '#fff' }}
                      onClick={() => {
                        handleMarkAsPaid(selectedBill._id);
                        setShowInvoiceModal(false);
                      }}
                    >
                      <FaCheck className="me-2" /> Mark as Paid
                    </button>
                  )}
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleDownloadPdf}
                  >
                    <FaDownload className="me-2" /> Download PDF
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showModal && selectedBill && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content" style={{ borderRadius: '12px' }}>
                <div className="modal-header" style={{ borderBottom: '2px solid #4F46E5' }}>
                  <h5 className="modal-title fw-bold">Bill Details</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  {/* Customer Info */}
                  <div className="mb-4 p-3" style={{ backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                    <div className="row">
                      <div className="col-md-6">
                        <small className="text-muted d-block">Customer Name</small>
                        <span className="fw-semibold">{selectedBill.customerName}</span>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Invoice #</small>
                        <span className="fw-semibold" style={{ color: '#4F46E5' }}>
                          {selectedBill.invoiceNumber || selectedBill._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Status</small>
                        <br />
                        <span className={getStatusBadgeClass(selectedBill.status)}>
                          {selectedBill.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <h6 className="fw-semibold mb-3">Ordered Items</h6>
                  <div className="table-responsive mb-4">
                    <table className="table table-sm">
                      <thead style={{ backgroundColor: '#F9FAFB' }}>
                        <tr>
                          <th>Item</th>
                          <th className="text-center">Qty</th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-end">₹{item.price.toFixed(2)}</td>
                            <td className="text-end">₹{getItemSubtotal(item).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="row justify-content-end">
                    <div className="col-md-5">
                      <div className="d-flex justify-content-between py-2">
                        <span className="text-muted">Subtotal</span>
                        <span>₹{(selectedBill.subtotal || selectedBill.items.reduce((sum, item) => sum + getItemSubtotal(item), 0)).toFixed(2)}</span>
                      </div>
                      {selectedBill.tax > 0 && (
                        <div className="d-flex justify-content-between py-2">
                          <span className="text-muted">Tax</span>
                          <span>₹{selectedBill.tax.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedBill.deliveryFee > 0 && (
                        <div className="d-flex justify-content-between py-2">
                          <span className="text-muted">Delivery Fee</span>
                          <span>₹{selectedBill.deliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedBill.discount > 0 && (
                        <div className="d-flex justify-content-between py-2">
                          <span className="text-muted">Discount</span>
                          <span className="text-success">-₹{selectedBill.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between py-3 mt-2" style={{ borderTop: '2px solid #4F46E5' }}>
                        <strong className="fs-5">Total</strong>
                        <strong className="fs-5" style={{ color: '#4F46E5' }}>₹{selectedBill.totalAmount.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {selectedBill.status === 'UNPAID' ? (
                    <button
                      className="btn"
                      style={{ backgroundColor: '#4F46E5', color: '#fff' }}
                      onClick={() => {
                        handleMarkAsPaid(selectedBill._id);
                        setShowModal(false);
                      }}
                    >
                      <FaCheck className="me-2" /> Mark as Paid
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => {
                        handleToggleStatus(selectedBill._id);
                        setShowModal(false);
                      }}
                    >
                      <FaTimes className="me-2" /> Mark as Unpaid
                    </button>
                  )}
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setShowModal(false);
                      setShowInvoiceModal(true);
                    }}
                  >
                    <FaEye className="me-2" /> View Invoice
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Billing;

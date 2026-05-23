import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPlus, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import AdminLayout from '../../components/AdminLayout'
import { API_BASE_URL } from '../../config/api'

type MenuItem = {
  id: number
  name: string
  price: string
  category: string
  image: string
  description: string
  foodType?: 'veg' | 'non-veg'
}

const MenuManagement: React.FC = () => {
  const navigate = useNavigate()
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    name: '',
    price: '0',
    category: 'Starters',
    image: '',
    description: '',
    foodType: 'veg' as 'veg' | 'non-veg'
  })

  const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages']

  // Responsive detection
  useEffect(() => {  
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated')
    if (!isAuthenticated) navigate('/admin')
  }, [navigate])

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        // Get siteCode from URL first, then localStorage as fallback
        const urlParams = new URLSearchParams(window.location.search)
        let siteCode = urlParams.get('siteCode') || localStorage.getItem('siteCode') || ''
        
        // Ensure siteCode is uppercase for consistency
        siteCode = siteCode.toUpperCase()
        
        // Store in localStorage if came from URL
        if (urlParams.get('siteCode') && !localStorage.getItem('siteCode')) {
          localStorage.setItem('siteCode', siteCode)
        }
        
        console.log('Admin: Fetching menu items with siteCode:', siteCode)
        
        const response = await fetch(`${API_BASE_URL}/menu?siteCode=${siteCode}`, {
          headers: {
            'x-site-code': siteCode
          }
        })
        if (response.ok) {
          const data = await response.json()
          setLocalMenuItems(data)
        }
      } catch (error) {
        console.error('Error fetching menu items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMenuItems()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
      description: item.description,
      foodType: item.foodType || 'veg'
    })
    setShowAddForm(true)
  }

  const getSiteCode = () => {
    const urlParams = new URLSearchParams(window.location.search)
    let siteCode = urlParams.get('siteCode') || localStorage.getItem('siteCode') || ''
    return siteCode.toUpperCase()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const siteCode = getSiteCode()

    try {
      if (editingItem) {
        const response = await fetch(`${API_BASE_URL}/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-site-code': siteCode
          },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          const updatedItem = await response.json()
          setLocalMenuItems(prev =>
            prev.map(item =>
              item.id === editingItem.id ? updatedItem.menuItem : item
            )
          )
          setEditingItem(null)
          alert('✅ Item updated successfully!')
        }
      } else {
        const newItemData = {
          name: formData.name,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          image: formData.image,
          description: formData.description,
          foodType: formData.foodType
          // Note: id is NOT sent - backend will auto-generate unique id
        }
        console.log('Sending menu item data:', newItemData)
        const response = await fetch(`${API_BASE_URL}/menu`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-site-code': siteCode
          },
          body: JSON.stringify(newItemData)
        })
        if (response.ok) {
          const data = await response.json()
          setLocalMenuItems(prev => [...prev, data.menuItem])
          alert('✅ New item added successfully!')
        } else {
          const errorText = await response.text()
          console.error('Error response:', errorText)
          alert('❌ Error: ' + errorText)
        }
      }
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert('❌ Error saving item: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }

    resetForm()
  }


const handleDelete = async (id: number) => {
  if (window.confirm('Are you sure you want to delete this item?')) {
    try {
      const siteCode = getSiteCode()
      const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
        method: 'DELETE',
        headers: {
          'x-site-code': siteCode
        }
      })
      if (response.ok) {
        setLocalMenuItems((prev) => prev.filter((item) => item.id !== id))
        alert('🗑️ Item deleted!')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('❌ Error deleting item')
    }
  }
}

const resetForm = () => {
  setFormData({
    name: '',
    price: '',
    category: 'Starters',
    image: '',
    description: '',
    foodType: 'veg'
  })
  setShowAddForm(false)
  setEditingItem(null)
}


  const toggleExpand = (id: number) => {
    if (isMobile) {
      setExpandedId(prev => (prev === id ? null : id))
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = localMenuItems.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(localMenuItems.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Show loading state
  if (loading) {
    return (
      <AdminLayout title="Menu Management">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Menu Management">
      <div
        className="menu-management-container"
        style={{ backgroundColor: '#f8f9fa', padding: '20px', minHeight: '100vh' , marginTop: '50px'}}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          <h1 className="display-6 fw-bold text-primary mb-2">Menu Management</h1>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <FaPlus className="me-2" /> Add New Item
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingItem) && (
          <div
            className="card shadow-sm mb-4"
            style={{ borderRadius: '12px', overflow: 'hidden', maxWidth: '900px', margin: 'auto' }}
          >
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label">
                      Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="price" className="form-label">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="category" className="form-label">
                      Category
                    </label>
                    <select
                      className="form-select"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Food Type</label>
                    <div className="d-flex gap-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="foodType"
                          id="veg"
                          value="veg"
                          checked={formData.foodType === 'veg'}
                          onChange={(e) => setFormData(prev => ({ ...prev, foodType: e.target.value as 'veg' | 'non-veg' }))}
                          required
                        />
                        <label className="form-check-label" htmlFor="veg">
                          Veg
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="foodType"
                          id="non-veg"
                          value="non-veg"
                          checked={formData.foodType === 'non-veg'}
                          onChange={(e) => setFormData(prev => ({ ...prev, foodType: e.target.value as 'veg' | 'non-veg' }))}
                          required
                        />
                        <label className="form-check-label" htmlFor="non-veg">
                          Non-Veg
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label htmlFor="image" className="form-label">
                      Choose Image
                    </label>
                    {editingItem && editingItem.image && (
                      <div className="mb-2">
                        <img src={editingItem.image} alt="Current" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                        <small className="text-muted d-block">Current image</small>
                      </div>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({ ...prev, image: event.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      required={!editingItem}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-primary me-2">
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Items List */}
        <div className="table-responsive">
          <table className="table align-middle shadow-sm bg-white rounded">
            <thead className="table-light">
              <tr>
                <th>Image</th>
                <th>Name & Category</th>
                <th>Description</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
  {currentItems.map(item => (
    isMobile ? (
      <tr key={item.id}>
        <td colSpan={5}>
          <div className="card shadow-sm mb-3 border-0">
            <img
              src={item.image}
              alt={item.name}
              className="card-img-top"
              style={{ height: '180px', objectFit: 'cover' }}
            />
            <div className="card-body">
              <h5 className="card-title fw-bold">{item.name}</h5>
              <p className="text-muted small mb-1">{item.category}</p>
              <p className="card-text">{item.description}</p>
              <h6 className="text-primary fw-bold">₹{parseFloat(item.price as string).toFixed(2)}</h6>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handleEdit(item)}
                >
                  <FaEdit />
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(item.id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    ) : (
      <tr key={item.id}>
        <td>
          <img
            src={item.image}
            alt={item.name}
            style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
          />
        </td>
        <td>
          <strong>{item.name}</strong>
          <br />
          <small className="text-muted">{item.category}</small>
        </td>
        <td className="text-muted">{item.description}</td>
        <td className="fw-bold text-primary">
          ₹{parseFloat(item.price as string).toFixed(2)}
        </td>
        <td>
          <button
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => handleEdit(item)}
          >
            <FaEdit />
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDelete(item.id)}
          >
            <FaTrash />
          </button>
        </td>
      </tr>
    )
  ))}
</tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4 px-3">
            <span className="text-muted small">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, localMenuItems.length)} of {localMenuItems.length} items
            </span>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        <style>
          {`
            @media (max-width: 768px) {
              table thead {
                display: none;
              }
              table, table tbody, table tr, table td {
                display: block;
                width: 100%;
              }
              table tr {
                margin-bottom: 1rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              table td {
                padding: 10px 15px;
                border: none;
              }
              table td img {
                width: 100%;
                height: 150px;
                object-fit: cover;
                border-radius: 12px 12px 0 0;
              }
            }
          `}
        </style>
      </div>
    </AdminLayout>
  )
}

export default MenuManagement
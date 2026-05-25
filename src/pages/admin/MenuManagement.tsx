import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPlus, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import AdminLayout from '../../components/AdminLayout'
import { API_BASE_URL } from '../../config/api'
import './MenuManagement.css'

type MenuItem = {
  id: number
  name: string
  price: string
  category: string
  image: string
  description: string
  foodType?: 'veg' | 'non-veg'
}

const CATEGORIES = ['Starters', 'Main Course', 'Desserts', 'Beverages']
const ITEMS_PER_PAGE = 10

const MenuManagement: React.FC = () => {
  const navigate = useNavigate()
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    price: '0',
    category: 'Starters',
    image: '',
    description: '',
    foodType: 'veg' as 'veg' | 'non-veg',
  })

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated')
    if (!isAuthenticated) navigate('/admin')
  }, [navigate])

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        let siteCode = urlParams.get('siteCode') || localStorage.getItem('siteCode') || ''
        siteCode = siteCode.toUpperCase()
        if (urlParams.get('siteCode') && !localStorage.getItem('siteCode')) {
          localStorage.setItem('siteCode', siteCode)
        }
        const response = await fetch(`${API_BASE_URL}/menu?siteCode=${siteCode}`, {
          headers: { 'x-site-code': siteCode },
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

  const getSiteCode = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return (urlParams.get('siteCode') || localStorage.getItem('siteCode') || '').toUpperCase()
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
      description: item.description,
      foodType: item.foodType || 'veg',
    })
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const siteCode = getSiteCode()
    try {
      if (editingItem) {
        const response = await fetch(`${API_BASE_URL}/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-site-code': siteCode },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          const updatedItem = await response.json()
          setLocalMenuItems(prev =>
            prev.map(item => (item.id === editingItem.id ? updatedItem.menuItem : item))
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
          foodType: formData.foodType,
        }
        const response = await fetch(`${API_BASE_URL}/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-site-code': siteCode },
          body: JSON.stringify(newItemData),
        })
        if (response.ok) {
          const data = await response.json()
          setLocalMenuItems(prev => [...prev, data.menuItem])
          alert('✅ New item added successfully!')
        } else {
          const errorText = await response.text()
          alert('❌ Error: ' + errorText)
        }
      }
    } catch (error) {
      alert('❌ Error saving item: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    resetForm()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      const siteCode = getSiteCode()
      const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
        method: 'DELETE',
        headers: { 'x-site-code': siteCode },
      })
      if (response.ok) {
        setLocalMenuItems(prev => prev.filter(item => item.id !== id))
        alert('🗑️ Item deleted!')
      }
    } catch {
      alert('❌ Error deleting item')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', price: '', category: 'Starters', image: '', description: '', foodType: 'veg' })
    setShowAddForm(false)
    setEditingItem(null)
  }

  // Pagination
  const totalPages = Math.ceil(localMenuItems.length / ITEMS_PER_PAGE)
  const indexOfFirst = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = localMenuItems.slice(indexOfFirst, indexOfFirst + ITEMS_PER_PAGE)

  const paginationPages = (): (number | '...')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  if (loading) {
    return (
      <AdminLayout title="Menu Management">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Menu Management">
      <div className="menu-page">

        {/* ── Page Header ── */}
        <div className="menu-page-header">
          <div>
            <h1 className="menu-page-title">Menu Management</h1>
            <p className="menu-page-subtitle">
              {localMenuItems.length} item{localMenuItems.length !== 1 ? 's' : ''} &middot; {CATEGORIES.length} categories
            </p>
          </div>
          <button
            className="btn btn-primary btn-add-item"
            onClick={() => { resetForm(); setShowAddForm(true) }}
          >
            <FaPlus /> Add New Item
          </button>
        </div>

        {/* ── Add / Edit Form ── */}
        {(showAddForm || editingItem) && (
          <div className="menu-form-card">
            <div className="menu-form-header">
              <h5>{editingItem ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}</h5>
            </div>
            <div className="menu-form-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">

                  {/* Name */}
                  <div className="col-12 col-md-6">
                    <label htmlFor="name" className="form-label fw-semibold">Item Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      placeholder="e.g. Butter Chicken"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="col-6 col-md-3">
                    <label htmlFor="price" className="form-label fw-semibold">Price (₹)</label>
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

                  {/* Category */}
                  <div className="col-6 col-md-3">
                    <label htmlFor="category" className="form-label fw-semibold">Category</label>
                    <select
                      className="form-select"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Food Type */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Food Type</label>
                    <div className="food-type-group">
                      <label className={`food-type-option${formData.foodType === 'veg' ? ' active veg' : ''}`}>
                        <input
                          type="radio"
                          name="foodType"
                          value="veg"
                          checked={formData.foodType === 'veg'}
                          onChange={() => setFormData(prev => ({ ...prev, foodType: 'veg' }))}
                        />
                        <span className="food-dot food-dot-veg"></span>
                        Vegetarian
                      </label>
                      <label className={`food-type-option${formData.foodType === 'non-veg' ? ' active nonveg' : ''}`}>
                        <input
                          type="radio"
                          name="foodType"
                          value="non-veg"
                          checked={formData.foodType === 'non-veg'}
                          onChange={() => setFormData(prev => ({ ...prev, foodType: 'non-veg' }))}
                        />
                        <span className="food-dot food-dot-nonveg"></span>
                        Non-Vegetarian
                      </label>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="col-12">
                    <label htmlFor="image" className="form-label fw-semibold">Item Image</label>
                    {editingItem?.image && (
                      <div className="current-image-preview">
                        <img src={editingItem.image} alt="Current" />
                        <small className="text-muted">Current image — upload new to replace</small>
                      </div>
                    )}
                    <input
                      type="file"
                      className="form-control"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = event =>
                            setFormData(prev => ({ ...prev, image: event.target?.result as string }))
                          reader.readAsDataURL(file)
                        }
                      }}
                      required={!editingItem}
                    />
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label htmlFor="description" className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows={3}
                      placeholder="Describe the dish…"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Buttons */}
                  <div className="col-12">
                    <div className="form-action-row">
                      <button type="submit" className="btn btn-primary">
                        {editingItem ? 'Update Item' : 'Add Item'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                        Cancel
                      </button>
                    </div>
                  </div>

                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {localMenuItems.length === 0 ? (
          <div className="menu-empty-state">
            <span className="menu-empty-icon">🍽️</span>
            <h4>No menu items yet</h4>
            <p className="text-muted mb-0">Click "Add New Item" to start building your menu.</p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table (md+) ── */}
            <div className="menu-table-wrapper d-none d-md-block">
              <table className="table menu-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Image</th>
                    <th>Name &amp; Category</th>
                    <th>Description</th>
                    <th style={{ width: 110 }}>Price</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <img src={item.image} alt={item.name} className="menu-thumb" />
                      </td>
                      <td>
                        <div className="item-name-cell">
                          <span className={`food-indicator ${item.foodType === 'non-veg' ? 'nonveg' : 'veg'}`} />
                          <div>
                            <strong>{item.name}</strong>
                            <div>
                              <span className="category-badge">{item.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="item-description">{item.description}</span>
                      </td>
                      <td>
                        <span className="item-price">₹{parseFloat(item.price).toFixed(2)}</span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary action-icon-btn"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger action-icon-btn"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card Grid (< md) ── */}
            <div className="menu-card-grid d-md-none">
              {currentItems.map(item => (
                <div key={item.id} className="menu-card">
                  <div className="menu-card-img-wrap">
                    <img src={item.image} alt={item.name} className="menu-card-img" />
                    <span className={`food-tag ${item.foodType === 'non-veg' ? 'nonveg' : 'veg'}`}>
                      {item.foodType === 'non-veg' ? '🍗 Non-Veg' : '🥦 Veg'}
                    </span>
                  </div>
                  <div className="menu-card-body">
                    <div className="menu-card-top">
                      <h6 className="menu-card-name">{item.name}</h6>
                      <span className="menu-card-price">₹{parseFloat(item.price).toFixed(2)}</span>
                    </div>
                    <span className="menu-card-category">{item.category}</span>
                    <p className="menu-card-desc">{item.description}</p>
                    <div className="menu-card-actions">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleEdit(item)}
                      >
                        <FaEdit className="me-1" /> Edit
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <FaTrash className="me-1" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="menu-pagination">
                <span className="pagination-info">
                  {indexOfFirst + 1}–{Math.min(indexOfFirst + ITEMS_PER_PAGE, localMenuItems.length)} of{' '}
                  {localMenuItems.length} items
                </span>
                <nav aria-label="Menu pagination">
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous"
                      >
                        <FaChevronLeft />
                      </button>
                    </li>
                    {paginationPages().map((page, idx) =>
                      page === '...' ? (
                        <li key={`ellipsis-${idx}`} className="page-item disabled">
                          <span className="page-link">…</span>
                        </li>
                      ) : (
                        <li
                          key={page}
                          className={`page-item ${currentPage === page ? 'active' : ''}`}
                        >
                          <button className="page-link" onClick={() => setCurrentPage(page as number)}>
                            {page}
                          </button>
                        </li>
                      )
                    )}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next"
                      >
                        <FaChevronRight />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default MenuManagement

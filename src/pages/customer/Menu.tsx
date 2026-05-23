import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import type { MenuItem } from '../../context/CartContext'
import { FaPlus, FaMinus, FaSearch, FaLeaf, FaDrumstickBite } from 'react-icons/fa'
import LoadingSpinner from '../../components/LoadingSpinner'
import SkeletonLoader from '../../components/SkeletonLoader'
import { toast } from '../../components/Toast'
import { API_BASE_URL } from '../../config/api'

const CATEGORY_ICONS: Record<string, string> = {
  All: '🍽️', Starters: '🥗', 'Main Course': '🥘',
  Beverages: '🥤', Desserts: '🍰',
}

const Menu: React.FC = () => {
  const { addToCart, cart, updateQuantity } = useCart()
  const location = useLocation()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurantInactive, setRestaurantInactive] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const urlParams = new URLSearchParams(location.search)
    const category = urlParams.get('category')
    return (category && category !== 'All Items') ? category : 'All'
  })

  const [selectedType, setSelectedType] = useState(
    localStorage.getItem('selectedType') || 'veg'
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedSpiceLevels, setSelectedSpiceLevels] = useState<{ [key: number]: 'mild' | 'medium' | 'hot' }>({})

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tableParam = urlParams.get('table')
    if (tableParam) localStorage.setItem('tableNumber', tableParam)
  }, [location.search])

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const category = urlParams.get('category')
    const typeFromUrl = urlParams.get('type')
    if (category && category !== 'All Items' && category !== selectedCategory) setSelectedCategory(category)
    const type = typeFromUrl || localStorage.getItem('selectedType') || 'veg'
    setSelectedType(type)
  }, [location.search, selectedCategory])

  const hideTypeFilter = ['Desserts', 'Beverages', 'Kids'].includes(selectedCategory)
  const categories = ['All', 'Starters', 'Main Course', 'Beverages', 'Desserts']

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const urlParams = new URLSearchParams(window.location.search)
        let siteCode = urlParams.get('siteCode') || localStorage.getItem('siteCode') || ''
        siteCode = siteCode.toUpperCase()
        if (urlParams.get('siteCode') && !localStorage.getItem('siteCode')) {
          localStorage.setItem('siteCode', siteCode)
        }
        const response = await fetch(`${API_BASE_URL}/menu?siteCode=${siteCode}`, {
          headers: { 'x-site-code': siteCode }
        })
        const restaurantResponse = await fetch(`${API_BASE_URL}/restaurants/${siteCode}`)
        if (restaurantResponse.ok) {
          const restaurantData = await restaurantResponse.json()
          if (restaurantData.status !== 'ACTIVE') {
            setRestaurantInactive(true)
            setLoading(false)
            return
          }
        }
        if (!response.ok) throw new Error(`Failed to fetch menu items: ${response.statusText}`)
        setMenuItems(await response.json())
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to load menu items'
        setError(msg)
        toast.error('Failed to load menu. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchMenuItems()
  }, [location.search])

  /* ── loading ── */
  if (loading) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ height: '48px', borderRadius: '50px', background: '#e5e7eb', marginBottom: '20px' }} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: '38px', width: '100px', borderRadius: '50px', background: '#e5e7eb' }} />
            ))}
          </div>
          <SkeletonLoader type="card" count={6} />
        </div>
      </div>
    )
  }

  /* ── error ── */
  if (error) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>😕</div>
          <h4 style={{ fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>Unable to Load Menu</h4>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(90deg,#FF6A00,#FF9900)', color: '#fff',
              border: 'none', borderRadius: '50px', padding: '12px 32px',
              fontWeight: 700, cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ── inactive ── */
  if (restaurantInactive) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
          <h4 style={{ fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>Restaurant Currently Inactive</h4>
          <p style={{ color: '#9ca3af' }}>Please contact the Super Admin to activate this restaurant.</p>
        </div>
      </div>
    )
  }

  /* ── filter ── */
  const filteredItems = menuItems.filter(item => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchType = hideTypeFilter
      ? true
      : selectedCategory === 'All' && selectedType === 'all'
        ? true
        : item.foodType.toLowerCase().replace('-', '') === selectedType.toLowerCase().replace('-', '')
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchType && matchSearch
  })

  const groupedItems = selectedCategory === 'All'
    ? filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
      }, {} as Record<string, MenuItem[]>)
    : {}

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item, selectedSpiceLevels[item.id] || 'medium')
  }

  const renderItem = (item: MenuItem) => {
    const cartItem = cart.find(c => c.id === item.id)
    const quantity = cartItem ? cartItem.quantity : 0
    const isHot   = item.spiceLevel === 'hot'
    const isMed   = item.spiceLevel === 'medium'
    const hasSpi  = ['Starters', 'Main Course'].includes(item.category)

    return (
      <div key={item.id} className="col-12 col-sm-6 col-lg-4">
        <div
          style={{
            background: '#fff', borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,.07)',
            overflow: 'hidden', transition: 'transform .2s, box-shadow .2s',
            height: '100%', display: 'flex', flexDirection: 'column'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,.13)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,.07)'
          }}
        >
          {/* image */}
          <div style={{ position: 'relative' }}>
            <img
              src={item.image} alt={item.name}
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
            {/* food type badge */}
            <span style={{
              position: 'absolute', top: '10px', left: '10px',
              background: item.foodType === 'veg' ? '#dcfce7' : '#fee2e2',
              color: item.foodType === 'veg' ? '#166534' : '#991b1b',
              borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              {item.foodType === 'veg' ? <><FaLeaf size={9} /> Veg</> : <><FaDrumstickBite size={9} /> Non-Veg</>}
            </span>
            {/* spice badge */}
            {hasSpi && (
              <span style={{
                position: 'absolute', top: '10px', right: '10px',
                background: isHot ? '#ef4444' : isMed ? '#f59e0b' : '#10b981',
                color: '#fff', borderRadius: '20px',
                padding: '3px 10px', fontSize: '10px', fontWeight: 700
              }}>
                {item.spiceLevel}
              </span>
            )}
          </div>

          {/* body */}
          <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h6 style={{ fontWeight: 700, fontSize: '15px', color: '#1f2937', marginBottom: '4px' }}>
              {item.name}
            </h6>
            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.4', marginBottom: '12px', flex: 1 }}>
              {item.description}
            </p>

            {/* spice selector */}
            {hasSpi && (
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {(['mild', 'medium', 'hot'] as const).map(spice => (
                  <button
                    key={spice}
                    onClick={() => setSelectedSpiceLevels(prev => ({ ...prev, [item.id]: spice }))}
                    style={{
                      flex: 1, padding: '4px', borderRadius: '8px', border: 'none',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      background: selectedSpiceLevels[item.id] === spice
                        ? (spice === 'hot' ? '#ef4444' : spice === 'medium' ? '#f59e0b' : '#10b981')
                        : '#f3f4f6',
                      color: selectedSpiceLevels[item.id] === spice ? '#fff' : '#6b7280',
                      transition: 'all .15s'
                    }}
                  >
                    {spice.charAt(0).toUpperCase() + spice.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* price + add */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#FF6A00' }}>
                ₹{item.price.toFixed(2)}
              </span>

              {quantity === 0 ? (
                <button
                  onClick={() => handleAddToCart(item)}
                  style={{
                    background: 'linear-gradient(90deg,#FF6A00,#FF9900)',
                    color: '#fff', border: 'none', borderRadius: '50px',
                    padding: '8px 18px', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 12px rgba(255,106,0,.25)'
                  }}
                >
                  <FaPlus size={11} /> Add
                </button>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0',
                  background: 'linear-gradient(90deg,#FF6A00,#FF9900)',
                  borderRadius: '50px', overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(255,106,0,.25)'
                }}>
                  <button
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                    style={{
                      background: 'transparent', border: 'none', color: '#fff',
                      width: '32px', height: '32px', cursor: 'pointer',
                      fontWeight: 700, fontSize: '14px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <FaMinus size={11} />
                  </button>
                  <span style={{
                    color: '#fff', fontWeight: 800, fontSize: '14px',
                    minWidth: '24px', textAlign: 'center'
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    style={{
                      background: 'transparent', border: 'none', color: '#fff',
                      width: '32px', height: '32px', cursor: 'pointer',
                      fontWeight: 700, fontSize: '14px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <FaPlus size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>

      {/* ── sticky filter bar ── */}
      <div style={{
        background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.07)',
        position: 'sticky', top: '64px', zIndex: 100, padding: '12px 16px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#f3f4f6', borderRadius: '50px',
            padding: '8px 16px', marginBottom: '12px'
          }}>
            <FaSearch style={{ color: '#FF6A00', flexShrink: 0 }} size={14} />
            <input
              type="text"
              placeholder="Search items…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                flex: 1, fontSize: '14px', color: '#1f2937'
              }}
            />
          </div>

          {/* category pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  flexShrink: 0, border: 'none', borderRadius: '50px',
                  padding: '7px 16px', fontWeight: 700, fontSize: '13px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  background: selectedCategory === cat
                    ? 'linear-gradient(90deg,#FF6A00,#FF9900)'
                    : '#f3f4f6',
                  color: selectedCategory === cat ? '#fff' : '#6b7280',
                  boxShadow: selectedCategory === cat ? '0 4px 12px rgba(255,106,0,.25)' : 'none',
                  transition: 'all .2s'
                }}
              >
                <span>{CATEGORY_ICONS[cat] ?? '🍴'}</span> {cat}
              </button>
            ))}
          </div>

          {/* veg/non-veg toggle */}
          {!hideTypeFilter && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => setSelectedType('veg')}
                style={{
                  border: 'none', borderRadius: '50px',
                  padding: '6px 16px', fontWeight: 700, fontSize: '12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  background: selectedType === 'veg' ? '#dcfce7' : '#f3f4f6',
                  color: selectedType === 'veg' ? '#166534' : '#6b7280',
                  transition: 'all .2s'
                }}
              >
                🥦 Veg
              </button>
              <button
                onClick={() => setSelectedType('nonveg')}
                style={{
                  border: 'none', borderRadius: '50px',
                  padding: '6px 16px', fontWeight: 700, fontSize: '12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  background: selectedType === 'nonveg' ? '#fee2e2' : '#f3f4f6',
                  color: selectedType === 'nonveg' ? '#991b1b' : '#6b7280',
                  transition: 'all .2s'
                }}
              >
                🍗 Non-Veg
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── items ── */}
      <div style={{ padding: '20px 16px', maxWidth: '960px', margin: '0 auto' }}>
        {selectedCategory === 'All' ? (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '36px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '22px' }}>{CATEGORY_ICONS[category] ?? '🍴'}</span>
                <h5 style={{ fontWeight: 800, color: '#1f2937', margin: 0 }}>{category}</h5>
                <span style={{
                  background: '#fff8f0', color: '#FF6A00',
                  borderRadius: '20px', padding: '2px 10px',
                  fontSize: '12px', fontWeight: 700
                }}>
                  {items.length} items
                </span>
              </div>
              <div className="row g-3">{items.map(item => renderItem(item))}</div>
            </div>
          ))
        ) : (
          <div className="row g-3">
            {filteredItems.map(item => renderItem(item))}
          </div>
        )}

        {/* empty state */}
        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🍽️</div>
            <h5 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>No items found</h5>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Try a different category or search term.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Menu

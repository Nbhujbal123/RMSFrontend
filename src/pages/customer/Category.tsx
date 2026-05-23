import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaSearch, FaLeaf, FaDrumstickBite, FaChevronRight } from 'react-icons/fa'
import { menuItems } from '../../data/menuItems'
import { toast } from '../../components/Toast'

const CATEGORY_META: Record<string, { icon: string; gradient: string; light: string }> = {
  'All Items':   { icon: '🍽️', gradient: 'linear-gradient(135deg,#FF6A00,#FF9900)', light: '#fff8f0' },
  'Starters':    { icon: '🥗', gradient: 'linear-gradient(135deg,#10b981,#34d399)', light: '#f0fdf4' },
  'Main Course': { icon: '🥘', gradient: 'linear-gradient(135deg,#ef4444,#f97316)', light: '#fff1f2' },
  'Kids':        { icon: '👶', gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', light: '#fffbeb' },
  'Desserts':    { icon: '🍰', gradient: 'linear-gradient(135deg,#ec4899,#f472b6)', light: '#fdf2f8' },
  'Beverages':   { icon: '🥤', gradient: 'linear-gradient(135deg,#3b82f6,#60a5fa)', light: '#eff6ff' },
}

const Category: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [isTypeSelected, setIsTypeSelected] = useState(false)
  const navigate = useNavigate()

  const categories = [
    { name: 'All Items',   count: menuItems.length },
    { name: 'Starters',   count: menuItems.filter(i => i.category === 'Starters').length },
    { name: 'Main Course',count: menuItems.filter(i => i.category === 'Main Course').length },
    { name: 'Kids',       count: menuItems.filter(i => i.category === 'Kids').length },
    { name: 'Desserts',   count: menuItems.filter(i => i.category === 'Desserts').length },
    { name: 'Beverages',  count: menuItems.filter(i => i.category === 'Beverages').length },
  ]

  const filteredMenuItems = searchQuery.trim()
    ? menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : []

  const handleDishClick = (item: any) => {
    navigate(`/menu?category=${encodeURIComponent(item.category)}&item=${encodeURIComponent(item.name)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredMenuItems.length > 0) handleDishClick(filteredMenuItems[0])
  }

  const handleTypeSelection = (type: string) => {
    setSelectedType(type)
    setIsTypeSelected(true)
    if (type === 'Veg') {
      localStorage.setItem('selectedType', 'veg')
    } else if (type === 'Non-Veg') {
      localStorage.setItem('selectedType', 'nonveg')
    } else {
      localStorage.setItem('selectedType', 'all')
      setIsTypeSelected(false)
      navigate('/menu?type=all&category=All')
    }
  }

  const getCategoryLink = (name: string) => {
    if (name === 'All Items') return `/menu?type=${localStorage.getItem('selectedType') || 'all'}&category=All`
    if (['Desserts', 'Beverages', 'Kids'].includes(name)) return `/menu?type=all&category=${encodeURIComponent(name)}`
    if (isTypeSelected) return `/menu?type=${localStorage.getItem('selectedType')}&category=${encodeURIComponent(name)}`
    return ''
  }

  const needsTypeFirst = (name: string) =>
    name !== 'All Items' && !['Desserts', 'Beverages', 'Kids'].includes(name) && !isTypeSelected

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>

      {/* ── hero bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6A00 0%, #FF9900 100%)',
        padding: '32px 20px 64px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '26px', marginBottom: '6px' }}>
          What are you craving?
        </h1>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '14px', marginBottom: '24px' }}>
          Browse categories or search for your favourite dish
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{
            background: '#fff',
            borderRadius: '50px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,.15)'
          }}>
            <FaSearch style={{ color: '#FF6A00', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search dishes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                border: 'none', outline: 'none', flex: 1,
                fontSize: '15px', background: 'transparent', color: '#1f2937'
              }}
            />
          </div>

          {/* dropdown */}
          {searchQuery.trim() && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: '#fff', borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 20,
              maxHeight: '320px', overflowY: 'auto', textAlign: 'left'
            }}>
              {filteredMenuItems.length > 0 ? (
                filteredMenuItems.slice(0, 8).map(dish => (
                  <div
                    key={dish.id ?? dish.name}
                    onClick={() => handleDishClick(dish)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6', transition: 'background .15s'
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff8f0'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                  >
                    <img
                      src={dish.image} alt={dish.name}
                      style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>{dish.name}</div>
                      <div style={{ fontSize: '12px', color: '#FF6A00', fontWeight: 600 }}>₹{dish.price}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{dish.category}</div>
                    </div>
                    <FaChevronRight style={{ marginLeft: 'auto', color: '#d1d5db', flexShrink: 0 }} size={12} />
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍽️</div>
                  <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No dishes found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── content pulled up ── */}
      <div style={{ padding: '0 16px', maxWidth: '700px', margin: '-32px auto 0', position: 'relative', zIndex: 10 }}>

        {/* Type filter pill bar */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          padding: '14px 16px', marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,.08)'
        }}>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Filter by type
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'All', icon: null },
              { label: 'Veg', icon: <FaLeaf size={12} /> },
              { label: 'Non-Veg', icon: <FaDrumstickBite size={12} /> },
            ].map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => handleTypeSelection(label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 18px', borderRadius: '50px',
                  border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  background: selectedType === label
                    ? 'linear-gradient(90deg,#FF6A00,#FF9900)'
                    : '#f3f4f6',
                  color: selectedType === label ? '#fff' : '#6b7280',
                  transition: 'all .2s',
                  boxShadow: selectedType === label ? '0 4px 12px rgba(255,106,0,.3)' : 'none'
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category cards */}
        <h6 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '14px', fontSize: '15px' }}>
          Browse Categories
        </h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {categories.map(category => {
            const meta = CATEGORY_META[category.name]
            const link = getCategoryLink(category.name)
            const blocked = needsTypeFirst(category.name)

            return (
              <Link
                key={category.name}
                to={link}
                onClick={e => {
                  if (blocked) {
                    e.preventDefault()
                    toast.warning('Please select Veg or Non-Veg first!')
                  }
                }}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#fff',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,.07)',
                  transition: 'transform .2s, box-shadow .2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,.07)'
                  }}
                >
                  {/* colored top strip */}
                  <div style={{
                    background: meta.gradient,
                    height: '80px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px'
                  }}>
                    {meta.icon}
                  </div>
                  {/* info */}
                  <div style={{
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>
                        {category.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                        {category.count} items
                      </div>
                    </div>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: meta.light, display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FaChevronRight size={11} style={{ color: '#FF6A00' }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Category

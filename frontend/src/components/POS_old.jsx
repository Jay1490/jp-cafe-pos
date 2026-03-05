import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { productsAPI, ordersAPI, settingsAPI } from '../services/api';
import { printBill } from '../services/print';

const CATS = ['All', 'Beverages', 'Snacks', 'Breakfast', 'Desserts', 'Meals'];
const fc = (n) => `₹${Number(n).toFixed(2)}`;

export default function POS() {
  const [products, setProducts]   = useState([]);
  const [settings, setSettings]   = useState(null);
  const [cart, setCart]           = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch]       = useState('');
  const [gstOn, setGstOn]         = useState(true);
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [placing, setPlacing]     = useState(false);
  const [showCart, setShowCart]   = useState(false); // mobile cart toggle

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          productsAPI.getAll(),
          settingsAPI.getPublic(),
        ]);
        setProducts(pRes.data.data);
        const s = sRes.data.data;
        setSettings(s);
        setGstOn(s.gstEnabled);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = products.filter(p =>
    (activeCat === 'All' || p.category === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i._id === product._id);
      if (ex) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i._id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const gstRate  = settings?.gstRate || 5;
  const gst      = gstOn ? subtotal * gstRate / 100 : 0;
  const total    = subtotal + gst;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const checkout = async () => {
    if (!cart.length || placing) return;
    setPlacing(true);
    try {
      const res = await ordersAPI.place({
        items: cart.map(i => ({ productId: i._id, name: i.name, emoji: i.emoji, price: i.price, qty: i.qty })),
        subtotal, gstEnabled: gstOn, gstRate, gst, total, note,
      });
      const order = res.data.data;
      printBill(order, settings);
      toast.success(`✅ Bill #${order.billNo} placed!`);
      setCart([]);
      setNote('');
      setShowCart(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:16, color:'#c9a96e' }}>
        <div style={{ fontSize:48, animation:'spin 1s linear infinite' }}>☕</div>
        <p style={{ fontFamily:"'DM Sans',sans-serif" }}>Loading menu...</p>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', height:'100%', position:'relative', background:'#f8f5f0' }}>
      {/* ── Product Area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Search + Categories */}
        <div style={{ padding:'12px 12px 8px', background:'#fff', borderBottom:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <input
            placeholder="🔍  Search items..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 16px', borderRadius:14, border:'1.5px solid #e0d5c8', fontSize:15, outline:'none', background:'#faf8f5', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", marginBottom:10, color:'#3d1a00' }}
          />
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
            {CATS.filter(c => c === 'All' || products.some(p => p.category === c)).map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{
                padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:600,
                border:'none', cursor:'pointer', whiteSpace:'nowrap',
                background: activeCat===c ? '#c17f3c' : '#f0ebe4',
                color: activeCat===c ? '#fff' : '#7a6a5a',
                transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif",
                flexShrink:0, boxShadow: activeCat===c?'0 3px 10px rgba(193,127,60,0.35)':'none',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex:1, overflowY:'auto', padding:12, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10, alignContent:'start' }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', paddingTop:60, color:'#b0a090' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🔍</div>
              <p>No items found</p>
            </div>
          )}
          {filtered.map(p => {
            const ic = cart.find(i => i._id === p._id);
            return (
              <button key={p._id} onClick={() => addToCart(p)} style={{
                background: ic ? '#fff8ef' : '#fff',
                border: `2px solid ${ic ? '#c17f3c' : '#e8e0d5'}`,
                borderRadius:16, padding:'14px 8px 12px',
                cursor:'pointer', textAlign:'center',
                transition:'all 0.15s', position:'relative',
                boxShadow: ic ? '0 4px 16px rgba(193,127,60,0.2)' : '0 1px 6px rgba(0,0,0,0.05)',
                fontFamily:"'DM Sans',sans-serif",
                WebkitTapHighlightColor:'transparent',
              }}
              onPointerDown={e => e.currentTarget.style.transform='scale(0.94)'}
              onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
              onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}>
                {ic && (
                  <div style={{ position:'absolute', top:6, right:6, background:'#c17f3c', color:'#fff', borderRadius:'50%', width:22, height:22, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{ic.qty}</div>
                )}
                <div style={{ fontSize:34, marginBottom:6 }}>{p.emoji}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#3d2a1a', marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#c17f3c' }}>{fc(p.price)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop Bill Panel ── */}
      <div className="bill-panel-desktop" style={{ width:300, background:'#fff', borderLeft:'1px solid #e8e0d5', display:'flex', flexDirection:'column', boxShadow:'-4px 0 20px rgba(0,0,0,0.08)', flexShrink:0 }}>
        <BillPanel cart={cart} settings={settings} gstOn={gstOn} setGstOn={setGstOn} note={note} setNote={setNote} subtotal={subtotal} gst={gst} total={total} gstRate={gstRate} cartCount={cartCount} onUpdateQty={updateQty} onRemove={removeItem} onClear={()=>setCart([])} onCheckout={checkout} placing={placing}/>
      </div>

      {/* ── Mobile: floating cart button ── */}
      {cartCount > 0 && (
        <button className="mobile-cart-btn" onClick={() => setShowCart(true)} style={{
          position:'fixed', bottom:72, right:16, zIndex:900,
          background:'linear-gradient(135deg,#c17f3c,#e8a045)',
          border:'none', borderRadius:20, padding:'12px 20px',
          color:'#fff', fontWeight:700, fontSize:15,
          boxShadow:'0 6px 24px rgba(193,127,60,0.5)',
          display:'flex', alignItems:'center', gap:10,
          fontFamily:"'DM Sans',sans-serif", cursor:'pointer',
        }}>
          <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800 }}>{cartCount}</span>
          View Cart · {fc(total)}
        </button>
      )}

      {/* ── Mobile Cart Drawer ── */}
      {showCart && (
        <div className="mobile-drawer-overlay" style={{ position:'fixed', inset:0, zIndex:950, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={()=>setShowCart(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', bottom:0, left:0, right:0, background:'#fff', borderRadius:'24px 24px 0 0', maxHeight:'92dvh', display:'flex', flexDirection:'column', boxShadow:'0 -10px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ padding:'12px 20px', borderBottom:'1px solid #e8e0d5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, color:'#3d1a00', fontSize:16 }}>🧾 Your Order</span>
              <button onClick={()=>setShowCart(false)} style={{ background:'#f0ebe4', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:16, color:'#7a6a5a' }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <BillPanel cart={cart} settings={settings} gstOn={gstOn} setGstOn={setGstOn} note={note} setNote={setNote} subtotal={subtotal} gst={gst} total={total} gstRate={gstRate} cartCount={cartCount} onUpdateQty={updateQty} onRemove={removeItem} onClear={()=>setCart([])} onCheckout={()=>{ checkout(); }} placing={placing} mobile/>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .bill-panel-desktop { display: none !important; }
        }
        @media (min-width: 641px) {
          .mobile-cart-btn { display: none !important; }
          .mobile-drawer-overlay { display: none !important; }
        }
        @media (max-width: 480px) {
          /* Even smaller phones: 3 cols instead of 2 */
        }
      `}</style>
    </div>
  );
}

function BillPanel({ cart, settings, gstOn, setGstOn, note, setNote, subtotal, gst, total, gstRate, cartCount, onUpdateQty, onRemove, onClear, onCheckout, placing, mobile }) {
  const fc = (n) => `₹${Number(n).toFixed(2)}`;

  return (
    <>
      {/* Header */}
      {!mobile && (
        <div style={{ padding:'14px 20px', background:'#3d1a00' }}>
          <div style={{ color:'#f5c842', fontSize:15, fontWeight:700, letterSpacing:2, fontFamily:"'Playfair Display',Georgia,serif" }}>🧾 CURRENT ORDER</div>
          <div style={{ color:'#c9a96e', fontSize:12, marginTop:2 }}>{cartCount} item{cartCount !== 1 ? 's' : ''} · {fc(total)}</div>
        </div>
      )}

      {/* Cart Items */}
      <div style={{ flex:1, overflowY:'auto', padding:12 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign:'center', color:'#b0a090', paddingTop:50, fontSize:13 }}>
            <div style={{ fontSize:48, marginBottom:10 }}>🛒</div>
            <p>Tap items to add them</p>
          </div>
        ) : cart.map(item => (
          <div key={item._id} style={{ display:'flex', alignItems:'center', padding:'10px 4px', borderBottom:'1px solid #f5efe8', gap:8 }}>
            <span style={{ fontSize:24 }}>{item.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
              <div style={{ fontSize:11, color:'#c17f3c' }}>{fc(item.price)}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <button onClick={() => onUpdateQty(item._id, -1)} style={{ width:28, height:28, borderRadius:8, border:'1.5px solid #e0d5c8', background:'#faf8f5', cursor:'pointer', fontSize:17, fontWeight:700, color:'#c17f3c', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
              <span style={{ fontSize:14, fontWeight:700, minWidth:20, textAlign:'center' }}>{item.qty}</span>
              <button onClick={() => onUpdateQty(item._id, 1)} style={{ width:28, height:28, borderRadius:8, border:'none', background:'#c17f3c', cursor:'pointer', fontSize:17, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#3d1a00', minWidth:50, textAlign:'right' }}>{fc(item.price * item.qty)}</div>
          </div>
        ))}
      </div>

      {/* Note */}
      {cart.length > 0 && (
        <div style={{ padding:'0 12px 10px' }}>
          <input placeholder="📝 Order note..." value={note} onChange={e => setNote(e.target.value)}
            style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid #e0d5c8', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00' }}/>
        </div>
      )}

      {/* Totals */}
      <div style={{ padding:'12px 18px', borderTop:'2px dashed #e8e0d5' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14, color:'#7a6a5a' }}>
          <span>Subtotal</span><span style={{ fontWeight:600 }}>{fc(subtotal)}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#7a6a5a' }} onClick={() => setGstOn(v => !v)}>
            <div style={{ width:38, height:22, borderRadius:11, background:gstOn?'#c17f3c':'#ccc', position:'relative', transition:'background 0.2s', cursor:'pointer', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left:gstOn?18:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
            </div>
            GST ({gstRate}%)
          </label>
          <span style={{ fontSize:13, color:'#7a6a5a' }}>{fc(gst)}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:22, fontWeight:800, paddingTop:10, borderTop:'1px solid #e8e0d5', color:'#3d1a00' }}>
          <span>TOTAL</span><span style={{ color:'#c17f3c' }}>{fc(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={onCheckout} disabled={!cart.length || placing} style={{
          padding:'16px', borderRadius:14, border:'none',
          cursor: cart.length && !placing ? 'pointer' : 'not-allowed',
          background: !cart.length ? '#e0d5c8' : placing ? '#888' : 'linear-gradient(135deg,#c17f3c,#e8a045)',
          color:'#fff', fontSize:16, fontWeight:700,
          transition:'all 0.3s', fontFamily:"'DM Sans',sans-serif",
          boxShadow: cart.length ? '0 6px 20px rgba(193,127,60,0.4)' : 'none',
        }}>
          {placing ? '⏳ Placing...' : '🖨️  Bill & Place Order'}
        </button>
        {cart.length > 0 && (
          <button onClick={onClear} style={{ padding:'10px', borderRadius:10, border:'1.5px solid #e0d5c8', background:'transparent', color:'#c0504d', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            🗑️  Clear Cart
          </button>
        )}
      </div>
    </>
  );
}

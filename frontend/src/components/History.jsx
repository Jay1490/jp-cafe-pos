import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI, productsAPI } from '../services/api';

const fc     = (n)   => `₹${Number(n).toFixed(2)}`;
const fDate  = (iso) => new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
const fTime  = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
const today  = ()    => new Date().toISOString().split('T')[0];

export default function History({ onOrderEdited }) {
  const [summary, setSummary]           = useState([]);
  const [orders, setOrders]             = useState([]);
  const [selectedDate, setSelected]     = useState(today());
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showDateList, setShowDateList] = useState(false);

  // Edit modal state
  const [editOrder, setEditOrder]       = useState(null);   // order being edited
  const [editItems, setEditItems]       = useState([]);     // cart items in editor
  const [editNote, setEditNote]         = useState('');
  const [allProducts, setAllProducts]   = useState([]);
  const [saving, setSaving]             = useState(false);
  const [showAddItem, setShowAddItem]   = useState(false);

  // Load summary + all products once
  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          ordersAPI.getSummary(60),
          productsAPI.getAll({ all: 'true' }),
        ]);
        setSummary(sRes.data.data);
        setAllProducts(pRes.data.data);
      } catch { toast.error('Failed to load history'); }
    };
    load();
  }, []);

  // Load orders when date changes
  useEffect(() => {
    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await ordersAPI.getAll({ date: selectedDate, limit: 100 });
        setOrders(res.data.data);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoadingOrders(false); }
    };
    loadOrders();
  }, [selectedDate]);

  const dayRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const selectDate = (d) => { setSelected(d); setShowDateList(false); };

  // ── Open edit modal ──────────────────────────────────────────────────────────
  const openEdit = (order) => {
    setEditOrder(order);
    setEditItems(order.items.map(i => ({ ...i, _id: i.productId || i._id })));
    setEditNote(order.note || '');
    setShowAddItem(false);
  };

  const closeEdit = () => { setEditOrder(null); setEditItems([]); setEditNote(''); };

  // ── Edit item qty ────────────────────────────────────────────────────────────
  const updateEditQty = (idx, delta) => {
    setEditItems(prev => {
      const updated = prev.map((item, i) =>
        i === idx ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      ).filter(item => item.qty > 0);
      return updated;
    });
  };

  const removeEditItem = (idx) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Edit item price directly ─────────────────────────────────────────────────
  const updateEditPrice = (idx, newPrice) => {
    setEditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, price: parseFloat(newPrice) || 0 } : item
    ));
  };

  // ── Add product to edit cart ─────────────────────────────────────────────────
  const addProductToEdit = (product) => {
    setEditItems(prev => {
      const ex = prev.find(i => (i.productId || i._id)?.toString() === product._id?.toString());
      if (ex) return prev.map(i =>
        (i.productId || i._id)?.toString() === product._id?.toString()
          ? { ...i, qty: i.qty + 1 }
          : i
      );
      return [...prev, { productId: product._id, name: product.name, emoji: product.emoji, price: product.price, qty: 1, total: product.price }];
    });
    setShowAddItem(false);
  };

  // ── Save edited order ────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editItems.length) return toast.error('Order must have at least one item');
    setSaving(true);
    try {
      const res = await ordersAPI.edit(editOrder._id, {
        items: editItems.map(i => ({
          productId: i.productId || i._id,
          name: i.name, emoji: i.emoji, price: i.price, qty: i.qty,
        })),
        note: editNote,
      });
      const updated = res.data.data;
      // Update orders list in place
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
      // Refresh summary
      const sRes = await ordersAPI.getSummary(60);
      setSummary(sRes.data.data);
      toast.success('✅ Order updated!');
      if (onOrderEdited) onOrderEdited(); // ✅ refresh navbar revenue
      closeEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  // ── Calculated totals for edit modal ─────────────────────────────────────────
  const editSubtotal = editItems.reduce((s, i) => s + i.price * i.qty, 0);
  const editTotal    = editSubtotal; // GST disabled

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#f8f5f0' }}>

      {/* Mobile date bar */}
      <div className="history-mobile-header" style={{ display:'none', padding:'10px 14px', background:'#fff', borderBottom:'1px solid #e8e0d5', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <button onClick={() => setShowDateList(true)} style={{ padding:'9px 16px', borderRadius:12, border:'1.5px solid #c17f3c', background:'transparent', color:'#c17f3c', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          📅 {fDate(selectedDate + 'T00:00:00')}
        </button>
        <div style={{ fontWeight:700, color:'#c17f3c', fontSize:14 }}>{fc(dayRevenue)}</div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Date Sidebar Desktop */}
        <div className="date-sidebar-desktop" style={{ width:200, background:'#fff', borderRight:'1px solid #e8e0d5', overflowY:'auto', flexShrink:0 }}>
          <DateList summary={summary} selectedDate={selectedDate} onSelect={selectDate} />
        </div>

        {/* Mobile Date Drawer */}
        {showDateList && (
          <div style={{ position:'fixed', inset:0, zIndex:950, background:'rgba(0,0,0,0.5)' }} onClick={() => setShowDateList(false)}>
            <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:0, left:0, bottom:0, width:'75%', maxWidth:280, background:'#fff', boxShadow:'4px 0 20px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'16px', borderBottom:'1px solid #e8e0d5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, color:'#3d1a00' }}>Select Date</span>
                <button onClick={() => setShowDateList(false)} style={{ background:'#f0ebe4', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                <DateList summary={summary} selectedDate={selectedDate} onSelect={selectDate} />
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div style={{ flex:1, overflowY:'auto', padding:'clamp(12px,3vw,20px)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
            <h3 style={{ margin:0, color:'#3d2a1a', fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>
              {fDate(selectedDate + 'T00:00:00')}
              <span style={{ fontSize:13, fontWeight:400, color:'#b0a090', marginLeft:8 }}>({orders.length} orders)</span>
            </h3>
            <div style={{ background:'#c17f3c', color:'#fff', padding:'8px 20px', borderRadius:20, fontWeight:700, fontSize:14, boxShadow:'0 3px 12px rgba(193,127,60,0.35)' }}>
              {fc(dayRevenue)}
            </div>
          </div>

          {loadingOrders ? (
            <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:30 }}>⏳</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:60, color:'#b0a090' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
              <p>No orders on this date</p>
            </div>
          ) : orders.map(order => (
            <div key={order._id} style={{ background:'#fff', borderRadius:16, padding:'clamp(14px,3vw,20px)', marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #e8e0d5' }}>

              {/* Order header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#3d1a00', background:'#f5c842', padding:'3px 12px', borderRadius:20 }}>#{order.billNo}</span>
                  {order.status === 'cancelled' && (
                    <span style={{ marginLeft:8, fontSize:11, color:'#c0504d', background:'#ffe5e5', padding:'2px 8px', borderRadius:12 }}>Cancelled</span>
                  )}
                  <span style={{ fontSize:12, color:'#b0a090', marginLeft:8 }}>{fTime(order.createdAt)}</span>
                  {order.note && <div style={{ fontSize:11, color:'#c9a96e', marginTop:4 }}>📝 {order.note}</div>}
                </div>

                {/* Edit button */}
                {order.status !== 'cancelled' && (
                  <button onClick={() => openEdit(order)} style={{
                    padding:'7px 14px', borderRadius:10,
                    border:'1.5px solid #c17f3c', background:'#fff8ef',
                    color:'#c17f3c', fontSize:12, fontWeight:700,
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0,
                  }}>✏️ Edit Order</button>
                )}
              </div>

              {/* Items */}
              <div>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13, color:'#5a4a3a', borderBottom:'1px dotted #f0ebe4' }}>
                    <span>{item.emoji} {item.name} ×{item.qty}</span>
                    <span style={{ fontWeight:600 }}>{fc(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1px dashed #e8e0d5' }}>
                <span style={{ fontSize:11, color:'#b0a090' }}>{order.items.length} items</span>
                <strong style={{ color:'#c17f3c', fontSize:15 }}>Total: {fc(order.total)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit Order Modal ─────────────────────────────────────────────────── */}
      {editOrder && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={closeEdit}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'#fff', borderRadius:20, width:'100%', maxWidth:500,
            maxHeight:'90dvh', display:'flex', flexDirection:'column',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
          }}>

            {/* Modal Header */}
            <div style={{ padding:'16px 20px', background:'#3d1a00', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#f5c842', fontWeight:700, fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>✏️ Edit Order</div>
                <div style={{ color:'#c9a96e', fontSize:12, marginTop:2 }}>#{editOrder.billNo}</div>
              </div>
              <button onClick={closeEdit} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>

            {/* Items Editor */}
            <div style={{ flex:1, overflowY:'auto', padding:16 }}>

              {/* Item rows */}
              {editItems.map((item, idx) => (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', borderBottom:'1px solid #f5efe8' }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{item.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a', marginBottom:4 }}>{item.name}</div>
                    {/* Editable price */}
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, color:'#b0a090' }}>₹</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={e => updateEditPrice(idx, e.target.value)}
                        style={{ width:70, padding:'3px 6px', borderRadius:6, border:'1px solid #e0d5c8', fontSize:12, outline:'none', fontFamily:"'DM Sans',sans-serif", color:'#c17f3c', fontWeight:700 }}
                      />
                      <span style={{ fontSize:11, color:'#b0a090' }}>per item</span>
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <button onClick={() => updateEditQty(idx, -1)} style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #e0d5c8', background:'#faf8f5', cursor:'pointer', fontSize:18, fontWeight:700, color:'#c17f3c', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ fontSize:14, fontWeight:700, minWidth:22, textAlign:'center' }}>{item.qty}</span>
                    <button onClick={() => updateEditQty(idx, 1)} style={{ width:30, height:30, borderRadius:8, border:'none', background:'#c17f3c', cursor:'pointer', fontSize:18, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>

                  {/* Item total */}
                  <div style={{ fontSize:13, fontWeight:700, color:'#3d1a00', minWidth:52, textAlign:'right' }}>{fc(item.price * item.qty)}</div>

                  {/* Remove */}
                  <button onClick={() => removeEditItem(idx)} style={{ width:28, height:28, borderRadius:8, border:'1px solid #f0d0d0', background:'transparent', color:'#c0504d', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
                </div>
              ))}

              {/* Add Item button */}
              <button onClick={() => setShowAddItem(v => !v)} style={{
                width:'100%', marginTop:12, padding:'10px', borderRadius:12,
                border:'2px dashed #c17f3c', background:'#fff8ef',
                color:'#c17f3c', fontSize:13, fontWeight:700,
                cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              }}>
                {showAddItem ? '✕ Cancel' : '➕ Add Item'}
              </button>

              {/* Product picker */}
              {showAddItem && (
                <div style={{ marginTop:10, border:'1px solid #e8e0d5', borderRadius:14, overflow:'hidden', maxHeight:240, overflowY:'auto' }}>
                  {allProducts.filter(p => p.active).map(p => (
                    <button key={p._id} onClick={() => addProductToEdit(p)} style={{
                      width:'100%', padding:'10px 14px', border:'none', borderBottom:'1px solid #f5efe8',
                      background:'#fff', textAlign:'left', cursor:'pointer',
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      fontFamily:"'DM Sans',sans-serif",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff8ef'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <span style={{ fontSize:13 }}>{p.emoji} {p.name}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:'#c17f3c' }}>{fc(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Note */}
              <div style={{ marginTop:12 }}>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:4, fontWeight:600 }}>ORDER NOTE</label>
                <input
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Add a note..."
                  style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1px solid #e0d5c8', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid #e8e0d5', background:'#faf8f5', borderRadius:'0 0 20px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:14, color:'#7a6a5a' }}>{editItems.reduce((s,i)=>s+i.qty,0)} items</span>
                <span style={{ fontSize:20, fontWeight:800, color:'#c17f3c' }}>Total: {fc(editTotal)}</span>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={saveEdit} disabled={saving || !editItems.length} style={{
                  flex:1, padding:'14px', borderRadius:12, border:'none',
                  background: saving ? '#888' : 'linear-gradient(135deg,#c17f3c,#e8a045)',
                  color:'#fff', fontSize:15, fontWeight:700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:'0 4px 14px rgba(193,127,60,0.4)',
                }}>
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                <button onClick={closeEdit} style={{
                  padding:'14px 20px', borderRadius:12, border:'1.5px solid #e0d5c8',
                  background:'transparent', color:'#7a6a5a', cursor:'pointer',
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .date-sidebar-desktop { display: none !important; }
          .history-mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function DateList({ summary, selectedDate, onSelect }) {
  const fc    = (n)   => `₹${Number(n).toFixed(0)}`;
  const fDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short' });

  return (
    <>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid #e8e0d5', fontSize:11, color:'#b0a090', fontWeight:600, letterSpacing:1 }}>RECENT DATES</div>
      {summary.length === 0 ? (
        <div style={{ padding:20, color:'#b0a090', fontSize:13, textAlign:'center' }}>No orders yet</div>
      ) : summary.map(d => (
        <button key={d._id} onClick={() => onSelect(d._id)} style={{
          width:'100%', padding:'13px 14px', border:'none',
          borderBottom:'1px solid #f0ebe4',
          background: selectedDate === d._id ? '#fff8ef' : '#fff',
          borderLeft: selectedDate === d._id ? '4px solid #c17f3c' : '4px solid transparent',
          textAlign:'left', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s',
        }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a' }}>{fDate(d._id)}</div>
          <div style={{ fontSize:11, color:'#c17f3c', marginTop:2 }}>{fc(d.totalRevenue)} · {d.totalOrders} orders</div>
        </button>
      ))}
    </>
  );
}


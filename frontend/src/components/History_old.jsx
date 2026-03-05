import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI, settingsAPI } from '../services/api';
import { printBill } from '../services/print';

const fc = (n) => `₹${Number(n).toFixed(2)}`;
const fDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toISOString().split('T')[0];

export default function History() {
  const [summary, setSummary]       = useState([]);
  const [orders, setOrders]         = useState([]);
  const [selectedDate, setSelected] = useState(today());
  const [settings, setSettings]     = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showDateList, setShowDateList] = useState(false); // mobile toggle

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, stRes] = await Promise.all([
          ordersAPI.getSummary(60),
          settingsAPI.getPublic(),
        ]);
        setSummary(sRes.data.data);
        setSettings(stRes.data.data);
      } catch { toast.error('Failed to load history'); }
    };
    load();
  }, []);

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

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#f8f5f0' }}>

      {/* Mobile date picker bar */}
      <div className="history-mobile-header" style={{ display:'none', padding:'10px 14px', background:'#fff', borderBottom:'1px solid #e8e0d5', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <button onClick={() => setShowDateList(true)} style={{ padding:'9px 16px', borderRadius:12, border:'1.5px solid #c17f3c', background:'transparent', color:'#c17f3c', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          📅 {fDate(selectedDate + 'T00:00:00')}
        </button>
        <div style={{ fontWeight:700, color:'#c17f3c', fontSize:14 }}>{fc(dayRevenue)}</div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Date Sidebar (Desktop) / Drawer (Mobile) */}
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

        {/* Orders panel */}
        <div style={{ flex:1, overflowY:'auto', padding:'clamp(12px,3vw,20px)' }}>
          {/* Header row */}
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
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#3d1a00', background:'#f5c842', padding:'3px 12px', borderRadius:20 }}>
                    #{order.billNo}
                  </span>
                  {order.status === 'cancelled' && (
                    <span style={{ marginLeft:8, fontSize:11, color:'#c0504d', background:'#ffe5e5', padding:'2px 8px', borderRadius:12 }}>Cancelled</span>
                  )}
                  <span style={{ fontSize:12, color:'#b0a090', marginLeft:8 }}>{fTime(order.createdAt)}</span>
                  {order.note && <div style={{ fontSize:11, color:'#c9a96e', marginTop:4 }}>📝 {order.note}</div>}
                </div>
                {order.status !== 'cancelled' && settings && (
                  <button onClick={() => printBill(order, settings)} style={{ padding:'7px 14px', borderRadius:10, border:'1.5px solid #c17f3c', background:'transparent', color:'#c17f3c', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                    🖨️ Reprint
                  </button>
                )}
              </div>
              <div>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13, color:'#5a4a3a', borderBottom:'1px dotted #f0ebe4' }}>
                    <span>{item.emoji} {item.name} ×{item.qty}</span>
                    <span style={{ fontWeight:600 }}>{fc(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1px dashed #e8e0d5', flexWrap:'wrap', gap:4 }}>
                <span style={{ fontSize:11, color:'#b0a090' }}>
                  Sub: {fc(order.subtotal)}{order.gstEnabled ? ` + GST: ${fc(order.gst)}` : ''}
                </span>
                <strong style={{ color:'#c17f3c', fontSize:15 }}>Total: {fc(order.total)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

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
  const fc = (n) => `₹${Number(n).toFixed(0)}`;
  const fDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

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
          textAlign:'left', cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
          transition:'all 0.15s',
        }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a' }}>{fDate(d._id)}</div>
          <div style={{ fontSize:11, color:'#c17f3c', marginTop:2 }}>{fc(d.totalRevenue)} · {d.totalOrders} orders</div>
        </button>
      ))}
    </>
  );
}

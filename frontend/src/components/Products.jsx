import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productsAPI } from '../services/api';

const CATS = ['Beverages', 'Snacks', 'Breakfast', 'Desserts', 'Meals', 'Other'];
const EMOJIS = ['☕','🍵','🥤','🍋','🧃','🥛','🍺','🧋','🍔','🥪','🌮','🌯','🍟','🥟','🍕','🍜','🍚','🍛','🍞','🫓','🎂','🍰','🧁','🍩','🍪','🍫','🍦','🍿'];
const fc = (n) => `₹${Number(n).toFixed(0)}`;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState('');
  const [form, setForm]         = useState({ name:'', price:'', category:'Beverages', emoji:'☕', active:true });
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    try {
      const res = await productsAPI.getAll({ all: 'true' });
      setProducts(res.data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm({ name:'', price:'', category:'Beverages', emoji:'☕', active:true }); setShowForm(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ name:p.name, price:p.price, category:p.category, emoji:p.emoji, active:p.active }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim() || !form.price || isNaN(form.price)) return toast.error('Name and valid price required');
    setSaving(true);
    try {
      const data = { ...form, price: parseFloat(form.price) };
      if (editItem) {
        await productsAPI.update(editItem._id, data);
        toast.success('✅ Item updated!');
      } else {
        await productsAPI.create(data);
        toast.success('✅ Item added!');
      }
      await load();
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggle = async (p) => {
    try {
      await productsAPI.toggle(p._id);
      setProducts(prev => prev.map(x => x._id === p._id ? { ...x, active: !x.active } : x));
      toast.success(p.active ? 'Item hidden from POS' : 'Item visible on POS');
    } catch { toast.error('Failed to toggle'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      await productsAPI.delete(id);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('🗑️ Deleted!');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(18px,4vw,24px)' }}>🍽️ Products</h2>
          <p style={{ margin:'2px 0 0', color:'#b0a090', fontSize:13 }}>{products.length} items · {products.filter(p=>p.active).length} active</p>
        </div>
        <button onClick={openAdd} style={{ padding:'10px 20px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(193,127,60,0.4)', flexShrink:0 }}>
          ➕ Add Item
        </button>
      </div>

      {/* Search */}
      <input placeholder="🔍 Search products..." value={search} onChange={e=>setSearch(e.target.value)}
        style={{ width:'100%', maxWidth:360, padding:'10px 14px', borderRadius:12, border:'1.5px solid #e0d5c8', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", marginBottom:16, color:'#3d1a00', background:'#fff' }}/>

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:32 }}>⏳</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
          {filtered.map(p => (
            <div key={p._id} style={{ background:'#fff', borderRadius:16, padding:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #e8e0d5', opacity: p.active ? 1 : 0.55, transition:'opacity 0.2s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <span style={{ fontSize:36 }}>{p.emoji}</span>
                <div onClick={() => toggle(p)} style={{ width:36, height:20, borderRadius:10, background:p.active?'#c17f3c':'#ccc', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:2, left:p.active?18:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                </div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#3d2a1a', marginBottom:3 }}>{p.name}</div>
              <div style={{ fontSize:11, color:'#b0a090', background:'#f5efe8', display:'inline-block', padding:'2px 8px', borderRadius:10, marginBottom:8 }}>{p.category}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#c17f3c', marginBottom:12 }}>{fc(p.price)}</div>
              <div style={{ display:'flex', gap:7 }}>
                <button onClick={() => openEdit(p)} style={{ flex:1, padding:'7px', borderRadius:8, border:'1.5px solid #c17f3c', background:'transparent', color:'#c17f3c', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>✏️ Edit</button>
                <button onClick={() => del(p._id)} style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #f0d0d0', background:'transparent', color:'#c0504d', fontSize:12, cursor:'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0' }}>
          <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480, padding:'clamp(20px,4vw,32px)', boxShadow:'0 -10px 40px rgba(0,0,0,0.25)', maxHeight:'92dvh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>{editItem ? '✏️ Edit Item' : '➕ Add New Item'}</h3>
              <button onClick={()=>setShowForm(false)} style={{ background:'#f0ebe4', border:'none', borderRadius:10, padding:'7px 13px', cursor:'pointer', fontSize:16, color:'#7a6a5a' }}>✕</button>
            </div>

            <FormField label="ITEM NAME *">
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Masala Tea" style={inputStyle}/>
            </FormField>

            <FormField label="PRICE (₹) *">
              <input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0.00" min="0" step="0.5" style={inputStyle}/>
            </FormField>

            <FormField label="CATEGORY">
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...inputStyle,background:'#fff'}}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="EMOJI ICON">
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {EMOJIS.map(e=>(
                  <button key={e} type="button" onClick={()=>setForm({...form,emoji:e})} style={{ width:38, height:38, fontSize:20, borderRadius:10, cursor:'pointer', border:`2px solid ${form.emoji===e?'#c17f3c':'#e0d5c8'}`, background:form.emoji===e?'#fff8ef':'#faf8f5' }}>{e}</button>
                ))}
              </div>
            </FormField>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div onClick={()=>setForm({...form,active:!form.active})} style={{ width:42, height:24, borderRadius:12, background:form.active?'#c17f3c':'#ccc', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left:form.active?20:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }}/>
              </div>
              <span style={{ fontSize:14, color:'#5a4a3a' }}>Show in POS</span>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'14px', borderRadius:13, border:'none', background:saving?'#888':'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
              </button>
              <button onClick={()=>setShowForm(false)} style={{ padding:'14px 20px', borderRadius:13, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width:'100%', padding:'11px 14px', borderRadius:11, border:'1.5px solid #e0d5c8', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00' };

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, letterSpacing:0.5, fontWeight:600 }}>{label}</label>
      {children}
    </div>
  );
}

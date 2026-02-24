import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

export default function Settings() {
  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.getFull();
        setForm(res.data.data);
      } catch { toast.error('Failed to load settings'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const save = async () => {
    if (!form.cafeName) return toast.error('Café name required');
    setSaving(true);
    try {
      await settingsAPI.update(form);
      toast.success('✅ Settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign:'center', paddingTop:80, color:'#c9a96e', fontSize:32 }}>⏳</div>;
  if (!form) return null;

  const F = ({ label, k, type='text', placeholder='' }) => (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, letterSpacing:0.5, fontWeight:600 }}>{label}</label>
      <input type={type} value={form[k] || ''} onChange={e => setForm({...form,[k]:e.target.value})} placeholder={placeholder}
        style={{ width:'100%', padding:'11px 14px', borderRadius:11, border:'1.5px solid #e0d5c8', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00', background:'#fff' }}/>
    </div>
  );

  const Toggle = ({ label, k }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
      <div onClick={() => setForm({...form,[k]:!form[k]})} style={{ width:46, height:26, borderRadius:13, background:form[k]?'#c17f3c':'#ccc', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:3, left:form[k]?22:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
      </div>
      <span style={{ fontSize:14, color:'#5a4a3a', fontWeight:500 }}>{label}</span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ background:'#fff', borderRadius:18, padding:'clamp(18px,4vw,26px)', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5' }}>
      <h3 style={{ margin:'0 0 18px', color:'#3d1a00', fontSize:15, letterSpacing:1, paddingBottom:12, borderBottom:'2px solid #f0ebe4', fontFamily:"'Playfair Display',Georgia,serif" }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)' }}>
      <h2 style={{ margin:'0 0 16px', color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(18px,4vw,24px)' }}>⚙️ Settings</h2>

      <div style={{ maxWidth:560 }}>
        <Section title="☕ Café Information">
          <F label="CAFÉ NAME *" k="cafeName"/>
          <F label="ADDRESS" k="address"/>
          <F label="PHONE" k="phone"/>
          <F label="TAGLINE (shown on bill)" k="tagline" placeholder="Sip. Smile. Repeat."/>
        </Section>

        <Section title="💰 Tax & Billing">
          <Toggle label="Enable GST on orders" k="gstEnabled"/>
          {form.gstEnabled && <F label="GST RATE (%)" k="gstRate" type="number"/>}
        </Section>

        <Section title="🖨️ Thermal Printer">
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, letterSpacing:0.5, fontWeight:600 }}>PAPER WIDTH</label>
            <div style={{ display:'flex', gap:12 }}>
              {['58mm','80mm'].map(w => (
                <button key={w} type="button" onClick={()=>setForm({...form,paperWidth:w})} style={{
                  flex:1, padding:'14px', borderRadius:12, fontWeight:700,
                  fontFamily:"'DM Sans',sans-serif", cursor:'pointer', fontSize:15,
                  border:`2.5px solid ${form.paperWidth===w?'#c17f3c':'#e0d5c8'}`,
                  background:form.paperWidth===w?'#fff8ef':'#faf8f5',
                  color:form.paperWidth===w?'#c17f3c':'#7a6a5a',
                  transition:'all 0.2s',
                }}>{w}</button>
              ))}
            </div>
          </div>
          <div style={{ background:'#fff8ef', borderRadius:12, padding:'12px 16px', border:'1px solid #f0d5a8', fontSize:13, color:'#7a5c3a', lineHeight:1.8 }}>
            <strong>Printer Tips:</strong><br/>
            · Set thermal printer as default printer<br/>
            · Disable headers/footers in print dialog<br/>
            · Set margins to None / Minimum<br/>
            · Select "Save as PDF" to test first
          </div>
        </Section>

        <Section title="🔐 Security">
          <F label="OWNER PIN (4 digits)" k="ownerPin" type="password" placeholder="****"/>
          <p style={{ fontSize:12, color:'#b0a090', marginTop:-8 }}>You'll need this new PIN on your next login.</p>
        </Section>

        <button onClick={save} disabled={saving} style={{
          width:'100%', padding:'16px', borderRadius:14, border:'none',
          background: saving ? '#888' : 'linear-gradient(135deg,#c17f3c,#e8a045)',
          color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer',
          fontFamily:"'DM Sans',sans-serif",
          boxShadow:'0 6px 20px rgba(193,127,60,0.4)',
          marginBottom:32,
        }}>
          {saving ? '⏳ Saving...' : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  );
}

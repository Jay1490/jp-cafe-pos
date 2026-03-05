import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

// When defined inside, React recreates them on every render → input loses focus on each keystroke
const inputStyle = {
  width:'100%', padding:'11px 14px', borderRadius:11,
  border:'1.5px solid #e0d5c8', fontSize:14, outline:'none',
  boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif",
  color:'#3d1a00', background:'#fff',
};

function Section({ title, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:18, padding:'clamp(18px,4vw,26px)', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5' }}>
      <h3 style={{ margin:'0 0 18px', color:'#3d1a00', fontSize:15, letterSpacing:1, paddingBottom:12, borderBottom:'2px solid #f0ebe4', fontFamily:"'Playfair Display',Georgia,serif" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, letterSpacing:0.5, fontWeight:600 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

export default function Settings() {
  const [cafeName, setCafeName] = useState('');
  const [address,  setAddress]  = useState('');
  const [phone,    setPhone]    = useState('');
  const [tagline,  setTagline]  = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.getFull();
        const d = res.data.data;
        setCafeName(d.cafeName || '');
        setAddress(d.address   || '');
        setPhone(d.phone       || '');
        setTagline(d.tagline   || '');
        setOwnerPin(d.ownerPin || '');
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    if (!cafeName.trim()) return toast.error('Café name is required');
    if (ownerPin && ownerPin.length !== 4) return toast.error('PIN must be exactly 4 digits');
    setSaving(true);
    try {
      await settingsAPI.update({ cafeName, address, phone, tagline, ownerPin, gstEnabled: false, gstRate: 0 });
      toast.success('✅ Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign:'center', paddingTop:80, color:'#c9a96e', fontSize:32 }}>⏳</div>;

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)' }}>
      <h2 style={{ margin:'0 0 16px', color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(18px,4vw,24px)' }}>
        ⚙️ Settings
      </h2>

      <div style={{ maxWidth:560 }}>

        <Section title="☕ Café Information">
          <Field label="CAFÉ NAME *"          value={cafeName} onChange={setCafeName} />
          <Field label="ADDRESS"              value={address}  onChange={setAddress}  placeholder="Near Main Square, City" />
          <Field label="PHONE"                value={phone}    onChange={setPhone}    placeholder="+91 98765 43210" />
          <Field label="TAGLINE (on receipt)" value={tagline}  onChange={setTagline}  placeholder="Sip. Smile. Repeat." />
        </Section>

        <Section title="🔐 Security">
          <Field label="OWNER PIN (4 digits)" value={ownerPin} onChange={setOwnerPin} type="password" placeholder="****" />
          <p style={{ fontSize:12, color:'#b0a090', marginTop:-8, marginBottom:0 }}>
            You'll need this PIN on your next login.
          </p>
        </Section>

        <button onClick={save} disabled={saving} style={{
          width:'100%', padding:'16px', borderRadius:14, border:'none',
          background: saving ? '#888' : 'linear-gradient(135deg,#c17f3c,#e8a045)',
          color:'#fff', fontSize:16, fontWeight:700,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily:"'DM Sans',sans-serif",
          boxShadow:'0 6px 20px rgba(193,127,60,0.4)',
          marginBottom:32,
        }}>
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
}

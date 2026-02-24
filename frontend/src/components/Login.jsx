import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const styles = {
  container: {
    minHeight: '100dvh',
    background: 'linear-gradient(145deg, #1a0800 0%, #3d1a00 50%, #1f0e00 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    position: 'relative',
    overflow: 'hidden',
  },
};

export default function Login() {
  const { login, cafeName } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const tap = async (k) => {
    if (loading) return;
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    const np = pin + k;
    setPin(np);
    if (np.length === 4) {
      setLoading(true);
      try {
        await login(np);
        toast.success('Welcome back! ☕');
      } catch (err) {
        const msg = err.response?.data?.message || 'Wrong PIN';
        toast.error(msg);
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); setLoading(false); }, 800);
      }
    }
  };

  const keys = [['1','2','3'],['4','5','6'],['7','8','9'],['⌫','0','✓']];

  return (
    <div style={styles.container}>
      {/* Decorative orbs */}
      {[{s:350,x:'-15%',y:'-15%',o:0.04},{s:250,x:'75%',y:'65%',o:0.05},{s:120,x:'65%',y:'5%',o:0.07}].map((c,i)=>(
        <div key={i} style={{position:'absolute',width:c.s,height:c.s,borderRadius:'50%',background:'#f5c842',opacity:c.o,left:c.x,top:c.y,pointerEvents:'none',filter:'blur(20px)'}}/>
      ))}

      <div style={{textAlign:'center',position:'relative',zIndex:1,width:'100%',maxWidth:340}}>
        {/* Logo */}
        <div style={{fontSize:64,marginBottom:8,filter:'drop-shadow(0 4px 16px rgba(245,200,66,0.4))'}}>☕</div>
        <h1 style={{
          fontFamily:"'Playfair Display', Georgia, serif",
          fontSize:'clamp(28px, 8vw, 42px)',
          fontWeight:900, letterSpacing:5,
          color:'#f5c842', margin:'0 0 6px',
          textShadow:'0 2px 20px rgba(245,200,66,0.3)'
        }}>{cafeName}</h1>
        <p style={{color:'#c9a96e',marginBottom:36,fontSize:12,letterSpacing:3,textTransform:'uppercase'}}>
          Point of Sale System
        </p>

        {/* Card */}
        <div style={{
          background:'rgba(255,255,255,0.06)',
          backdropFilter:'blur(20px)',
          border:'1px solid rgba(245,200,66,0.15)',
          borderRadius:24,
          padding:'clamp(24px, 5vw, 36px) clamp(20px, 6vw, 40px)',
          boxShadow:'0 25px 60px rgba(0,0,0,0.5)',
        }}>
          <p style={{color:'#c9a96e',fontSize:11,marginBottom:20,letterSpacing:2}}>ENTER OWNER PIN</p>

          {/* Dots */}
          <div style={{
            display:'flex',gap:16,justifyContent:'center',marginBottom:28,
            animation: shake ? 'shake 0.4s ease' : 'none',
          }}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{
                width:18,height:18,borderRadius:'50%',
                background:pin.length>i?'#f5c842':'rgba(255,255,255,0.12)',
                transition:'all 0.2s',
                border:'2px solid rgba(245,200,66,0.35)',
                boxShadow:pin.length>i?'0 0 14px rgba(245,200,66,0.6)':'none',
              }}/>
            ))}
          </div>

          {/* Keypad */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {keys.flat().map(k=>(
              <button key={k} onClick={()=>tap(k)} disabled={loading}
                style={{
                  padding:'clamp(14px,4vw,20px) 0',
                  fontSize: k==='⌫'?20:'clamp(18px,5vw,24px)',
                  fontWeight:700,
                  background: k==='✓'?'#f5c842': k==='⌫'?'rgba(255,70,70,0.15)':'rgba(255,255,255,0.08)',
                  color: k==='✓'?'#1a0800':'#fff',
                  border:`1px solid ${k==='✓'?'#f5c842':'rgba(255,255,255,0.1)'}`,
                  borderRadius:14,cursor:'pointer',
                  transition:'all 0.15s',
                  fontFamily:"'DM Sans', sans-serif",
                  boxShadow: k==='✓'?'0 4px 18px rgba(245,200,66,0.4)':'none',
                  touchAction:'manipulation',
                }}
                onPointerDown={e=>{ e.currentTarget.style.transform='scale(0.88)'; e.currentTarget.style.opacity='0.8'; }}
                onPointerUp={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.opacity='1'; }}
                onPointerLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.opacity='1'; }}
              >
                {loading && k==='✓' ? '...' : k}
              </button>
            ))}
          </div>

          <p style={{color:'rgba(201,169,110,0.4)',fontSize:11,marginTop:24}}>
            Default PIN: 1234 · Change in Settings
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-10px)}
          40%,80%{transform:translateX(10px)}
        }
      `}</style>
    </div>
  );
}

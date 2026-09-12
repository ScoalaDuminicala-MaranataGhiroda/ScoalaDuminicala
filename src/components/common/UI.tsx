import { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Componente UI de bază, refolosite peste tot în aplicație.
// Stil minimalist, responsive, fără dependențe CSS externe.
// ---------------------------------------------------------------------------

export function Buton({
  children,
  variant = 'primar',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primar' | 'secundar' | 'pericol' | 'text';
}) {
  const stiluri: Record<string, React.CSSProperties> = {
    primar: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb' },
    secundar: { background: '#fff', color: '#1f2937', border: '1px solid #d1d5db' },
    pericol: { background: '#dc2626', color: '#fff', border: '1px solid #dc2626' },
    text: { background: 'transparent', color: '#2563eb', border: 'none', padding: '4px 8px' },
  };
  return (
    <button
      {...rest}
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 500,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.6 : 1,
        ...stiluri[variant],
        ...rest.style,
      }}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement> & { eticheta?: string }) {
  const { eticheta, style, ...rest } = props;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {eticheta && <span style={{ fontSize: 13, color: '#4b5563' }}>{eticheta}</span>}
      <input
        {...rest}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontSize: 15,
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
      />
    </label>
  );
}

export function Select({
  eticheta,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { eticheta?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {eticheta && <span style={{ fontSize: 13, color: '#4b5563' }}>{eticheta}</span>}
      <select
        {...rest}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontSize: 15,
          width: '100%',
          boxSizing: 'border-box',
          background: '#fff',
        }}
      >
        {children}
      </select>
    </label>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({ texte, culoareFundal, culoareText }: { texte: string; culoareFundal: string; culoareText: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        background: culoareFundal,
        color: culoareText,
        whiteSpace: 'nowrap',
      }}
    >
      {texte}
    </span>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid #e5e7eb',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'sd-spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes sd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Modal({
  titlu,
  onClose,
  children,
  latime = 480,
}: {
  titlu: string;
  onClose: () => void;
  children: ReactNode;
  latime?: number;
}) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: latime,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{titlu}</h2>
          <button
            onClick={onClose}
            aria-label="Închide"
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirmare({
  titlu,
  mesaj,
  onConfirma,
  onAnuleaza,
  pericol = false,
}: {
  titlu: string;
  mesaj: string;
  onConfirma: () => void;
  onAnuleaza: () => void;
  pericol?: boolean;
}) {
  return (
    <Modal titlu={titlu} onClose={onAnuleaza} latime={400}>
      <p style={{ color: '#4b5563', marginTop: 0 }}>{mesaj}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <Buton variant="secundar" onClick={onAnuleaza}>Anulează</Buton>
        <Buton variant={pericol ? 'pericol' : 'primar'} onClick={onConfirma}>Confirmă</Buton>
      </div>
    </Modal>
  );
}

export function Alerta({ tip, mesaj }: { tip: 'eroare' | 'succes' | 'info'; mesaj: string }) {
  const culori = {
    eroare: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    succes: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    info: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  }[tip];
  return (
    <div
      style={{
        background: culori.bg,
        color: culori.text,
        border: `1px solid ${culori.border}`,
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 14,
      }}
    >
      {mesaj}
    </div>
  );
}

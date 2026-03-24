const styles = {
  root: {
    background: '#000000',
    color: '#FFFFFF',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  heading: {
    fontFamily: 'Syne, sans-serif',
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800,
    margin: '0 0 1rem',
    background: 'linear-gradient(135deg, #4A2574, #9E72C3)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subheading: {
    fontSize: '1.125rem',
    color: '#9E72C3',
    margin: '0 0 2.5rem',
    maxWidth: '480px',
  },
  form: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    width: '100%',
    maxWidth: '560px',
  },
  input: {
    flex: 1,
    minWidth: '220px',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    border: '1px solid #4A2574',
    background: '#111',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #4A2574, #9E72C3)',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  badge: {
    marginTop: '3rem',
    fontSize: '0.8rem',
    color: '#555',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
} as const;

export default function App() {
  return (
    <main style={styles.root}>
      <h1 style={styles.heading}>Is your website invisible to AI?</h1>
      <p style={styles.subheading}>
        Find out in 60 seconds — free. No signup required.
      </p>
      <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
        <input
          style={styles.input}
          type="url"
          placeholder="https://yourcompany.com"
          aria-label="Website URL"
        />
        <button style={styles.button} type="submit">
          Run Free Audit →
        </button>
      </form>
      <p style={styles.badge}>Trusted by founders · Powered by AI</p>
    </main>
  );
}

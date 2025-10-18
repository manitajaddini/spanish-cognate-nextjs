import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/globals.module.css';

export default function Home() {
  const [word, setWord] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Register the service worker and handle install prompt
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .catch((err) => console.error('Service Worker registration failed:', err));
      });
    }
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log('User response to the install prompt:', outcome);
    setInstallPrompt(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cognate?word=${encodeURIComponent(word.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.cognate) {
          setResult(data.cognate);
        }
      } else {
        setResult('Error fetching cognate');
      }
    } catch (err) {
      setResult('Error fetching cognate');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Spanish Cognate Finder</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fdd835" />
      </Head>
      <header className={styles.header}>
        <h1>Spanish Cognate Finder</h1>
        <p>Enter a Spanish word to see its English cognate.</p>
      </header>
      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g., nación"
            required
            className={styles.input}
          />
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Searching…' : 'Find Cognate'}
          </button>
        </form>
        {result && (
          <section className={styles.resultContainer}>
            <h2>Result</h2>
            <p>{result}</p>
          </section>
        )}
      </main>
      <footer className={styles.footer}>
        {installPrompt && (
          <button onClick={handleInstall} className={styles.installButton}>
            Install App
          </button>
        )}
      </footer>
    </>
  );
}

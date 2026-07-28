"use client";

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Pricing.module.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <>
      <Header />
      <main className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.title} style={{ color: '#00ffa3' }}>100% Free. Forever.</h1>
          <p className={styles.subtitle} style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem', lineHeight: '1.6' }}>
            Relay was built to make peer-to-peer file sharing accessible, fast, and completely free for everyone in the world. No file size limits. No hidden fees. No premium tiers.
          </p>
        </motion.div>

        <motion.div 
          style={{ 
            background: 'var(--surface-bg)', 
            border: '4px solid var(--text-primary)',
            boxShadow: '8px 8px 0 var(--accent-primary)',
            padding: '3rem',
            borderRadius: '16px',
            maxWidth: '600px',
            margin: '4rem auto',
            textAlign: 'center'
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '1rem' }}>Support the Project</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            If you love using Relay and want to help keep the servers running, you can donate below! Your support means everything.
          </p>
          
          <div style={{ 
            background: 'var(--bg-color)', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            border: '2px dashed var(--text-secondary)',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Maribank Transfer
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
              09631030280
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem' }}>
              KZYUBE NAPOLES
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}

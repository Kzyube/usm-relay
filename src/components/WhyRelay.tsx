"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import styles from './WhyRelay.module.css';

const ArchitectureAnimation = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', width: '100%', maxWidth: '800px', margin: '0 auto 4rem auto', padding: '2rem', background: '#0a0a0a', borderRadius: '24px', border: '1px solid #222' }}>
      
      {/* TRADITIONAL WAY */}
      <div>
        <h4 style={{ color: '#ff3366', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 800 }}>The Traditional Way</h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          
          <div style={{ zIndex: 2, padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '12px', color: 'white' }}>Your PC</div>
          
          <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: '#333', zIndex: 1 }} />
          
          <motion.div 
            style={{ zIndex: 3, width: '20px', height: '20px', background: '#ff3366', borderRadius: '50%', position: 'absolute', top: 'calc(50% - 10px)' }}
            animate={{ left: ['10%', '50%', '50%', '90%'], opacity: [1, 1, 0.5, 1] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, times: [0, 0.4, 0.6, 1] }}
          />

          <div style={{ zIndex: 2, padding: '1rem 2rem', background: '#222', border: '1px solid #ff3366', borderRadius: '12px', color: '#ff3366', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span>Cloud Server</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.2rem' }}>(Storing & Scanning)</span>
          </div>
          
          <div style={{ zIndex: 2, padding: '1rem', background: '#111', border: '1px solid #333', borderRadius: '12px', color: 'white' }}>Friend's PC</div>
        </div>
      </div>

      {/* RELAY WAY */}
      <div>
        <h4 style={{ color: '#00ffa3', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 800 }}>The Relay Way</h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          
          <div style={{ zIndex: 2, padding: '1rem', background: '#111', border: '1px solid #00ffa3', borderRadius: '12px', color: 'white' }}>Your PC</div>
          
          <div style={{ position: 'absolute', top: '50%', left: '15%', right: '15%', height: '2px', background: '#111', zIndex: 1 }} />
          
          <motion.div 
            style={{ position: 'absolute', top: 'calc(50% - 2px)', left: '15%', height: '4px', background: 'linear-gradient(90deg, transparent, #00ffa3)', zIndex: 3, transformOrigin: 'left' }}
            animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, ease: "circIn", repeat: Infinity }}
          />

          <div style={{ zIndex: 2, padding: '1rem', background: '#111', border: '1px solid #00ffa3', borderRadius: '12px', color: 'white' }}>Friend's PC</div>
        </div>
      </div>

    </div>
  );
};

export default function WhyRelay() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <section className={styles.section}>
      <ArchitectureAnimation />
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <h2 className={styles.title}>Why we built Relay</h2>
        <p className={styles.subtitle}>
          Because uploading a 5GB video to Google Drive just to send it to the person sitting next to you is ridiculous. 
        </p>
      </motion.div>

      <motion.div 
        className={styles.comparisonGrid}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* The Old Way */}
        <motion.div variants={itemVariants} className={styles.legacyCard}>
          <div className={styles.cardHeader}>
            <AlertTriangle className={styles.legacyIcon} size={32} />
            <h3>The Old Way (Google Drive, Dropbox)</h3>
          </div>
          <ul className={styles.list}>
            <li>
              <XCircle size={20} className={styles.xIcon} />
              <span><strong>The "Storage Full" Trap:</strong> You run out of space, and suddenly you're forced to pay a $10/month subscription just to send one file.</span>
            </li>
            <li>
              <XCircle size={20} className={styles.xIcon} />
              <span><strong>Double the waiting time:</strong> You have to wait 20 minutes to upload the file to their servers, and your friend has to wait 20 minutes to download it. Why?</span>
            </li>
            <li>
              <XCircle size={20} className={styles.xIcon} />
              <span><strong>Privacy nightmare:</strong> Your private files sit on a massive corporate server forever, being scanned by algorithms.</span>
            </li>
          </ul>
        </motion.div>

        {/* The Relay Way */}
        <motion.div variants={itemVariants} className={styles.relayCard}>
          <div className={styles.cardHeader}>
            <ShieldCheck className={styles.relayIcon} size={32} />
            <h3>The Relay Way (Direct P2P)</h3>
          </div>
          <ul className={styles.list}>
            <li>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span><strong>Send Absolutely Anything:</strong> A 1MB photo or a 500GB 8K video project? We literally don't care. No limits. No subscriptions.</span>
            </li>
            <li>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span><strong>Lightning Fast:</strong> We punch a hole through the internet and connect your computer directly to your friend's. It streams instantly.</span>
            </li>
            <li>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span><strong>Military Grade Security:</strong> Your files never touch our servers. We use WebRTC encryption to lock your data safely in transit.</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>

      <motion.div 
        className={styles.noCatchWrapper}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ delay: 0.4 }}
      >
        <div className={styles.noCatchBox}>
          <h2 className={styles.noCatchTitle}>Wait, so what's the catch?</h2>
          <p className={styles.noCatchDesc}>
            There is none. How can we give you unlimited file sharing for free? Simple: <strong>We don't store your files.</strong> Other websites charge you money because they have to buy massive server farms to store your uploads. Relay just creates a direct encrypted tunnel between you and your friend. Since we don't store anything, our server costs are practically zero. You get an incredibly fast tool, and we don't go bankrupt. Win-win.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

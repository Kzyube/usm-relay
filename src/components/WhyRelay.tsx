"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import styles from './WhyRelay.module.css';

const ArchitectureAnimation = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '3rem', 
      width: '100%', 
      maxWidth: '900px', 
      margin: '0 auto 4rem auto', 
      padding: '3rem 2rem', 
      background: 'rgba(255, 255, 255, 0.02)', 
      backdropFilter: 'blur(20px)',
      borderRadius: '24px', 
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
    }}>
      
      {/* TRADITIONAL WAY */}
      <div style={{ position: 'relative' }}>
        <h4 style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '4px', marginBottom: '2rem', textAlign: 'center', fontWeight: 600 }}>The Traditional Way</h4>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          
          {/* Nodes */}
          <div style={{ zIndex: 2, padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontWeight: 500 }}>Your PC</div>
          
          {/* SVG Background Path */}
          <svg style={{ position: 'absolute', top: '50%', left: '10%', width: '80%', height: '100px', overflow: 'visible', transform: 'translateY(-50%)', zIndex: 1 }}>
            <path d="M 0 50 Q 50% -50 50% 50 T 100% 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="6 6" />
            
            {/* Animated Dot */}
            <motion.circle 
              r="6" 
              fill="#ff3366" 
              style={{ filter: 'drop-shadow(0 0 10px #ff3366)' }}
              animate={{ 
                offsetDistance: ["0%", "100%"]
              }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            >
              <animateMotion dur="4s" repeatCount="indefinite" path="M 0 50 Q 50% -50 50% 50 T 100% 50" />
            </motion.circle>
          </svg>

          {/* Cloud Server (Center) */}
          <motion.div 
            animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0 rgba(255,51,102,0)', '0 0 40px rgba(255,51,102,0.2)', '0 0 0 rgba(255,51,102,0)'] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ zIndex: 2, padding: '1.5rem', background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.3)', borderRadius: '16px', color: '#ff3366', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', backdropFilter: 'blur(10px)' }}
          >
            <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
            <span>Cloud Server</span>
          </motion.div>
          
          <div style={{ zIndex: 2, padding: '1.2rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontWeight: 500 }}>Friend</div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '1rem 0' }} />

      {/* RELAY WAY */}
      <div style={{ position: 'relative' }}>
        <h4 style={{ color: '#00ffa3', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '4px', marginBottom: '2rem', textAlign: 'center', fontWeight: 700 }}>The Relay Way</h4>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          
          <div style={{ zIndex: 2, padding: '1.2rem', background: 'rgba(0, 255, 163, 0.05)', border: '1px solid rgba(0, 255, 163, 0.3)', borderRadius: '16px', color: '#00ffa3', fontWeight: 600 }}>Your PC</div>
          
          {/* Laser Beam Container */}
          <div style={{ position: 'absolute', top: '50%', left: '15%', right: '15%', height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          
          {/* Glowing Laser */}
          <motion.div 
            style={{ 
              position: 'absolute', 
              top: 'calc(50% - 2px)', 
              left: '15%', 
              right: '15%', 
              height: '4px', 
              background: 'linear-gradient(90deg, transparent, #00ffa3, transparent)', 
              zIndex: 3,
              boxShadow: '0 0 20px #00ffa3',
              borderRadius: '10px'
            }}
            animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
            transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
          />

          <div style={{ zIndex: 2, padding: '1.2rem', background: 'rgba(0, 255, 163, 0.05)', border: '1px solid rgba(0, 255, 163, 0.3)', borderRadius: '16px', color: '#00ffa3', fontWeight: 600 }}>Friend</div>
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
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

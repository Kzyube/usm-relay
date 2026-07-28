"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import styles from './WhyRelay.module.css';

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

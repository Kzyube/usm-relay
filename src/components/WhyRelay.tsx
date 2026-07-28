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
        <h2 className={styles.title}>Why We Built Relay</h2>
        <p className={styles.subtitle}>
          File sharing is broken. We wanted a simple, free way to send big files instantly.
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
            <h3>The Old Way (Cloud Apps)</h3>
          </div>
          <ul className={styles.list}>
            <li>
              <XCircle size={20} className={styles.xIcon} />
              <span><strong>File Size Limits:</strong> Most apps won't let you send files larger than 2GB for free.</span>
            </li>
            <li>
              <XCircle size={20} className={styles.xIcon} />
              <span><strong>It takes twice as long:</strong> You have to upload it to their servers, and then your friend has to download it.</span>
            </li>
            <li>
              <XCircle size={20} className={styles.xIcon} />
              <span><strong>Privacy Risks:</strong> Your files sit on someone else's computer. They can look at it or lose it.</span>
            </li>
          </ul>
        </motion.div>

        {/* The Relay Way */}
        <motion.div variants={itemVariants} className={styles.relayCard}>
          <div className={styles.cardHeader}>
            <ShieldCheck className={styles.relayIcon} size={32} />
            <h3>The Relay Way (Direct)</h3>
          </div>
          <ul className={styles.list}>
            <li>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span><strong>Send Anything:</strong> 1MB or 1,000GB? It doesn't matter. We don't care how big your file is.</span>
            </li>
            <li>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span><strong>Lightning Fast:</strong> We connect your computer directly to your friend's computer. It's the fastest way possible.</span>
            </li>
            <li>
              <CheckCircle2 size={20} className={styles.checkIcon} />
              <span><strong>Super Safe:</strong> Your files never touch our servers. They are locked safely and go straight to your friend.</span>
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
          <h2 className={styles.noCatchTitle}>Wait, what's the catch?</h2>
          <p className={styles.noCatchDesc}>
            There is no catch! How can we give you unlimited file sharing for free? Simple: <strong>We don't store your files.</strong> Other websites charge you money because they have to pay for huge hard drives to store your uploads. Relay just creates a direct tunnel between you and your friend. Since we don't store anything, our costs are practically zero. You get a fast, free tool, and we don't go broke!
          </p>
        </div>
      </motion.div>
    </section>
  );
}

"use client";

import React from 'react';
import styles from './Hero.module.css';
import { ArrowRight, Zap, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import TransferDashboard from './TransferDashboard';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.grid}>
        
        <motion.div 
          className={styles.content}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className={styles.badge}>
            <Zap size={14} />
            <span>V3.0 PROTOCOL LIVE</span>
          </div>
          
          <h1 className={styles.title}>
            The Ultimate<br/>File Relay Engine.
          </h1>
          
          <p className={styles.subtitle}>
            Bypass the cloud. Share multi-gigabyte files directly between devices using advanced WebRTC NAT traversal and military-grade AES-256 encryption. Zero limits, maximum velocity.
          </p>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={() => {
              document.getElementById('transfer-widget')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Start Relay <ArrowRight size={18} />
            </button>
            <button className={styles.secondaryBtn}>
              <Terminal size={18} />
              Read Docs
            </button>
          </div>
        </motion.div>

        <motion.div 
          className={styles.visual}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className={styles.visualBackground} />
          <div className={styles.widgetContainer}>
            <TransferDashboard />
          </div>
        </motion.div>

      </div>
    </section>
  );
}

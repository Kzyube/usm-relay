"use client";

import React from 'react';
import { Shield, Zap, Infinity, Globe, Network, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Features.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "linear" as const } }
};

export default function Features() {
  return (
    <section id="features" className={styles.section}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <h2 className={styles.title}>HOW IT WORKS.</h2>
      </motion.div>
      
      <motion.div 
        className={styles.bentoGrid}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        
        {/* Large Card */}
        <motion.div variants={itemVariants} className={`${styles.card} ${styles.large}`}>
          <div className={styles.terminalCode}>
{`SYS.INIT: CONNECTED
> TUNNEL ESTABLISHED
> PING: 12ms`}
          </div>
          <div>
            <div className={styles.iconWrapper}>
              <Network size={32} />
            </div>
            <h3 className={styles.cardTitle}>Direct Connection</h3>
            <p className={styles.cardDesc}>
              When you send a file, your computer talks directly to your friend's computer. It doesn't upload to a server first. This makes it instantly faster.
            </p>
          </div>
        </motion.div>

        {/* Tall Card */}
        <motion.div variants={itemVariants} className={`${styles.card} ${styles.tall}`} style={{ background: 'var(--accent-secondary)', color: 'var(--surface-bg)', borderColor: 'var(--accent-secondary)' }}>
          <div>
            <div className={styles.iconWrapper} style={{ background: 'var(--surface-bg)', color: 'var(--accent-secondary)' }}>
              <LockKeyhole size={32} />
            </div>
            <h3 className={styles.cardTitle} style={{ color: 'var(--surface-bg)' }}>Super Private</h3>
            <p className={styles.cardDesc} style={{ color: 'var(--surface-bg)', opacity: 0.9 }}>
              Your files are scrambled (encrypted) before they even leave your computer. We couldn't look at your files even if we wanted to.
            </p>
          </div>
        </motion.div>

        {/* Wide Card */}
        <motion.div variants={itemVariants} className={`${styles.card} ${styles.wide}`} style={{ background: 'var(--accent-tertiary)', borderColor: 'var(--text-primary)' }}>
          <div>
            <div className={styles.iconWrapper} style={{ background: 'var(--text-primary)', color: 'var(--accent-tertiary)' }}>
              <Infinity size={32} />
            </div>
            <h3 className={styles.cardTitle} style={{ color: 'var(--text-primary)' }}>No Size Limits</h3>
            <p className={styles.cardDesc} style={{ color: 'var(--text-primary)' }}>
              Because we don't store your files, we don't have to limit how much you send. Send a massive 50GB video folder just as easily as a small picture.
            </p>
          </div>
        </motion.div>

        {/* Standard Card 1 */}
        <motion.div variants={itemVariants} className={`${styles.card} ${styles.standard}`} style={{ background: 'var(--accent-quaternary)', color: 'var(--surface-bg)', borderColor: 'var(--text-primary)' }}>
          <div>
            <div className={styles.iconWrapper} style={{ background: 'var(--surface-bg)', color: 'var(--accent-quaternary)' }}>
              <Zap size={32} />
            </div>
            <h3 className={styles.cardTitle} style={{ color: 'var(--surface-bg)' }}>Lightning Fast</h3>
            <p className={styles.cardDesc} style={{ color: 'var(--surface-bg)', opacity: 0.9 }}>
              Goes as fast as your Wi-Fi will allow. No artificial slowing down.
            </p>
          </div>
        </motion.div>

        {/* Standard Card 2 */}
        <motion.div variants={itemVariants} className={`${styles.card} ${styles.standard}`}>
          <div>
            <div className={styles.iconWrapper}>
              <Globe size={32} />
            </div>
            <h3 className={styles.cardTitle}>Works Everywhere</h3>
            <p className={styles.cardDesc}>
              No apps to install. It just works right in your web browser.
            </p>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}

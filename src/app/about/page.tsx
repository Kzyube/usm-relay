"use client";

import React from 'react';
import { Cpu, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './About.module.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.title}>Re-decentralizing<br/>the Internet.</h1>
          <p className={styles.lead}>
            We believe that moving data between two computers in the same room shouldn't require sending it to a data center 1,000 miles away. Our mission is to build the ultimate peer-to-peer relay engine, bypassing the cloud to give you absolute speed and privacy.
          </p>
        </motion.div>

        <div className={styles.missionGrid}>
          <div className={styles.missionCard}>
            <div className={styles.iconWrapper}>
              <Cpu size={32} />
            </div>
            <h3 className={styles.cardTitle}>No Cloud Storage</h3>
            <p className={styles.cardDesc}>
              We built Relay so you don't have to use slow cloud servers. By connecting your computer straight to your friend's computer, we skip the middleman. This means faster speeds and no confusing storage limits.
            </p>
          </div>

          <div className={styles.missionCard} style={{ background: 'var(--accent-primary)', color: 'var(--surface-bg)', borderColor: 'var(--accent-primary)' }}>
            <div className={styles.iconWrapper} style={{ background: 'var(--surface-bg)', color: 'var(--accent-primary)' }}>
              <Users size={32} />
            </div>
            <h3 className={styles.cardTitle} style={{ color: 'var(--surface-bg)' }}>Total Privacy</h3>
            <p className={styles.cardDesc} style={{ color: 'var(--surface-bg)', opacity: 0.9 }}>
              Privacy shouldn't be complicated. Every single file you send is locked and scrambled before it even leaves your device. Even if we wanted to peek at your files, we can't! Only the person receiving them can unlock them.
            </p>
          </div>
        </div>

        <motion.div 
          className={styles.creatorSection}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className={styles.creatorCard}>
            <div className={styles.avatar}>KN</div>
            <h2 className={styles.creatorName}>KZYUBE N. NAPOLES</h2>
            <p className={styles.creatorRole}>Sole Developer & Architect</p>
            <p className={styles.creatorBio}>
              Relay was built to solve a simple problem: sending big files securely shouldn't be so hard. Built with a passion for keeping the web free, open, and fast.
            </p>
            
            <div className={styles.socialLinks}>
              <a href="https://www.facebook.com/kzyubepogs" target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                FACEBOOK
              </a>
              <a href="mailto:nkzyuben@gmail.com" className={styles.socialBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                EMAIL
              </a>
            </div>

            <button className={styles.donateBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              SUPPORT THE PROJECT
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}

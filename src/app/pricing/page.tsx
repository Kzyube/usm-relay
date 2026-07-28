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
          <h1 className={styles.title}>Simple, Transparent Pricing</h1>
          <p className={styles.subtitle}>
            Relay is free for standard P2P transfers. Upgrade to Pro for persistent TURN servers and advanced team management features.
          </p>
        </motion.div>

        <motion.div 
          className={styles.toggleContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className={`${styles.toggleLabel} ${!isYearly ? styles.active : ''}`}>Monthly</span>
          <div className={styles.toggle} onClick={() => setIsYearly(!isYearly)}>
            <div className={`${styles.toggleKnob} ${isYearly ? styles.yearly : ''}`} />
          </div>
          <span className={`${styles.toggleLabel} ${isYearly ? styles.active : ''}`}>Yearly (Save 20%)</span>
        </motion.div>

        <div className={styles.pricingGrid}>
          
          {/* Free Tier */}
          <motion.div 
            className={styles.pricingCard}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className={styles.tierName}>Starter</h3>
            <p className={styles.tierDesc}>Perfect for sending files to friends.</p>
            <div className={styles.price}>
              $0 <span>/ forever</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Unlimited File Size</li>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Super Safe Encryption</li>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Free Public Servers</li>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Community Help</li>
            </ul>
            <button className={styles.primaryBtn}>Start Using Relay</button>
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            className={`${styles.pricingCard} ${styles.featured}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.featuredBadge}>Great for Teams</div>
            <h3 className={styles.tierName}>Pro</h3>
            <p className={styles.tierDesc}>For people who send big files for work.</p>
            <div className={styles.price}>
              ${isYearly ? '9' : '12'} <span>/ month</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Everything in Starter</li>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Dedicated High-Speed Servers</li>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Add Your Own Logo</li>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> 24/7 Email Support</li>
              <li className={styles.featureItem}><Check size={18} className={styles.featureIcon}/> Save Links for 90 Days</li>
            </ul>
            <button className={`${styles.primaryBtn} ${styles.featuredBtn}`}>Get Pro</button>
          </motion.div>

        </div>
      </main>
      <Footer />
    </>
  );
}

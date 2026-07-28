"use client";

import React, { useState } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className={styles.header}>
        <a href="/" className={styles.logo}>
          RELAY.
        </a>
        
        <button 
          className={`${styles.menuBtn} ${menuOpen ? styles.isOpen : ''}`} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'CLOSE' : 'MENU'}
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            className={styles.fullscreenMenu}
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(100% 0 0% 0)' }}
            transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
          >
            <nav className={styles.navLinks}>
              <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`} onClick={() => setMenuOpen(false)}>
                TRANSFER
              </Link>
              <Link href="/about" className={`${styles.navLink} ${isActive('/about') ? styles.active : ''}`} onClick={() => setMenuOpen(false)}>
                PHILOSOPHY
              </Link>
              <Link href="/donate" className={`${styles.navLink} ${isActive('/donate') ? styles.active : ''}`} onClick={() => setMenuOpen(false)}>
                DONATE
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

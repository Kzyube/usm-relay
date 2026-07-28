import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.brand}>
          RELAY.
        </div>
        
        <div className={styles.links}>
          <a href="#" className={styles.link}>PRIVACY</a>
          <a href="#" className={styles.link}>TERMS</a>
          <a href="#" className={styles.link}>DOCS</a>
          <a href="#" className={styles.link}>GITHUB</a>
        </div>

        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} RELAY PROTOCOL.
        </p>
      </div>
    </footer>
  );
}

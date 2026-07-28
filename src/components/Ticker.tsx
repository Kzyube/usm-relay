import React from 'react';
import styles from './Ticker.module.css';

export default function Ticker() {
  const items = [
    "NO FILE SIZE LIMITS",
    "SUPER PRIVATE",
    "DIRECT CONNECTION",
    "SEND ANYTHING FOR FREE",
    "LIGHTNING FAST",
    "WORKS ON ANY DEVICE"
  ];

  return (
    <div className={styles.tickerWrapper}>
      <div className={styles.tickerContent}>
        {/* Repeat twice for seamless infinite scrolling */}
        {items.map((item, idx) => (
          <div key={`first-${idx}`} className={styles.tickerItem}>{item}</div>
        ))}
        {items.map((item, idx) => (
          <div key={`second-${idx}`} className={styles.tickerItem}>{item}</div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

const faqs = [
  {
    question: "Is there a file size limit?",
    answer: "Absolutely none. Because your files never touch a server, there is no storage limit. You can send a 1MB photo or a 500GB 8K video project. It works exactly the same."
  },
  {
    question: "Are my files stored on a server?",
    answer: "No. Relay uses WebRTC to create a direct peer-to-peer (P2P) connection between you and the receiver. We just help you connect, but we never store, see, or touch your files."
  },
  {
    question: "Is it secure?",
    answer: "Yes. All WebRTC transfers are end-to-end encrypted by default. Additionally, you can password-protect your room and enable the self-destruct feature for absolute privacy."
  },
  {
    question: "Do I need to download an app?",
    answer: "Nope! Relay works entirely in your web browser. There's nothing to install, and no accounts to create."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Frequently Asked</h2>
      <div className={styles.faqList}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className={styles.faqItem}>
              <div 
                className={styles.faqHeader} 
                onClick={() => toggleOpen(index)}
              >
                <span className={styles.question}>{faq.question}</span>
                <ChevronDown 
                  className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} 
                  size={24} 
                  color="var(--accent-secondary)" 
                />
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={styles.answerWrapper}
                  >
                    <div className={styles.answer}>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

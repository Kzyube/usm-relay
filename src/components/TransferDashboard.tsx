"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link as LinkIcon, UploadCloud, ShieldCheck, Zap } from "lucide-react";
import QRCode from "react-qr-code";
import styles from './TransferDashboard.module.css';
import { useWebRTC } from "../hooks/useWebRTC";

type TransferState = "IDLE" | "FILE_PAIRED" | "TRANSFERRING" | "COMPLETE";

export default function TransferDashboard() {
  const [state, setState] = useState<TransferState>("IDLE");
  const [files, setFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  const { 
    connectionState, 
    roomId, 
    error, 
    progress, 
    createRoom, 
    joinRoom, 
    sendFile 
  } = useWebRTC();

  // Extract room parameter from URL for receiver logic
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const roomParam = searchParams?.get('room');

  // Check URL for room code on mount
  useEffect(() => {
    if (roomParam && !roomId && connectionState === 'DISCONNECTED') {
      joinRoom(roomParam);
      // Wait for files to be pushed to us
    }
  }, [joinRoom, roomId, connectionState]);

  // Update UI state based on WebRTC connection state
  useEffect(() => {
    if (connectionState === 'TRANSFERRING') {
      setState("TRANSFERRING");
    } else if (connectionState === 'COMPLETE') {
      // If we are sender and have more files, do NOT set COMPLETE state yet
      if (files.length > 0 && currentFileIndex < files.length - 1) {
        // Do nothing, let the other effect trigger the next file
      } else {
        setState("COMPLETE");
      }
    }
  }, [connectionState, files.length, currentFileIndex]);

  // Trigger send immediately when peer connects if we are the sender
  useEffect(() => {
    if (connectionState === 'PEER_CONNECTED' && files.length > 0 && state === 'FILE_PAIRED') {
      setCurrentFileIndex(0);
      sendFile(files[0]);
    }
  }, [connectionState, files, sendFile, state]);

  // Handle multi-file queueing
  useEffect(() => {
    if (connectionState === 'COMPLETE' && state === 'TRANSFERRING' && files.length > 0) {
      if (currentFileIndex < files.length - 1) {
        const nextIdx = currentFileIndex + 1;
        setCurrentFileIndex(nextIdx);
        // Small delay to ensure receiver has processed the previous file completion
        setTimeout(() => {
          sendFile(files[nextIdx]);
        }, 500);
      }
    }
  }, [connectionState, state, currentFileIndex, files, sendFile]);

  const handleShareClick = () => {
    if (!roomId) createRoom();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      setState("FILE_PAIRED");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      setState("FILE_PAIRED");
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, idx) => idx !== indexToRemove);
      if (newFiles.length === 0) {
        setState("IDLE");
      }
      return newFiles;
    });
  };

  const totalSizeMB = files.reduce((acc, f) => acc + f.size, 0) / 1048576;
  const shareLink = roomId ? `${window.location.origin}/?room=${roomId}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Link copied!");
  };

  // Automatically start transfer if files are selected, or we are just receiver.
  return (
    <div id="transfer-widget" className={styles.wrapper}>
      {error && (
        <div style={{ background: '#ff336622', border: '1px solid #ff3366', color: '#ff3366', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem', fontWeight: 600 }}>
          {error.includes("Room is full, closed, or does not exist") 
            ? "Room expired or sender is offline. Please ask for a new link!" 
            : error}
        </div>
      )}
      
      <AnimatePresence mode="wait">
        
        {/* STATE 1: IDLE */}
        {state === "IDLE" && !roomParam && connectionState !== 'WAITING_FOR_PEER' && connectionState !== 'PEER_CONNECTED' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              className="hidden" 
              id="fileInput" 
              style={{ display: 'none' }}
              onChange={handleFileSelect} 
            />
            <label htmlFor="fileInput" className={styles.giantDropZone}>
              <UploadCloud size={64} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }} />
              <h2 className={styles.giantText}>Drop Files Here<br/>Or Click to Browse</h2>
              <p className={styles.subText}>Fast, free, and secure peer-to-peer transfer.</p>
              
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', color: 'var(--text-secondary)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <ShieldCheck size={18} color="var(--accent-secondary)" /> End-to-End Encrypted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Zap size={18} color="#00ffa3" /> No File Size Limits
                </div>
              </div>
            </label>
          </motion.div>
        )}

        {/* RECEIVER LOADING STATE */}
        {state === "IDLE" && roomParam && connectionState !== 'WAITING_FOR_PEER' && connectionState !== 'PEER_CONNECTED' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.pairedContainer}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div className={styles.spinner} style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-secondary)' }}>
                Connecting to Sender...
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Loading file transfer details.
              </p>
            </div>
          </motion.div>
        )}

        {/* STATE 2: PAIRED (Sender Waiting) */}
        {state === "FILE_PAIRED" && connectionState !== 'TRANSFERRING' && (
          <motion.div 
            key="paired" 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }} 
            className={styles.pairedContainer}
          >
            <div>
              <div className={styles.fileInfo}>{files.length} file{files.length !== 1 ? 's' : ''} ready</div>
              <div className={styles.fileSize}>{totalSizeMB.toFixed(2)} MB total</div>
            </div>

            <div className={styles.fileList}>
              {files.map((f, idx) => (
                <div key={idx} className={styles.fileListItem}>
                  <span className={styles.fileName}>{f.name}</span>
                  <button onClick={() => removeFile(idx)} className={styles.removeBtn} aria-label="Remove file">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {!roomId && (
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '2rem' }}>
                <input 
                  type="file" 
                  className="hidden" 
                  id="addMoreFiles" 
                  style={{ display: 'none' }}
                  onChange={handleFileSelect} 
                />
                <label htmlFor="addMoreFiles" className={styles.secondaryBtn} style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}>
                  ADD MORE
                </label>
                <button onClick={handleShareClick} className={styles.brutalBtn} style={{ flex: 2 }}>
                  {connectionState === 'CONNECTING' ? 'CONNECTING...' : 'SHARE FILES'}
                </button>
              </div>
            )}

            {roomId && (
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <h3 style={{ color: '#aaa', marginBottom: '0.5rem' }}>Scan or Share Link to Receive</h3>
                <p style={{ color: '#ff3366', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                  ⚠️ DO NOT CLOSE THIS TAB UNTIL FINISHED!
                </p>
                <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                  <QRCode value={shareLink} size={160} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={shareLink} 
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', width: '250px' }}
                  />
                  <button onClick={copyLink} className={styles.secondaryBtn} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LinkIcon size={16} /> Copy
                  </button>
                </div>
                <p style={{ marginTop: '1rem', color: '#00ffa3' }}>
                  {connectionState === 'WAITING_FOR_PEER' ? 'Waiting for receiver to join...' : 'Connecting...'}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* STATE 3: TRANSFERRING (Sender or Receiver) */}
        {state === "TRANSFERRING" && (
          <motion.div 
            key="transferring" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className={styles.pairedContainer}
          >
            <div className={styles.transferStatus}>
              {progress?.fileName ? `TRANSFERRING: ${progress.fileName}` : 'STREAMING...'}
              {files.length > 1 && (
                <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>
                  File {currentFileIndex + 1} of {files.length}
                </div>
              )}
            </div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${progress?.progress || 0}%` }} />
              <div className={styles.progressText}>{progress?.progress || 0}%</div>
            </div>
          </motion.div>
        )}

        {/* STATE 4: COMPLETE */}
        {state === "COMPLETE" && (
          <motion.div 
            key="complete" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className={styles.pairedContainer}
          >
            <div className={styles.completeTitle}>DONE.</div>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>
              Transfer successful. {files.length > 0 ? `${files.length} file(s) sent.` : 'Files downloaded automatically.'}
            </p>
            <button onClick={() => { window.location.href = '/'; }} className={styles.resetBtn}>
              AGAIN.
            </button>
          </motion.div>
        )}
        
      </AnimatePresence>
    </div>
  );
}
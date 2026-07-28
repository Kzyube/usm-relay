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
  const [inAppBrowser, setInAppBrowser] = useState(false);
  
  const [password, setPassword] = useState("");
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [receiverPassword, setReceiverPassword] = useState("");
  
  const { 
    connectionState, 
    roomId, 
    error, 
    progress, 
    createRoom, 
    joinRoom, 
    sendFile,
    cancelTransfer
  } = useWebRTC();

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const roomParam = searchParams?.get('room');

  const completeAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isInApp = /FBAV|FBAN|Instagram|Line|MicroMessenger|Snapchat|TikTok|Viber/i.test(ua);
      setInAppBrowser(isInApp);
      
      if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      }
    }
    completeAudio.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3'); // Smooth ding
  }, []);

  // Check URL for room code on mount
  useEffect(() => {
    if (inAppBrowser) return;
    if (roomParam && !roomId && connectionState === 'DISCONNECTED') {
      joinRoom(roomParam);
      // Wait for files to be pushed to us
    }
  }, [joinRoom, roomId, connectionState, roomParam, inAppBrowser]);

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
        if (completeAudio.current) {
           completeAudio.current.play().catch(e => console.log("Audio play blocked by browser:", e));
        }
        if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
           new Notification("RELAY. Transfer Complete!", {
              body: files.length > 0 ? "Your files have been successfully sent." : "Your files have been successfully downloaded."
           });
        }
      }
    } else if (connectionState === 'PEER_CONNECTED' && state === 'TRANSFERRING') {
      // Transfer was cancelled, reset state appropriately
      setState(files.length > 0 ? "FILE_PAIRED" : "IDLE");
    }
  }, [connectionState, files.length, currentFileIndex, state]);

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
    if (!roomId) createRoom(password || undefined, selfDestruct);
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

  if (inAppBrowser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '2rem' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.pairedContainer}
          style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', width: '100%' }}
        >
          <div style={{ background: '#ff3366', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <X size={32} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--accent-primary)', lineHeight: 1.1 }}>
            Works best in system browser!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            You opened this link in an in-app browser (like Messenger or Instagram). These apps strictly block the advanced peer-to-peer technologies required for transferring large files.
          </p>
          <div style={{ background: 'var(--bg-color)', border: '2px solid var(--text-primary)', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>How to fix this instantly:</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tap the menu button <strong style={{color: 'var(--text-primary)'}}>(•••)</strong> in the top corner of your screen, and select <strong style={{color: 'var(--accent-secondary)'}}>"Open in Chrome / Safari"</strong> or <strong>"Open in system browser"</strong>.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Automatically start transfer if files are selected, or we are just receiver.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div id="transfer-widget" className={styles.wrapper}>
        {error && error !== "Invalid password." && (
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
              <h2 className={styles.giantText}>Drop files to transfer</h2>
              <p className={styles.subText} style={{ marginTop: '0.5rem' }}>Secure, unlimited, peer-to-peer.</p>
              
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
        {state === "IDLE" && roomParam && connectionState !== 'WAITING_FOR_PEER' && connectionState !== 'PEER_CONNECTED' && error !== "Invalid password." && (
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

        {/* RECEIVER CONNECTED (WAITING FOR SENDER) */}
        {state === "IDLE" && roomParam && connectionState === 'PEER_CONNECTED' && (
          <motion.div
            key="receiver_connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.pairedContainer}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', color: '#00ffa3' }}>
                CONNECTED!
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.2rem' }}>
                Waiting for sender to start transfer...
              </p>
            </div>
          </motion.div>
        )}

        {/* RECEIVER PASSWORD PROMPT */}
        {error === "Invalid password." && (
          <motion.div
            key="password_prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.pairedContainer}
            style={{ textAlign: 'center' }}
          >
            <ShieldCheck size={48} color="#ff3366" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Protected Room</h2>
            <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>This room requires a password to join.</p>
            <input 
              type="password" 
              placeholder="Enter Password"
              value={receiverPassword}
              onChange={e => setReceiverPassword(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #333', background: '#111', color: 'white', marginBottom: '1rem' }}
            />
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => { joinRoom(roomParam!, receiverPassword); }}
              className={styles.brutalBtn} 
              style={{ width: '100%' }}
            >
              JOIN SECURELY
            </motion.button>
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
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} /> Security Options
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="password" 
                    placeholder="Optional Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid #333', background: '#000', color: 'white', width: '100%' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selfDestruct} 
                      onChange={e => setSelfDestruct(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#ff3366' }}
                    />
                    Self-Destruct room when finished
                  </label>
                </div>
              </div>
            )}

            {!roomId && (
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '2rem' }}>
                <input 
                  type="file" 
                  className="hidden" 
                  id="addMoreFiles" 
                  style={{ display: 'none' }}
                  onChange={handleFileSelect} 
                />
                <motion.label 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  htmlFor="addMoreFiles" 
                  className={styles.secondaryBtn} 
                  style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
                >
                  ADD MORE
                </motion.label>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareClick} 
                  className={styles.brutalBtn} 
                  style={{ flex: 2 }}
                >
                  {connectionState === 'CONNECTING' ? 'CONNECTING...' : 'SHARE FILES'}
                </motion.button>
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
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={copyLink} 
                    className={styles.secondaryBtn} 
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <LinkIcon size={16} /> Copy
                  </motion.button>
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
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ffa3', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', marginTop: '1rem' }}>
              <div>{progress?.speed && progress.speed !== "0.00" ? `${progress.speed} MB/s` : 'Calculating...'}</div>
              <div>{progress?.eta ? `${progress.eta}s remaining` : ''}</div>
            </div>

            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${progress?.progress || 0}%` }} />
              <div className={styles.progressText}>{progress?.progress || 0}%</div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={cancelTransfer}
                className={styles.secondaryBtn} 
                style={{ width: 'auto', padding: '1rem 2rem', color: '#ff3366', borderColor: '#ff3366', boxShadow: '4px 4px 0 #ff3366' }}
              >
                CANCEL TRANSFER
              </motion.button>
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
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = '/'; }} 
              className={styles.resetBtn}
            >
              AGAIN.
            </motion.button>
          </motion.div>
        )}
        
      </AnimatePresence>
      </div>
    </div>
  );
}
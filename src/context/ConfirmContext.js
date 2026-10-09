/**
 * ============================================================================
 * MODULE: Universal Confirmation Context & Hook
 * DIRECTORY: src/context/ConfirmContext.js
 * ROLE/SCOPE: Universal Async Confirmation Provider
 * DESCRIPTION:
 *   Provides an asynchronous confirm() method returning a Promise<boolean>
 *   for all student, faculty, and administrative views. Renders an institutional
 *   ConfirmationModal seamlessly across Web and Native platforms.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. CONTEXT DECLARATION
 *   3. PROVIDER ENGINE (ConfirmProvider)
 *   4. CONSUMER HOOK (useConfirm)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

// ============================================================================
// SECTION 2: CONTEXT DECLARATION
// ============================================================================
const ConfirmContext = createContext(null);

// ============================================================================
// SECTION 3: PROVIDER ENGINE
// ============================================================================
/**
 * Universal Confirmation Provider.
 * Wraps root layout tree and renders a centralized ConfirmationModal dialog.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    visible: false,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: '#DC2626',
    icon: 'alert',
    isDestructive: true,
  });

  const resolverRef = useRef(null);

  /**
   * Prompts the user with a confirmation modal and returns a Promise resolving
   * to true if confirmed or false if cancelled.
   *
   * @param {Object} options
   * @param {string} [options.title='Confirm Action']
   * @param {string} [options.message='Are you sure you want to proceed?']
   * @param {string} [options.confirmText='Confirm']
   * @param {string} [options.cancelText='Cancel']
   * @param {string} [options.confirmColor]
   * @param {string} [options.icon]
   * @param {boolean} [options.isDestructive=true]
   * @returns {Promise<boolean>}
   */
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const isDestructive = options.isDestructive !== false;
      setDialogState({
        visible: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        confirmColor: options.confirmColor || (isDestructive ? '#DC2626' : '#059669'),
        icon: options.icon || (isDestructive ? 'alert' : 'info'),
        isDestructive,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setDialogState((prev) => ({ ...prev, visible: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setDialogState((prev) => ({ ...prev, visible: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationModal
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmColor={dialogState.confirmColor}
        icon={dialogState.icon}
        isDestructive={dialogState.isDestructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

// ============================================================================
// SECTION 4: CONSUMER HOOK
// ============================================================================
/**
 * Hook to consume confirmation dialog actions anywhere in the component hierarchy.
 *
 * Usage:
 *   const { confirm } = useConfirm();
 *   const proceed = await confirm({
 *     title: 'Confirm Logout',
 *     message: 'Terminate active session and return to portal login?',
 *     confirmText: 'Log Out',
 *     icon: 'logout',
 *     confirmColor: '#4F46E5',
 *   });
 *   if (proceed) await logout();
 *
 * @returns {{ confirm: (options: Object) => Promise<boolean> }}
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    return {
      confirm: async ({ title, message }) => {
        if (typeof window !== 'undefined' && window.confirm) {
          return window.confirm(title ? `${title}\n\n${message}` : message);
        }
        return true;
      },
    };
  }
  return context;
}

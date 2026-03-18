/**
 * Copy text to clipboard with fallback for when Clipboard API is blocked
 * @param text The text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Copied to clipboard using Clipboard API');
      return;
    } catch (error) {
      console.warn('⚠️ Clipboard API blocked, trying fallback method...', error);
      // Fall through to fallback method
    }
  }

  // Fallback: Create temporary textarea element
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      
      // Make it invisible
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');
      
      document.body.appendChild(textarea);
      
      // For iOS compatibility
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textarea.setSelectionRange(0, 999999);
      } else {
        textarea.select();
      }
      
      // Execute copy command
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
      
      if (successful) {
        console.log('✅ Copied to clipboard using fallback method');
        resolve();
      } else {
        throw new Error('execCommand copy returned false');
      }
    } catch (err) {
      console.error('❌ All clipboard methods failed:', err);
      reject(new Error('Failed to copy to clipboard. Please copy manually.'));
    }
  });
}

/**
 * Copy text with user-friendly error handling
 * Shows alert on failure with the text to copy manually
 */
export async function copyWithFallbackAlert(text: string, successMessage?: string): Promise<boolean> {
  try {
    await copyToClipboard(text);
    if (successMessage) {
      console.log(successMessage);
    }
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    
    // Show alert with the text so user can copy manually
    const userConfirm = window.confirm(
      `Unable to copy automatically. Would you like to see the link to copy manually?\n\n${text}`
    );
    
    if (userConfirm) {
      // Create a modal or prompt with selectable text
      prompt('Copy this link:', text);
    }
    
    return false;
  }
}

if (typeof firebase === 'undefined') {
  const scripts = [
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics-compat.js",
    "https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js"
  ];
  
  let scriptsLoaded = 0;
  
  function onScriptLoad() {
    scriptsLoaded++;
    if (scriptsLoaded === scripts.length) {
      initializeApp();
    }
  }
  
  scripts.forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = onScriptLoad;
    s.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      scriptsLoaded++;
      if (scriptsLoaded === scripts.length) initializeApp();
    };
    document.head.appendChild(s);
  });
} else {
  initializeApp();
}

function initializeApp() {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCZCAwncuoDuy033ZrEquCwRvYpacBs8xM",
    authDomain: "heartquotecommunity.firebaseapp.com",
    projectId: "heartquotecommunity",
    storageBucket: "heartquotecommunity.firebasestorage.app",
    messagingSenderId: "346084161963",
    appId: "1:346084161963:web:f7ed56dc4a4599f4befaee",
    measurementId: "G-JGKWQP35QB",
    databaseURL: "https://heartquotecommunity-default-rtdb.firebaseio.com/"
  };

  // Local storage keys
  const likedQuotesKey = 'likedQuotes';
  const QUOTE_TEXT_STORAGE_KEY = 'draftQuoteText';
  const REPLY_TEXT_STORAGE_KEY_PREFIX = 'draftReply_';
  const QUOTE_BG_COLOR_STORAGE_KEY = 'draftQuoteBgColor';

  let app, analytics, database;
  
  try {
    app = firebase.initializeApp(firebaseConfig);
    analytics = firebase.analytics();
    database = firebase.database();
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    if (typeof showToast === 'function') {
      showToast("Failed to initialize app: " + error.message, false);
    } else {
      alert("Failed to initialize app: " + error.message);
    }
    return;
  }

  // Prohibited words list
  const prohibitedWords = ['spam', 'badword', 'inappropriate'];

  const quoteBgColor = document.getElementById('quoteBgColor');
  const quoteTextArea = document.getElementById('quoteText');
  let likedQuotes = JSON.parse(localStorage.getItem(likedQuotesKey)) || {};
  let currentAuthor = localStorage.getItem('quoteAuthor') || '';
  let currentQuoteIdForReply = null;
  
  // Initialize author input immediately
  const authorInput = document.getElementById('quoteAuthor');
  if (currentAuthor) {
    authorInput.value = currentAuthor;
    authorInput.readOnly = true;
  }
  function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  }

  // Toggle reply panel
  function toggleReplyPanel(quoteId = null) {
    const panel = document.getElementById('replyPanel');
    
    if (quoteId) {
      currentQuoteIdForReply = quoteId;
      loadReplies(quoteId);
      panel.classList.add('active');
      document.body.style.overflow = "hidden";
    } else {
      panel.classList.remove('active');
      currentQuoteIdForReply = null;
      document.body.style.overflow = "auto";
    }
  }

  // Submit reply function
  function submitReply() {
    if (!currentQuoteIdForReply) return;
    
    const replyText = document.getElementById('reply-text-input').value.trim();
    const author = currentAuthor || 'Anonymous';
    
    if (!replyText) {
      showToast('Reply cannot be empty!', false);
      return;
    }
    
    if (hasProhibitedContent(replyText)) {
      showToast('Your reply contains words that are not allowed. Please remove them.', false);
      return;
    }
    
    if (containsLinks(replyText)) {
      showToast('Links are not allowed in replies. Please remove them.', false);
      return;
    }
    
    const newReply = {
      text: replyText,
      author: author,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      likes: 0,
      likedBy: {}
    };
    document.getElementById('reply-text-input').value = '';
    database.ref(`quotes/${currentQuoteIdForReply}/replies`).push(newReply)
      .then(() => {
        playSound('replySound');
        showToast('You Replied!');
        loadReplies(currentQuoteIdForReply);
      })
      .catch(error => {
        console.error("Error adding reply:", error);
        showToast('Error adding reply: ' + error.message, false);
      });
  }

  // Load replies for a quote
  function loadReplies(quoteId) {
    const repliesContainer = document.getElementById('replyPanelContent');
    repliesContainer.innerHTML = '<div class="loading-replies">Loading replies...</div>';

    database.ref(`quotes/${quoteId}/replies`).on('value', (snapshot) => {
      repliesContainer.innerHTML = '';
      
      if (!snapshot.exists()) {
        repliesContainer.innerHTML = '<div class="no-replies">No replies yet</div>';
        return;
      }

      const repliesArray = [];
      snapshot.forEach((childSnapshot) => {
        repliesArray.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      repliesArray.sort((a, b) => a.createdAt - b.createdAt);

      repliesArray.forEach((reply) => {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply-card';
        
        const likes = reply.likes || 0;
        const likedBy = reply.likedBy || {};
        const isLiked = likedBy[getVisitorId()];
        const isAuthor = currentAuthor && reply.author === currentAuthor;
        
        replyDiv.innerHTML = `
          <div class="reply-header">
            <div class="reply-avatar">${getInitials(reply.author)}</div>
            <div class="reply-author">${escapeHtml(reply.author)}</div>
          </div>
          <div class="reply-text">${escapeHtml(reply.text)}</div>
          <div class="reply-meta">
            <small>${formatDateTimeWithGMT(reply.createdAt)}</small>
            <div class="reply-actions">
              <button class="btn-like-reply ${isLiked ? 'liked' : ''}" 
                      onclick="window.__quotes.toggleReplyLike('${quoteId}', '${reply.id}')">
                <i class="fas fa-thumbs-up"></i>
                <span class="like-count">${likes}</span>
              </button>
              ${isAuthor ? `
              <button class="btn-delete-reply" 
                      onclick="window.__quotes.deleteReply('${quoteId}', '${reply.id}')">
                <i class="fas fa-trash"></i>
              </button>` : ''}
            </div>
          </div>
        `;
        repliesContainer.appendChild(replyDiv);
      });
    }, (error) => {
      console.error("Error loading replies:", error);
      repliesContainer.innerHTML = `<div class="error-replies">Error loading replies: ${error.message}</div>`;
    });
  }

  // Load quotes function with all original functionality
  function loadQuotes() {
    const quotesContainer = document.getElementById('quotesContainer');
    if (!quotesContainer) {
      console.error("quotesContainer element not found");
      return;
    }
    quotesContainer.innerHTML = '<div class="loading">Loading quotes...</div>';
    
    console.log("Loading quotes from Firebase...");
    
    database.ref('quotes').on('value', (snapshot) => {
      console.log("Quotes snapshot received:", snapshot.exists() ? snapshot.numChildren() : 0, "quotes");
      quotesContainer.innerHTML = '';
      
      if (!snapshot.exists()) {
        quotesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-quote-right"></i>
          <h3>No quotes yet</h3>
          <p>Be the first to share a quote!</p>
        </div>`;
        return;
      }
      
      const quotesArray = [];
      snapshot.forEach((childSnapshot) => {
        quotesArray.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      quotesArray.sort((a, b) => b.createdAt - a.createdAt);
      
      quotesArray.forEach((quote) => {
        const likedBy = quote.likedBy || {};
        const isLiked = likedQuotes[quote.id] || likedBy[getVisitorId()];
        if (likedBy[getVisitorId()]) {
          likedQuotes[quote.id] = true;
          localStorage.setItem(likedQuotesKey, JSON.stringify(likedQuotes));
        }
        
        const quoteDiv = document.createElement('div');
        quoteDiv.className = 'quote-card';
        quoteDiv.id = `quote-${quote.id}`;
        
        if (quote.bgColor) {
          quoteDiv.style.backgroundColor = quote.bgColor;
        }
        
        const sanitizedText = sanitizeText(quote.text);
        const replyCount = quote.replies ? Object.keys(quote.replies).length : 0;
        
        const quoteMenu = currentAuthor && quote.author === currentAuthor 
          ? `<div class="quote-menu">
              <button class="btn-menu" onclick="window.__quotes.toggleQuoteMenu('${quote.id}', event)">
                <i class="fas fa-ellipsis-vertical"></i>
              </button>
              <div id="menu-content-${quote.id}" class="quote-menu-content">
                <button onclick="window.__quotes.startEditQuote('${quote.id}', '${quote.text.replace(/'/g, "\\'")}')">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delQuote" onclick="window.__quotes.deleteQuote('${quote.id}')">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>`
          : '';
        
        quoteDiv.innerHTML = `
          ${quoteMenu}
          <div class="quote-header">
            <div class="user-avatar">${getInitials(quote.author)}</div>
            <div class="user-info">
              <div class="quote-author">${escapeHtml(quote.author)}</div>
              <div class="timestamp">${formatDateTimeWithGMT(quote.createdAt)}</div>
            </div>
          </div>
          
          <div class="quote-text">"${sanitizedText}"</div>
          
          <div class="quote-actions-bottom">
            <div class="action-buttons">
              <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="window.__quotes.toggleLike('${quote.id}')">
                <i class="${isLiked ? 'fas' : 'far'} fa-thumbs-up"></i> 
                <span class="like-count">${quote.likes || 0}</span>
              </button>
              
              <button class="btn-toggle-replies" onclick="window.__quotes.toggleReplyPanel('${quote.id}')">
                <i class="fas fa-reply"></i> ${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}
              </button>
            
              <button class="action-btn-copy" onclick="window.__quotes.copyToClipboard('${quote.text.replace(/'/g, "\\'")} By ${quote.author.replace(/'/g, "\\'")}')">
                <i class="far fa-copy"></i> Copy
              </button>
            </div>
          </div>
        `;
        
        quotesContainer.appendChild(quoteDiv);
      });
      
      // Hide shimmer after first load
      const shimmer = document.getElementById('app-shimmer');
      if (shimmer) shimmer.classList.add('hide');
    }, (error) => {
      console.error("Error loading quotes:", error);
      quotesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading quotes</h3>
        <p>${error.message}</p>
        <button onclick="window.__quotes.loadQuotes()" style="margin-top: 12px; padding: 8px 16px; background: var(--ios-blue); border: none; border-radius: 20px; color: white; cursor: pointer;">Retry</button>
      </div>`;
    });
  }

  // Initialize the app immediately (no DOMContentLoaded needed)
// Initialize the app immediately (no DOMContentLoaded needed)
console.log("Initializing app UI...");

// Load saved drafts
if (quoteTextArea) {
  quoteTextArea.value = loadTextAreaFromLocalStorage(QUOTE_TEXT_STORAGE_KEY);
}
if (quoteBgColor) {
  quoteBgColor.value = loadTextAreaFromLocalStorage(QUOTE_BG_COLOR_STORAGE_KEY);
  if (quoteBgColor.value && quoteTextArea) {
    quoteTextArea.style.backgroundColor = quoteBgColor.value;
    quoteBgColor.style.backgroundColor = quoteBgColor.value;
  }
}

loadQuotes();

// Initialize typing variables
let typingTimeout;
let isTyping = false;
const typingRef = database.ref('typing');
const myTypingRef = typingRef.child(getVisitorId());

// Setup typing listeners
setupTypingListeners();
setupReplyTypingListeners();

// ========== ALL ORIGINAL FUNCTIONS BELOW ==========

function saveTextAreaToLocalStorage(key, value) {
  try {
    if (value.trim() !== '') {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function loadTextAreaFromLocalStorage(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return '';
  }
}

function clearLocalStorageForKey(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Error clearing localStorage:', e);
  }
}

if (quoteTextArea) {
  quoteTextArea.addEventListener('input', function() {
    saveTextAreaToLocalStorage(QUOTE_TEXT_STORAGE_KEY, this.value);
    updateTypingStatus();
  });
}

if (quoteBgColor) {
  quoteBgColor.addEventListener('input', function() {
    quoteBgColor.style.backgroundColor = this.value;
    saveTextAreaToLocalStorage(QUOTE_BG_COLOR_STORAGE_KEY, this.value);
  });
}

window.addEventListener('beforeunload', () => {
  if (isTyping && myTypingRef) {
    myTypingRef.set({
      author: currentAuthor,
      isTyping: false
    });
  }
});

function setupTypingListeners() {
  typingRef.on('child_added', (snapshot) => {
    if (snapshot.key !== getVisitorId() && snapshot.val().isTyping) {
      showTypingIndicator(snapshot.val());
    }
  });
  
  typingRef.on('child_changed', (snapshot) => {
    if (snapshot.key !== getVisitorId()) {
      const typingData = snapshot.val();
      if (typingData.isTyping) {
        showTypingIndicator(typingData);
        const typingSound = document.getElementById("typingSound");
        if (typingSound) typingSound.play().catch(e => console.log("Sound error:", e));
      } else {
        hideTypingIndicator();
      }
    }
  });
}

  function updateTypingStatus(quoteId = null) {
    if (!currentAuthor) return;
    
    const isTypingNow = quoteId 
      ? document.getElementById(`reply-text-input`)?.value.trim() !== ''
      : quoteTextArea && quoteTextArea.value.trim() !== '';
    
    if (isTypingNow !== isTyping) {
      isTyping = isTypingNow;
      myTypingRef.set({
        author: currentAuthor,
        isTyping: isTypingNow,
        type: quoteId ? 'reply' : 'quote',
        quoteId: quoteId || null
      }).catch(error => {
        console.error("Error updating typing status:", error);
      });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (isTyping) {
        isTyping = false;
        myTypingRef.set({
          author: currentAuthor,
          isTyping: false,
          type: null,
          quoteId: null
        }).catch(error => {
          console.error("Error resetting typing status:", error);
        });
      }
    }, 2000);
  }

  function showTypingIndicator(typingData) {
    if (typingData.author === currentAuthor) return;
    
    const actionText = typingData.type === 'reply' 
      ? 'is Replying...' 
      : 'is Typing...';
    
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;
    
    indicator.innerHTML = `
      <span class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </span>
      <span class="typing-text">${escapeHtml(typingData.author)} ${actionText}</span>
    `;
    
    indicator.style.display = 'flex';
    indicator.style.opacity = '1';
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 500);
    }, 5000);
  }

  function setupReplyTypingListeners() {
    document.addEventListener('input', function(e) {
      if (e.target.id === 'reply-text-input') {
        updateTypingStatus(currentQuoteIdForReply);
      }
    });
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;
    indicator.style.opacity = '0';
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 300);
  }

  function showToast(message, isSuccess = true) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    toast.className = isSuccess ? 'toast show' : 'toast error show';
    toastMessage.textContent = message;
    setTimeout(() => { toast.className = 'toast'; }, 1500);
  }

  function playSound(soundId) {
    try {
      const sound = document.getElementById(soundId);
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Could not play sound:", e));
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }

  async function isNameTaken(name) {
    try {
      const snapshot = await database.ref('quotes').orderByChild('author').equalTo(name).once('value');
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking name:", error);
      return false;
    }
  }

  function hasProhibitedContent(text) {
    const lowerText = text.toLowerCase();
    return prohibitedWords.some(word => lowerText.includes(word));
  }

  function containsLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function sanitizeText(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return escapeHtml(text).replace(urlRegex, match => {
      return `<span class="non-clickable-link">${match}</span>`;
    });
  }

  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const successful = document.execCommand('copy');
      playSound('copySound');
      showToast(successful ? 'Copied!' : 'Failed to copy');
    } catch (err) {
      showToast('Failed to copy: ' + err, false);
    }
    document.body.removeChild(textarea);
  }

  function getTextColor(bgColor) {
    if (!bgColor) return '#1e1e1e';
    const color = bgColor.substring(1);
    const rgb = parseInt(color, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 120 ? '#ffffff' : '#1e1e1e';
  }

  function formatDateTimeWithGMT(timestamp) {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getVisitorId() {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
      try {
        visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitorId', visitorId);
      } catch (e) {
        console.error('Error creating visitor ID:', e);
        visitorId = 'temp_visitor_' + Date.now();
      }
    }
    return visitorId;
  }

  function toggleLike(quoteId) {
    const visitorId = getVisitorId();
    const quoteRef = database.ref(`quotes/${quoteId}`);
    
    quoteRef.transaction((quote) => {
      if (quote) {
        if (!quote.likedBy) {
          quote.likedBy = {};
        }
        
        if (quote.likedBy[visitorId]) {
          quote.likes = (quote.likes || 1) - 1;
          delete quote.likedBy[visitorId];
          likedQuotes[quoteId] = false;
        } else {
          playSound('mySound');
          quote.likes = (quote.likes || 0) + 1;
          quote.likedBy[visitorId] = true;
          likedQuotes[quoteId] = true;
        }
      }
      return quote;
    }, (error, committed) => {
      if (error) {
        console.error("Error updating like:", error);
        showToast("Error updating like: " + error.message, false);
      } else if (committed) {
        localStorage.setItem(likedQuotesKey, JSON.stringify(likedQuotes));
      }
    });
  }

  function toggleReplyLike(quoteId, replyId) {
    const visitorId = getVisitorId();
    const replyRef = database.ref(`quotes/${quoteId}/replies/${replyId}`);
    
    replyRef.transaction((reply) => {
      if (reply) {
        if (!reply.likedBy) {
          reply.likedBy = {};
        }
        
        if (reply.likedBy[visitorId]) {
          reply.likes = (reply.likes || 1) - 1;
          delete reply.likedBy[visitorId];
        } else {
          playSound('replyLike');
          reply.likes = (reply.likes || 0) + 1;
          reply.likedBy[visitorId] = true;
        }
      }
      return reply;
    }, (error, committed) => {
      if (error) {
        console.error("Error updating reply like:", error);
        showToast("Error updating reply like: " + error.message, false);
      }
    });
  }

  function deleteQuote(quoteId) {
    if (confirm('Are you sure you want to delete this quote?')) {
      database.ref(`quotes/${quoteId}`).remove()
        .then(() => {
          showToast('Deleted!');
        })
        .catch(error => {
          console.error("Error deleting quote:", error);
          showToast('Error deleting quote: ' + error.message, false);
        });
    }
  }

  function deleteReply(quoteId, replyId) {
    if (confirm('Are you sure you want to delete this reply?')) {
      database.ref(`quotes/${quoteId}/replies/${replyId}`).remove()
        .then(() => {
          showToast('Reply deleted!');
          loadReplies(quoteId);
        })
        .catch(error => {
          console.error("Error deleting reply:", error);
          showToast('Error deleting reply: ' + error.message, false);
        });
    }
  }

  function toggleQuoteMenu(quoteId, event) {
    event.stopPropagation();
    const menuContent = document.getElementById(`menu-content-${quoteId}`);
    const allMenus = document.querySelectorAll('.quote-menu-content');
    
    allMenus.forEach(menu => {
      if (menu !== menuContent) {
        menu.style.display = 'none';
      }
    });
    
    menuContent.style.display = menuContent.style.display === 'block' ? 'none' : 'block';
  }

  document.addEventListener('click', function() {
    document.querySelectorAll('.quote-menu-content').forEach(menu => {
      menu.style.display = 'none';
    });
  });

  function startEditQuote(quoteId, currentText) {
    const quoteDiv = document.getElementById(`quote-${quoteId}`);
    if (!quoteDiv) return;
    
    const quoteTextElement = quoteDiv.querySelector('.quote-text');
    if (!quoteTextElement) return;
    
    const editTextarea = document.createElement('textarea');
    editTextarea.value = currentText;
    editTextarea.className = 'edit-textarea';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'save-edit-btn';
    saveButton.onclick = () => saveEditQuote(quoteId, editTextarea.value);
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cancel-edit-btn';
    cancelButton.onclick = () => cancelEditQuote(quoteId, currentText);
    
    const editControls = document.createElement('div');
    editControls.className = 'edit-controls';
    editControls.appendChild(saveButton);
    editControls.appendChild(cancelButton);
    
    quoteTextElement.replaceWith(editTextarea);
    const actionsBottom = quoteDiv.querySelector('.quote-actions-bottom');
    if (actionsBottom) actionsBottom.style.display = 'none';
    quoteDiv.appendChild(editControls);
  }

  function saveEditQuote(quoteId, newText) {
    if (!newText.trim()) {
      showToast('Quote cannot be empty!', false);
      return;
    }
    
    if (hasProhibitedContent(newText)) {
      showToast('post contains words that are not allowed. Please remove them.', false);
      return;
    }
    
    if (containsLinks(newText)) {
      showToast('Links are not allowed in quotes. Please remove them.', false);
      return;
    }
    
    database.ref(`quotes/${quoteId}/text`).set(newText.trim())
      .then(() => {
        showToast('Edited!');
        playSound('post.ogg');
        loadQuotes();
      })
      .catch(error => {
        console.error("Error updating quote:", error);
        showToast('Error updating quote: ' + error.message, false);
      });
  }

  function cancelEditQuote(quoteId, originalText) {
    const quoteDiv = document.getElementById(`quote-${quoteId}`);
    if (!quoteDiv) return;
    
    const editTextarea = quoteDiv.querySelector('.edit-textarea');
    const editControls = quoteDiv.querySelector('.edit-controls');
    if (!editTextarea || !editControls) return;
    
    const quoteTextElement = document.createElement('div');
    quoteTextElement.className = 'quote-text';
    quoteTextElement.textContent = `"${originalText}"`;
    
    editTextarea.replaceWith(quoteTextElement);
    editControls.remove();
    const actionsBottom = quoteDiv.querySelector('.quote-actions-bottom');
    if (actionsBottom) actionsBottom.style.display = 'flex';
  }

  function addQuote() {
    const authorInput = document.getElementById('quoteAuthor');
    const author = authorInput.value.trim();
    const text = quoteTextArea.value.trim();
    const bgColor = quoteBgColor.value;
    
    if (!author) {
      showToast('Please enter your name!', false);
      authorInput.focus();
      return;
    }
    
    if (!text) {
      showToast('Please enter a quote!', false);
      quoteTextArea.focus();
      return;
    }
    
    if (hasProhibitedContent(text)) {
      showToast('detected prohibited words. Remove them', false);
      return;
    }
    
    if (containsLinks(text)) {
      showToast('Links are not allowed.', false);
      return;
    }
    
    if (author !== currentAuthor) {
      isNameTaken(author).then(taken => {
        if (taken) {
          showToast('This name is already taken. Please choose another one.', false);
          return;
        }
        saveAuthorAndAddQuote(author, text, bgColor);
      });
    } else {
      saveAuthorAndAddQuote(author, text, bgColor);
    }
  }

  function saveAuthorAndAddQuote(author, text, bgColor) {
    currentAuthor = author;
    localStorage.setItem('quoteAuthor', author);
    const authorInput = document.getElementById('quoteAuthor');
    if (authorInput) {
      authorInput.readOnly = true;
    }
    
    const newQuote = {
      text: text,
      author: author,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      likes: 0,
      bgColor: bgColor || '',
      likedBy: {} 
    };
    if (quoteTextArea) quoteTextArea.value = '';
    
    console.log("Adding quote:", newQuote);
    
    database.ref('quotes').push(newQuote)
      .then((result) => {
        clearLocalStorageForKey(QUOTE_TEXT_STORAGE_KEY);
        playSound('postSound');
        showToast('Posted!');
        console.log("Quote added successfully, ID:", result.key);
      })
      .catch(error => {
        console.error("Error adding quote:", error);
        showToast('Error adding quote: ' + error.message, false);
      });
  }

  // Expose functions globally so inline onclick handlers can find them
  window.__quotes = {
    toggleReplyPanel,
    submitReply,
    toggleReplyLike,
    deleteReply,
    toggleLike,
    deleteQuote,
    toggleQuoteMenu,
    startEditQuote,
    copyToClipboard,
    addQuote,
    loadQuotes
  };
  
  console.log("App initialized, __quotes exposed globally");
}
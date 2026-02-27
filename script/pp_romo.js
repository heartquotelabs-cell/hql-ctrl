// Firebase configuration - Replace with your own config
const firebaseConfig = {
    apiKey: "AIzaSyCZCAwncuoDuy033ZrEquCwRvYpacBs8xM",
    authDomain: "heartquotecommunity.firebaseapp.com",
    projectId: "heartquotecommunity",
    storageBucket: "heartquotecommunity.firebasestorage.app",
    messagingSenderId: "346084161963",
    appId: "1:346084161963:web:f7ed56dc4a4599f4befaee",
    measurementId: "G-JGKWQP35QB"
  };

// Simple Firebase initialization
let analytics = null;
let firebaseInitialized = false;
let pageViewTracked = false;
let sessionTracked = false;
let firebaseLoading = false; // Prevent multiple load attempts

// Load Firebase scripts dynamically (only once)
function loadFirebaseScripts() {
  // Prevent multiple simultaneous load attempts
  if (firebaseLoading) {
    console.log('Firebase already loading...');
    return Promise.resolve();
  }

  if (firebaseInitialized) {
    console.log('Firebase already initialized');
    return Promise.resolve();
  }

  firebaseLoading = true;

  return new Promise((resolve, reject) => {
    // Check if Firebase is already loaded
    if (window.firebase && window.firebase.analytics) {
      console.log('Firebase already loaded');
      firebaseLoading = false;
      initializeFirebase();
      resolve();
      return;
    }

    console.log('Loading Firebase scripts...');

    // Load Firebase SDK - using older compatible version
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';

    const script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js';

    script1.onload = () => {
      console.log('Firebase App loaded');
      document.head.appendChild(script2);
    };

    script2.onload = () => {
      console.log('Firebase Analytics loaded');
      firebaseLoading = false;
      initializeFirebase();
      resolve();
    };

    script2.onerror = (error) => {
      console.error('Failed to load Firebase Analytics:', error);
      firebaseLoading = false;
      reject(error);
    };

    document.head.appendChild(script1);
  });
}

function initializeFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Get analytics instance
    analytics = firebase.analytics();

    // Enable analytics collection
    analytics.setAnalyticsCollectionEnabled(true);

    firebaseInitialized = true;
    console.log('Firebase Analytics initialized successfully');

    // Track page view only once
    trackPageView();

    // Track session only once
    trackUserSession();

  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Track user session
function trackUserSession() {
  if (!analytics || !firebaseInitialized || sessionTracked) return;

  try {
    sessionTracked = true;

    analytics.logEvent('session_start', {
      session_start: new Date().toISOString(),
      user_agent: navigator.userAgent.substring(0, 100),
      language: navigator.language || 'unknown',
      screen_resolution: `${window.screen.width}x${window.screen.height}`
    });

    console.log('Session start tracked');

    // Track session duration
    const sessionStart = Date.now();
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Math.round((Date.now() - sessionStart) / 1000);
      if (analytics && firebaseInitialized) {
        analytics.logEvent('session_end', {
          duration_seconds: sessionDuration
        });
      }
    });
  } catch (error) {
    console.error('Error tracking session:', error);
  }
}

// Track page view - ONLY ONCE
function trackPageView() {
  if (!analytics || !firebaseInitialized) {
    setTimeout(trackPageView, 2000);
    return;
  }

  // CRITICAL: Prevent duplicate page views
  if (pageViewTracked) {
    console.log('Page view already tracked, skipping duplicate');
    return;
  }

  try {
    pageViewTracked = true;

    const pageTitle = document.title || 'Untitled Page';
    const pagePath = window.location.pathname;

    // Use ONLY ONE method for page_view
    analytics.logEvent('page_view', {
      page_title: pageTitle,
      page_path: pagePath,
      page_location: window.location.href
    });

    console.log('✅ Page view tracked once:', pageTitle);

  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

// SEPARATE FUNCTION: Track promotion appearance (NOT a page view)
function trackPromotionAppearance() {
  if (!analytics || !firebaseInitialized) {
    console.log('Analytics not ready for promotion tracking');
    return;
  }

  try {
    // Use a custom event name - NOT page_view
    analytics.logEvent('promotion_impression', {
      promotion_name: 'notes_keeper',
      promotion_id: 'notes_keeper_001',
      creative_name: 'widget_banner',
      page_title: document.title || 'Untitled'
    });

    console.log('✅ Promotion impression tracked (separate from page view)');
  } catch (error) {
    console.error('Error tracking promotion:', error);
  }
}

// Track promotion interaction (clicks, etc.)
function trackPromotionInteraction(action, details = {}) {
  if (!analytics || !firebaseInitialized) {
    console.log('Analytics not ready, promotion tracking delayed');
    return;
  }

  try {
    analytics.logEvent('promotion_action', {
      action_name: action,
      promotion_name: 'notes_keeper',
      page_title: document.title || 'Untitled',
      page_path: window.location.pathname,
      ...details
    });

    console.log('Promotion interaction tracked:', action);
  } catch (error) {
    console.error('Error tracking promotion:', error);
  }
}

// Track unique users
function trackUniqueUser() {
  if (!analytics || !firebaseInitialized) return;

  try {
    const lastVisit = localStorage.getItem('last_visit_date');
    const today = new Date().toDateString();

    if (lastVisit !== today) {
      analytics.logEvent('user_visit', {
        visit_date: today,
        page_title: document.title || 'Untitled'
      });

      localStorage.setItem('last_visit_date', today);
      console.log('User visit tracked for today');
    }
  } catch (error) {
    console.error('Error tracking user:', error);
  }
}

// Modified initPromotion function
function initPromotion() {
  console.log('🚀 Starting promotion widget...');

  const promotion = document.getElementById('promotion');
  if (!promotion) {
    console.error('❌ Element #promotion not found');
    return;
  }

  // First, inject the widget
  createPromotionWidget(promotion);

  // Then try to load Firebase (only once)
  setTimeout(() => {
    loadFirebaseScripts()
      .then(() => {
        console.log('✅ Firebase ready, tracking additional data...');

        setTimeout(() => {
          trackUniqueUser();

          // Track promotion appearance - THIS IS NOT A PAGE VIEW
          trackPromotionAppearance();

          // Track widget loaded event
          trackPromotionInteraction('widget_loaded');
        }, 1000);
      })
      .catch(error => {
        console.error('❌ Firebase failed to load:', error);
      });
  }, 100);
}

function createPromotionWidget(promotion) {
  console.log('Creating promotion widget...');

  // Create main container
  const notesKeeper = document.createElement('div');
  notesKeeper.id = 'notes-keeper';
  notesKeeper.style.cssText = `
    display: none;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border: .5px solid #e0e0e0;
    border-radius: 15px;
    margin: 18px;
    max-width: 600px;
    font-family: Arial, sans-serif;
  `;

  // Image container
  const imgContainer = document.createElement('div');
  imgContainer.style.cssText = `
    width: 45px;
    height: 45px;
    flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
  `;

  const img = document.createElement('img');
  img.src = 'https://cdn.jsdelivr.net/gh/heartquotelabs-cell/Social_Text_Based/p_romo/hqp/20260212_171406.png';
  img.alt = 'logo';
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;
  imgContainer.appendChild(img);

  // Content container
  const contentContainer = document.createElement('div');
  contentContainer.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  const nameElement = document.createElement('div');
  nameElement.style.cssText = `
    font-weight: bold;
    font-size: 16px;
    text-align: left;
  `;
  nameElement.textContent = 'Notes Keeper';

  const showcaseTitle = document.createElement('div');
  showcaseTitle.style.cssText = `
    font-size: 12px;
    color: #666;
    font-style: italic;
    text-align: left;
  `;
  showcaseTitle.textContent = 'Your notes organizer';

  const button = document.createElement('button');
  button.textContent = 'Get App';
  button.style.cssText = `
    all: initial !important;
    display: inline-block !important;
    background-color: #ff4444 !important;
    color: white !important;
    border: none !important;
    border-radius: 4px !important;
    padding: 8px 16px !important;
    font-size: 14px !important;
    font-family: Arial, sans-serif !important;
    cursor: pointer !important;
    font-weight: 500 !important;
    transition: background-color 0.2s !important;
    flex-shrink: 0 !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    line-height: normal !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    box-shadow: none !important;
    text-shadow: none !important;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#cc0000 !important';
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#ff4444 !important';
  });

  button.addEventListener('click', function() {
    const link = 'https://apkpure.com/heartquote/com.heartquote/downloading';

    if (analytics && firebaseInitialized) {
      trackPromotionInteraction('button_click', {
        link_url: link,
        button_text: 'Get App'
      });
    }

    window.open(link, '_blank');
  });

  contentContainer.appendChild(nameElement);
  contentContainer.appendChild(showcaseTitle);

  notesKeeper.appendChild(imgContainer);
  notesKeeper.appendChild(contentContainer);
  notesKeeper.appendChild(button);

  promotion.appendChild(notesKeeper);
  console.log('✅ Promotion widget injected');
}

// Start the script
console.log('📝 Script loaded, waiting for DOM...');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPromotion);
} else {
  initPromotion();
}








// Use a different variable name to avoid conflicts
let admobInterstitial;
let isAdReadyy = false; 

const COOLDOWN_MSs = 60000; // 1 minute
const getPrevTimee = () => parseInt(localStorage.getItem('ad_last_shown')) || 0;
const setPrevTimee = () => localStorage.setItem('ad_last_shown', Date.now());

// Add styles
const stylooo = document.createElement('style');
stylooo.innerHTML = `
    /* AdMob Floating Button */
    .ad-fab-button {
        display: none; /* Hidden by default - JS will show it */
        position: fixed !important;
        top: 7px !important;
        right: 15px !important;
        width: 35px !important;
        height: 35px !important;
        background-color: rgba(0, 0, 0, 0.7) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 50% !important;
        z-index: 2147483647 !important;
        cursor: pointer !important;
        border: 1px solid #cccc !important;
        
        /* Center the icon */
        align-items: center !important;
        justify-content: center !important;
        font-size: 24px !important;
        transition: transform 0.2s, opacity 0.3s !important;
    }

    .ad-fab-button:hover {
        background-color: rgba(0, 0, 0, 0.9) !important;
    }

    .ad-fab-button:active {
        transform: scale(0.9);
    }

    .ad-fab-button.is-loading {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
    }

    .toast {
        visibility: hidden;
        min-width: 250px;
        background-color: #333;
        color: #fff;
        text-align: center;
        border-radius: 8px;
        padding: 16px;
        position: fixed;
        z-index: 9999;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 14px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: visibility 0.3s;
    }

    .toast.show {
        visibility: visible;
    }

    .toast.error {
        background-color: #dc3545;
    }

    .toast i {
        font-size: 18px;
    }
`;
document.head.appendChild(stylooo);

// Create button once
const btnn = document.createElement('button');
btnn.className = 'ad-fab-button';
btnn.innerHTML = '<i class="fas fa-video"></i>';
btnn.setAttribute('aria-label', 'Watch video ad');
document.body.appendChild(btnn);

// Toast notification function
function showToast(message, isError = false) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateButtonVisibility() {
    const now = Date.now();
    const timeSinceLastAd = now - getPrevTimee();
    const canShow = (timeSinceLastAd >= COOLDOWN_MSs) && isAdReadyy;

    if (canShow) {
        btnn.style.display = 'flex';
        btnn.disabled = false;
        btnn.classList.remove('is-loading');
    } else {
        btnn.style.display = 'none';
        btnn.disabled = true;
        if (timeSinceLastAd < COOLDOWN_MSs) {
            // Optionally show when it will be available again
            const minutesLeft = Math.ceil((COOLDOWN_MSs - timeSinceLastAd) / 60000);
            console.log(`Ad available in ${minutesLeft} minute(s)`);
        }
    }
}

// Wait for device ready
document.addEventListener('deviceready', function() {
    console.log('Device ready event fired');
    initializeAdMob();
}, false);

async function initializeAdMob() {
    try {
        // Check if admob is available
        if (typeof admob === 'undefined') {
            console.log("AdMob Plus plugin not installed");
            showToast('AdMob plugin not available', true);
            return;
        }

        console.log('AdMob plugin found, initializing...');

        // Create interstitial with test ID for development
        // Use test ID during development, replace with real ID for production
        const adUnitId = 'ca-app-pub-5188642994982403/1811807909'; // Test ID
        // const adUnitId = 'ca-app-pub-5188642994982403/1811807909'; // Production ID
        
        admobInterstitial = new admob.InterstitialAd({
            adUnitId: adUnitId,
        });

        // Set up event listeners
        admobInterstitial.on('load', () => {
            console.log('Ad loaded successfully');
            isAdReadyy = true;
            btnn.classList.remove('is-loading');
            updateButtonVisibility();
            showToast('Ad ready to watch!');
        });

        admobInterstitial.on('loadfail', (error) => {
            console.error('Ad failed to load:', error);
            isAdReadyy = false;
            updateButtonVisibility();
            // Retry loading after 15 seconds
            setTimeout(() => {
                if (admobInterstitial && Date.now() - getPrevTimee() >= COOLDOWN_MSs) {
                    console.log('Retrying ad load...');
                    admobInterstitial.load();
                }
            }, 15000);
        });

        admobInterstitial.on('show', () => {
            console.log('Ad shown');
            setPrevTimee();
        });

        admobInterstitial.on('dismiss', () => {
            console.log('Ad dismissed');
            isAdReadyy = false;
            updateButtonVisibility();
            // Load next ad after cooldown
            setTimeout(() => {
                if (admobInterstitial && Date.now() - getPrevTimee() >= COOLDOWN_MSs) {
                    admobInterstitial.load();
                }
            }, COOLDOWN_MSs - 5000);
        });

        admobInterstitial.on('showfail', (error) => {
            console.error('Ad show failed:', error);
            btnn.disabled = false;
            btnn.classList.remove('is-loading');
            showToast('Failed to show ad', true);
        });

        // Start initial load if cooldown period has passed
        if (Date.now() - getPrevTimee() >= COOLDOWN_MSs) {
            console.log('Loading initial ad...');
            admobInterstitial.load();
        } else {
            console.log('Ad cooldown period active');
        }
        
        // Update button visibility every 3 seconds
        setInterval(updateButtonVisibility, 3000);
        
        console.log('AdMob initialization complete');
    } catch (error) {
        console.error("AdMob initialization error:", error);
        showToast('Failed to initialize ads', true);
    }
}

btnn.addEventListener('click', async () => {
    if (isAdReadyy && !btnn.disabled && admobInterstitial) {
        btnn.disabled = true;
        btnn.classList.add('is-loading');
        
        try {
            console.log('Attempting to show ad...');
            await admobInterstitial.show();
        } catch (e) {
            console.error("Show failed", e);
            btnn.disabled = false;
            btnn.classList.remove('is-loading');
            showToast('Failed to show ad', true);
        }
    } else {
        if (!isAdReadyy) {
            showToast('Ad not ready yet', true);
        } else if (btnn.disabled) {
            showToast('Please wait...', true);
        }
    }
});

// Backup event listener for older Cordova versions
document.addEventListener('deviceready', function() {
  alert('deviceready');
    // This is just to ensure compatibility
}, false);
console.log('new.js');
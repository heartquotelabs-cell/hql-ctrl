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
    display: flex;
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












/**
 * COMPLETE ADMOB INTEGRATION WITH DEBUGGING
 */

// Global variables
let admobInterstitial;
let admobBanner;
let isAdReadyy = false;
let bannerRetryCount = 0;
let interRetryCount = 0;
const MAX_RETRIES = 3;
const COOLDOWN_MSs = 60000;

// Storage helpers
const getPrevTimee = () => parseInt(localStorage.getItem('ad_last_shown')) || 0;
const setPrevTimee = () => localStorage.setItem('ad_last_shown', Date.now());

// Debug logging
function logAdStatus(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[AdMob Debug ${timestamp}] ${message}`, data || '');
    
    // Show toast for important errors
    if (message.includes('fail') || message.includes('error')) {
        showToast(message);
    }
}

// 1. Add Styles
const stylooo = document.createElement('style');
stylooo.innerHTML = `
    .ad-fab-button {
        display: none;
        position: fixed !important;
        top: 7px !important;
        right: 15px !important;
        width: 35px !important;
        height: 35px !important;
        background-color: rgba(0, 0, 0, 0.7) !important;
        color: #ffffff !important;
        border: 1px solid #cccc !important;
        border-radius: 50% !important;
        z-index: 2147483647 !important;
        cursor: pointer !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 20px !important;
        transition: transform 0.2s, opacity 0.3s !important;
    }

    .ad-fab-button.is-loading { opacity: 0.5; cursor: wait; }

    .toast {
        visibility: hidden;
        min-width: 200px;
        background-color: #333;
        color: #fff;
        text-align: center;
        border-radius: 20px;
        padding: 12px;
        position: fixed;
        z-index: 9999;
        bottom: 70px; 
        left: 50%;
        transform: translateX(-50%);
        font-size: 13px;
        transition: opacity 0.3s;
    }
    .toast.show { visibility: visible; opacity: 1; }

    .admob-banner-container {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        width: 100% !important;
        min-height: 50px !important;
        z-index: 2147483646 !important;
        background: transparent !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
    }

    .admob-banner-container.hidden {
        opacity: 0 !important;
        pointer-events: none !important;
    }

    body {
        padding-bottom: 0 !important;
        transition: padding-bottom 0.3s;
    }

    body.banner-visible {
        padding-bottom: 60px !important;
    }
`;
document.head.appendChild(stylooo);

// Create banner container
const bannerContainer = document.createElement('div');
bannerContainer.className = 'admob-banner-container hidden';
bannerContainer.id = 'admob-banner-container';
document.body.appendChild(bannerContainer);

// UI Elements
const btnn = document.createElement('button');
btnn.className = 'ad-fab-button';
btnn.innerHTML = '📺';
document.body.appendChild(btnn);

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Banner functions
function showBanner() {
    if (!admobBanner) {
        logAdStatus('Cannot show banner: not initialized');
        return;
    }
    
    logAdStatus('Showing banner');
    bannerContainer.classList.remove('hidden');
    document.body.classList.add('banner-visible');
    
    admobBanner.show()
        .then(() => logAdStatus('Banner show successful'))
        .catch(err => logAdStatus('Error showing banner', err));
}

function hideBanner() {
    logAdStatus('Hiding banner');
    bannerContainer.classList.add('hidden');
    document.body.classList.remove('banner-visible');
    
    if (admobBanner) {
        admobBanner.hide()
            .catch(err => logAdStatus('Error hiding banner', err));
    }
}

// 2. Initialize Banner with Better Error Handling
async function createBannerAd() {
    try {
        // Use TEST IDs first to verify plugin works
       // const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
        const PROD_BANNER_ID = 'ca-app-pub-5188642994982403/7847467013';
        
        // Check if admob is available
        if (typeof admob === 'undefined') {
            throw new Error('AdMob plugin not available');
        }

        logAdStatus('Creating banner ad', { testId: TEST_BANNER_ID });

        admobBanner = new admob.BannerAd({
            adUnitId: TEST_BANNER_ID,  // Using test ID for debugging
            position: 'bottom',
            adaptive: true
        });

        // Event listeners
        admobBanner.on('load', () => {
            logAdStatus('✅ Banner loaded successfully');
            bannerRetryCount = 0;
            showBanner();
        });

        admobBanner.on('loadfail', (error) => {
            logAdStatus('❌ Banner load failed', error);
            
            if (bannerRetryCount < MAX_RETRIES) {
                bannerRetryCount++;
                const delay = 30000 * bannerRetryCount;
                logAdStatus(`Retrying banner in ${delay/1000}s (attempt ${bannerRetryCount}/${MAX_RETRIES})`);
                setTimeout(() => createBannerAd(), delay);
            } else {
                logAdStatus('Max banner retries reached');
                showToast('Banner ads unavailable');
            }
        });

        admobBanner.on('show', () => logAdStatus('Banner displayed'));
        admobBanner.on('hide', () => logAdStatus('Banner hidden'));
        
        // Load the banner
        await admobBanner.load();
        logAdStatus('Banner load initiated');
        
    } catch (error) {
        logAdStatus('❌ Banner initialization error', error);
        showToast(`Banner error: ${error.message}`);
        
        // Retry initialization after delay
        if (bannerRetryCount < MAX_RETRIES) {
            bannerRetryCount++;
            setTimeout(() => createBannerAd(), 30000);
        }
    }
}

// 3. Initialize Interstitial with Better Error Handling
async function initInterstitial() {
    try {
        // Test IDs
      //  const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
         const PROD_INTERSTITIAL_ID = 'ca-app-pub-5188642994982403/1811807909';
        
        if (typeof admob === 'undefined') {
            throw new Error('AdMob plugin not available');
        }

        logAdStatus('Creating interstitial ad', { testId: TEST_INTERSTITIAL_ID });

        admobInterstitial = new admob.InterstitialAd({
            adUnitId: TEST_INTERSTITIAL_ID,  // Using test ID
        });

        admobInterstitial.on('load', () => {
            logAdStatus('✅ Interstitial loaded successfully');
            isAdReadyy = true;
            interRetryCount = 0;
            updateButtonVisibility();
        });

        admobInterstitial.on('loadfail', (error) => {
            logAdStatus('❌ Interstitial load failed', error);
            isAdReadyy = false;
            updateButtonVisibility();
            
            if (interRetryCount < MAX_RETRIES) {
                interRetryCount++;
                setTimeout(() => {
                    if (Date.now() - getPrevTimee() >= COOLDOWN_MSs) {
                        admobInterstitial.load();
                    }
                }, COOLDOWN_MSs);
            }
        });

        admobInterstitial.on('show', () => logAdStatus('Interstitial shown'));
        admobInterstitial.on('dismiss', () => {
            logAdStatus('Interstitial dismissed');
            isAdReadyy = false;
            updateButtonVisibility();
            
            setTimeout(() => {
                if (Date.now() - getPrevTimee() >= COOLDOWN_MSs) {
                    admobInterstitial.load();
                }
            }, COOLDOWN_MSs);
        });

        // Initial load
        if (Date.now() - getPrevTimee() >= COOLDOWN_MSs) {
            await admobInterstitial.load();
            logAdStatus('Interstitial load initiated');
        }
        
    } catch (error) {
        logAdStatus('❌ Interstitial initialization error', error);
        showToast(`Interstitial error: ${error.message}`);
    }
}

function updateButtonVisibility() {
    const canShow = (Date.now() - getPrevTimee() >= COOLDOWN_MSs) && isAdReadyy;
    btnn.style.display = canShow ? 'flex' : 'none';
    if (canShow) {
        logAdStatus('Interstitial button visible');
    }
}

// 4. Main initialization with platform check
document.addEventListener('deviceready', async () => {
    logAdStatus('Device ready event fired');
    
    // Check platform
    logAdStatus('Platform info', {
        cordova: window.cordova,
        admob: typeof admob,
        device: window.device
    });
    
    // Verify plugin
    if (typeof admob === 'undefined') {
        const errorMsg = 'AdMob Plus plugin not found! Run: cordova plugin add cordova-plugin-admob-plus';
        logAdStatus('❌ ' + errorMsg);
        showToast(errorMsg);
        return;
    }

    // Check if we're on a real device
    if (window.location.protocol === 'file:' || window.cordova) {
        logAdStatus('Running on device, initializing ads...');
        
        // Initialize with delay to ensure everything is ready
        setTimeout(async () => {
            await createBannerAd();
            await initInterstitial();
        }, 2000);
    } else {
        logAdStatus('Running in browser - ads will not work. Test on real device.');
        showToast('Test on real device for ads');
    }
    
    // Periodic status check
    setInterval(updateButtonVisibility, 5000);
    
}, false);

// 5. Event Handlers
btnn.addEventListener('click', async () => {
    if (isAdReadyy && admobInterstitial) {
        try {
            btnn.classList.add('is-loading');
            setPrevTimee();
            logAdStatus('Showing interstitial');
            await admobInterstitial.show();
        } catch (error) {
            logAdStatus('Show failed', error);
            showToast('Ad unavailable');
        } finally {
            btnn.classList.remove('is-loading');
            updateButtonVisibility();
        }
    } else {
        logAdStatus('Interstitial not ready');
        showToast('Ad not ready yet');
    }
});

// Lifecycle management
document.addEventListener('pause', () => {
    logAdStatus('App paused');
    hideBanner();
}, false);

document.addEventListener('resume', () => {
    logAdStatus('App resumed');
    setTimeout(() => {
        if (admobBanner) {
            showBanner();
        }
    }, 1000);
}, false);

// Manual test function (call from console)
window.testAdMob = function() {
    logAdStatus('Manual test initiated');
    if (typeof admob === 'undefined') {
        logAdStatus('❌ AdMob plugin missing');
        return;
    }
    logAdStatus('✅ AdMob plugin found', {
        version: admob.VERSION,
        platforms: admob.Platform
    });
};
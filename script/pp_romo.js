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
 * PRODUCTION ADMOB SETUP - HEARTQUOTE
 * FINAL VERSION - With optimized retry logic
 */

// --- CONFIGURATION ---
const BANNER_ID = 'ca-app-pub-5188642994982403/7847467013';
const INTERSTITIAL_ID = 'ca-app-pub-5188642994982403/1811807909';

// --- GLOBALS ---
let admobInterstitial;
let admobBanner;
let isAdReady = false;
let bannerReady = false;
let fabButton = null;
const COOLDOWN_MS = 60000;

// Storage Helpers
const getLastShown = () => parseInt(localStorage.getItem('ad_last_shown')) || 0;
const setLastShown = () => localStorage.setItem('ad_last_shown', Date.now());

// --- UI & STYLES ---
function showMessage(msg, isError = false) {
    if (!isError) return; 
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.8); color: #fff; padding: 10px 20px;
        border-radius: 20px; z-index: 2147483647; font-size: 13px; font-family: sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function addStyles() {
    if (document.getElementById('admob-styles')) return;
    
    const stylooo = document.createElement('style');
    stylooo.id = 'admob-styles';
    stylooo.innerHTML = `
        .ad-fab-button {
            display: none; position: fixed !important; top: 12px !important; right: 15px !important;
            width: 42px !important; height: 42px !important; background: rgba(0,0,0,0.6);
            color: #ffffff; border: 1.5px solid #fff; border-radius: 50%; z-index: 2147483647;
            align-items: center; justify-content: center; font-size: 22px; cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: opacity 0.2s;
        }
        .ad-fab-button:active { opacity: 0.7; }
        .ad-fab-button.is-loading { opacity: 0.5; pointer-events: none; }
        body.ad-margin { padding-bottom: 65px !important; transition: padding 0.3s; }
    `;
    document.head.appendChild(stylooo);
}

// --- AD LOGIC ---

async function initBanner() {
    try {
        admobBanner = new admob.BannerAd({
            adUnitId: BANNER_ID,
            position: 'bottom',
            adaptive: true
        });

        admobBanner.on('load', () => {
            console.log('✅ Banner loaded - showing immediately');
            bannerReady = true;
            document.body.classList.add('ad-margin');
            admobBanner.show().catch(e => console.log('Show error:', e));
        });

        admobBanner.on('loadfail', (error) => {
            console.log('❌ Banner load failed, retrying in 30s', error);
            bannerReady = false;
            alert('Banner loadfail');
            // OPTIMIZED: Use existing instance to retry, don't create new one
            setTimeout(() => {
                if (admobBanner) {
                    admobBanner.load();
                }
            }, 30000);
        });

        await admobBanner.load();
        console.log('⏳ Banner loading started...');
        
    } catch (e) {
        console.error("Banner initialization failed:", e);
        // If we get here, admobBanner might be null, so we need to retry the whole init
        setTimeout(() => initBanner(), 30000);
    alert('Banner initialization failed');
      
    }
}

async function initInterstitial() {
    try {
        admobInterstitial = new admob.InterstitialAd({
            adUnitId: INTERSTITIAL_ID,
        });

        admobInterstitial.on('load', () => {
            console.log('✅ Interstitial ready');
            isAdReady = true;
            if (fabButton) fabButton.style.display = 'flex';
        });

        admobInterstitial.on('dismiss', () => {
            console.log('Interstitial dismissed');
            isAdReady = false;
            if (fabButton) fabButton.style.display = 'none';
            setLastShown();
            // OPTIMIZED: Use existing instance to load next
            setTimeout(() => {
                console.log('Loading next interstitial...');
                if (admobInterstitial) {
                    admobInterstitial.load();
                }
            }, 5000); 
        });

        admobInterstitial.on('loadfail', (error) => {
            console.log('❌ Interstitial load failed, retrying', error);
            isAdReady = false;
            if (fabButton) fabButton.style.display = 'none';
            alert('Interstitial loadfail');
            // OPTIMIZED: Use existing instance to retry
            setTimeout(() => {
                if (admobInterstitial) {
                    admobInterstitial.load();
                }
            }, 30000);
        });

        await admobInterstitial.load();
        console.log('⏳ Interstitial loading started...');
        
    } catch (e) {
        console.error("Interstitial initialization failed:", e);
        alert('initInterstitial initialization failed');
        setTimeout(() => initInterstitial(), 30000);
    }
}

function createAdUI() {
    const oldBtn = document.querySelector('.ad-fab-button');
    if (oldBtn) oldBtn.remove();
    
    fabButton = document.createElement('button');
    fabButton.className = 'ad-fab-button';
    fabButton.innerHTML = '📺';
    fabButton.setAttribute('aria-label', 'Watch ad for reward');
    document.body.appendChild(fabButton);
    
    fabButton.addEventListener('click', async () => {
        const timeSinceLast = Date.now() - getLastShown();
        
        if (isAdReady && timeSinceLast > COOLDOWN_MS) {
            try {
                fabButton.classList.add('is-loading');
                await admobInterstitial.show();
            } catch (e) {
                showMessage("Ad could not be shown. Please try again.", true);
            } finally {
                fabButton.classList.remove('is-loading');
            }
        } else if (!isAdReady) {
            showMessage("Ad is still loading...", true);
            if (admobInterstitial) {
                admobInterstitial.load();
            }
        } else {
            const remaining = Math.ceil((COOLDOWN_MS - timeSinceLast) / 1000);
            showMessage(`Next ad available in ${remaining}s`, true);
        }
    });
    
    console.log('✅ Ad UI created');
}

// --- MAIN INITIALIZATION ---
async function initializeAds() {
    console.log('🚀 Starting AdMob initialization...');
    addStyles();

    document.addEventListener('deviceready', async () => {
        console.log('📱 Device ready event fired');
        
        try {
            if (typeof admob === 'undefined') {
                console.error('❌ AdMob plugin not found!');
                showMessage('Ad plugin not available', true);
                return;
            }
            
            await admob.start();
            console.log('✅ AdMob SDK started successfully');
            
            createAdUI();
            
            await Promise.all([
                initBanner(),
                initInterstitial()
            ]);
            
            console.log('✅ All ads initialized successfully');
            
        } catch (err) {
            console.error("❌ AdMob failed to start:", err);
            showMessage('Ad service unavailable', true);
        }
    }, false);
}

// Start execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAds);
} else {
    initializeAds();
}

// --- DEBUG HELPER ---
window.checkAdStatus = function() {
    const status = {
        admob: typeof admob !== 'undefined' ? '✅ Loaded' : '❌ Missing',
        bannerReady: bannerReady ? '✅' : '⏳',
        isAdReady: isAdReady ? '✅' : '⏳',
        hasButton: fabButton ? '✅' : '❌',
        lastShown: getLastShown() ? new Date(getLastShown()).toLocaleString() : 'Never',
        timeSinceLast: getLastShown() ? Math.round((Date.now() - getLastShown())/1000) + 's' : 'N/A'
    };
    
    console.log('📊 AD STATUS REPORT:');
    console.log('━━━━━━━━━━━━━━━━━━━');
    Object.entries(status).forEach(([key, value]) => {
        console.log(`${key.padEnd(12)}: ${value}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━');
    
    return status;
};

// --- RESET HELPER ---
window.resetAds = function() {
    console.log('🔄 Resetting ads...');
    if (admobBanner) {
        admobBanner.hide().catch(() => {});
    }
    bannerReady = false;
    isAdReady = false;
    if (fabButton) fabButton.style.display = 'none';
    localStorage.removeItem('ad_last_shown');
    console.log('✅ Reset complete. Refresh app to restart ads.');
};
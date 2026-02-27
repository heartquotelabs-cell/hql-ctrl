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











/**
 * manager.js - Enterprise Waterfall v2.1 (Safe Testing Edition)
 */

// --- CONFIGURATION ---
// SET THIS TO 'false' BEFORE UPLOADING TO PLAY STORE / APP STORE
const IS_TEST_MODE = true; 

const REAL_AD_UNIT_ID = 'ca-app-pub-5188642994982403/1811807909';
const TEST_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712'; // Official Google Test ID

const AD_UNIT_ID = IS_TEST_MODE ? TEST_AD_UNIT_ID : REAL_AD_UNIT_ID;

const COOLDOWN_MS = 60000;
const BASE_RETRY_DELAY = 15000;
const MAX_RETRY_DELAY = 60000;

// --- STATE ---
let interstitial;
let isAdReady = false;
let isFetching = false;
let failedAttempts = 0;

const getPrevTime = () => parseInt(localStorage.getItem('ad_last_shown')) || 0;
const setPrevTime = () => localStorage.setItem('ad_last_shown', Date.now());

// --- BACKUP PROVIDERS REGISTRY ---
const backupProviders = [
    {
        name: 'UnityAds',
        check: () => typeof window.unityads !== 'undefined',
        show: () => window.unityads.show('rewardedVideo')
    },
    {
        name: 'AppLovin',
        check: () => typeof window.applovin !== 'undefined',
        show: () => window.applovin.showInterstitial()
    }
];

// --- UI & TOAST SYSTEM ---
const styloo = document.createElement('style');
styloo.innerHTML = `
    .ad-toast {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.9); color: white; padding: 12px 24px;
        border-radius: 30px; font-size: 14px; z-index: 10000;
        transition: opacity 0.5s; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        pointer-events: none;
    }
    .ad-toast-success { background: #4CAF50; }
    .ad-toast-error { background: #f44336; }
`;
document.head.appendChild(styloo);

const btn = document.createElement('button');
btn.className = 'ad-fab-button';
document.body.appendChild(btn);

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `ad-toast ad-toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500); 
    }, 3000);
}

// --- CORE WATERFALL LOGIC ---

function getRetryDelay() {
    return Math.min(BASE_RETRY_DELAY * Math.pow(1.5, failedAttempts), MAX_RETRY_DELAY);
}

async function tryBackupAd() {
    console.log("🌊 Waterfall: Attempting backup providers...");
    
    for (const provider of backupProviders) {
        if (provider.check()) {
            showToast(`Using ${provider.name} backup`, "info");
            try {
                await provider.show();
                setPrevTime();
                return true;
            } catch (e) {
                console.error(`${provider.name} failed`, e);
            }
        }
    }
    showToast("No ads available currently", "error");
    return false;
}

async function loadAd() {
    if (isFetching || isAdReady || !navigator.onLine) return;
    isFetching = true;
    updateUI();
    try {
        await interstitial.load();
    } catch (e) {
        // Handled in 'loadfail' listener
    }
}

// --- INITIALIZATION ---

document.addEventListener('deviceready', async () => {
    console.log(`🚀 Ad System Init [Test Mode: ${IS_TEST_MODE}]`);
    
    try {
        // 1. Consent Logic
        const consentInfo = await admob.requestConsentInfo();
        if (consentInfo.status === admob.ConsentStatus.REQUIRED) {
            await admob.loadAndShowConsentForm();
        }

        // 2. Start AdMob
        await admob.start();

        // 3. Create Interstitial
        interstitial = new admob.InterstitialAd({ adUnitId: AD_UNIT_ID });

        // Event: Ad Loaded
        interstitial.on('load', () => {
            isAdReady = true;
            isFetching = false;
            failedAttempts = 0; 
            showToast(IS_TEST_MODE ? "Test Ad Ready" : "Ad Ready", "success");
            updateUI();
        });

        // Event: Ad Failed (CRITICAL FOR DEBUGGING)
        interstitial.on('loadfail', (error) => {
            isAdReady = false;
            isFetching = false;
            failedAttempts++;
            
            // Log the error code (3 = No Fill, 0 = Internal Error, etc)
            console.warn("AdMob Load Failed:", JSON.stringify(error));
            
            const delay = getRetryDelay();
            updateUI();
            setTimeout(loadAd, delay);
        });

        // Event: Ad Closed
        interstitial.on('dismiss', () => {
            isAdReady = false;
            setPrevTime(); // Track when it was shown
            updateUI();
            setTimeout(loadAd, 5000); // Preload next ad after short delay
        });

        // Initial Load check
        if (Date.now() - getPrevTime() >= COOLDOWN_MS) {
            loadAd();
        }
        
        setInterval(updateUI, 1000);

    } catch (err) {
        console.error("AdMob Init Failed", err);
        tryBackupAd();
    }
}, false);

// --- UI & CLICK HANDLER ---

function updateUI() {
    if (!navigator.onLine) {
        btn.innerHTML = `<span>Offline</span>`;
        btn.disabled = true;
        return;
    }

    const remaining = COOLDOWN_MS - (Date.now() - getPrevTime());

    if (remaining > 0) {
        btn.disabled = true;
        btn.innerHTML = `<span>Wait ${Math.ceil(remaining/1000)}s</span>`;
    } else if (isFetching) {
        btn.disabled = true;
        btn.innerHTML = `<span>Loading...</span>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<span>Watch Ad</span>`;
    }
}

btn.addEventListener('click', async () => {
    if (isAdReady) {
        try {
            await interstitial.show();
        } catch (e) {
            tryBackupAd();
        }
    } else {
        // If not ready, try to load immediately
        loadAd();
        // If we have failed multiple times, try backup immediately on click
        if (failedAttempts >= 2) {
            tryBackupAd();
        } else {
            showToast("Loading ad, please wait...", "info");
        }
    }
});

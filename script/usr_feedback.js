
(function() {
    "use strict";

    const loaderOverlay = document.getElementById('scriptLoader');
    const messagesArea = document.getElementById('messagesArea');

    async function bootstrap() {
        try {
            const moduleCode = `
                import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
                import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

                const firebaseConfig = {
                    apiKey: "AIzaSyCZCAwncuoDuy033ZrEquCwRvYpacBs8xM",
                    authDomain: "heartquotecommunity.firebaseapp.com",
                    projectId: "heartquotecommunity",
                    storageBucket: "heartquotecommunity.firebasestorage.app",
                    messagingSenderId: "346084161963",
                    appId: "1:346084161963:web:f7ed56dc4a4599f4befaee",
                    measurementId: "G-JGKWQP35QB"
                };

                const app = initializeApp(firebaseConfig);
                const db = getDatabase(app);
                const feedbackRef = ref(db, 'feedbacks');

                function getUserId() {
                    let uid = localStorage.getItem('feedback_user_id');
                    if (!uid) {
                        uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        localStorage.setItem('feedback_user_id', uid);
                    }
                    return uid;
                }

                const currentUserId = getUserId();

                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const messagesArea = document.getElementById('messagesArea');
                const messageStatus = document.getElementById('messageStatus');

                const loader = document.getElementById('scriptLoader');
                if (loader) loader.classList.add('hidden');

                // Auto-resize
                messageInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
                });

                // Send message
                sendButton.addEventListener('click', async () => {
                    const message = messageInput.value.trim();
                    if (!message) {
                        messageStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Type a message';
                        messageStatus.style.color = '#ff3b30';
                        setTimeout(() => messageStatus.innerHTML = '', 2000);
                        return;
                    }

                    sendButton.disabled = true;
                    messageStatus.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Sending...';
                    messageStatus.style.color = '#8e8e93';

                    try {
                        const newFeedbackRef = push(feedbackRef);
                        await set(newFeedbackRef, {
                            userId: currentUserId,
                            message: message,
                            timestamp: Date.now(),
                            reply: '',
                            replyTimestamp: null
                        });

                        messageInput.value = '';
                        messageInput.style.height = 'auto';
                        messageStatus.innerHTML = '<i class="fas fa-check-circle"></i> Sent';
                        messageStatus.style.color = '#34c759';
                    } catch (error) {
                        messageStatus.innerHTML = '<i class="fas fa-times-circle"></i> Failed';
                        messageStatus.style.color = '#ff3b30';
                    } finally {
                        sendButton.disabled = false;
                        setTimeout(() => {
                            messageStatus.innerHTML = '';
                        }, 2000);
                    }
                });

                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendButton.click();
                    }
                });

                // Pre-embedded info message inside chat (static) — but we can also insert before messages.
                // Already we have a banner, but spec says "add a pre embedded messages as ( info in the header , We respond within 30 min etc )"
                // We'll add a static info bubble right at the beginning of messages area (only once).
                function ensureInfoBubble() {
                    if (!messagesArea.querySelector('.pre-info-static')) {
                        const infoDiv = document.createElement('div');
                        infoDiv.className = 'pre-info-message pre-info-static';
                        infoDiv.innerHTML = '<i class="fas fa-info-circle"></i> <strong>Support</strong><br>Share feedback or just say hello. <br> We are here for you';
                        messagesArea.prepend(infoDiv);
                    }
                }

                // Load messages & render with double ticks / seen
                onValue(feedbackRef, (snapshot) => {
                    const data = snapshot.val();
                    messagesArea.innerHTML = '';
                    
                    // Re-add the static info bubble
                    const infoBubble = document.createElement('div');
                    infoBubble.className = 'pre-info-message pre-info-static';
                    infoBubble.innerHTML = '<i class="fas fa-clock"></i> <strong>Support</strong><br>We reply within 30 min or more faster but sometimes it can take longer upto 1 day.<br> Your feedback matters!';
                    messagesArea.appendChild(infoBubble);

                    if (!data) {
                        const emptyDiv = document.createElement('div');
                        emptyDiv.className = 'empty-chat';
                        emptyDiv.innerHTML = '<i class="far fa-smile" style="font-size:32px; opacity:0.4; margin-bottom:8px;"></i><br>No messages yet. Say hello! 👋';
                        messagesArea.appendChild(emptyDiv);
                        return;
                    }

                    const userMessages = Object.entries(data)
                        .filter(([_, msg]) => msg.userId === currentUserId)
                        .sort((a, b) => a[1].timestamp - b[1].timestamp);

                    if (userMessages.length === 0) {
                        const emptyDiv = document.createElement('div');
                        emptyDiv.className = 'empty-chat';
                        emptyDiv.innerHTML = '<i class="far fa-paper-plane" style="font-size:28px; opacity:0.3;"></i><br>Send your first feedback!';
                        messagesArea.appendChild(emptyDiv);
                        return;
                    }

                    userMessages.forEach(([id, msg]) => {
                        // User message row
                        const userRow = document.createElement('div');
                        userRow.className = 'message-row user';
                        
                        const userDate = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const userDay = new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                        
                        // Determine seen status: if reply exists -> seen (blue double ticks)
                        const hasReply = !!msg.reply;
                        // Delivered: always show double ticks, color depends on seen
                        const tickClass = hasReply ? 'double-tick seen' : 'double-tick';
                        // Using font-awesome double check: <i class="fas fa-check-double"></i>
                        
                        const statusHtml = hasReply 
                            ? '<span class="status-indicator"><i class="fas fa-check-double" style="color:#40c8ff;"></i></span>' 
                            : '<span class="status-indicator"><i class="fas fa-check-double" style="color:rgba(255,255,255,0.7);"></i></span>';
                        
                        userRow.innerHTML = \`
                            <div class="message-bubble">
                                \${msg.message}
                                <div class="message-time">
                                    \${userDay} · \${userDate}
                                    \${statusHtml}
                                </div>
                            </div>
                        \`;
                        messagesArea.appendChild(userRow);

                        // Support reply (if exists)
                        if (msg.reply) {
                            const supportRow = document.createElement('div');
                            supportRow.className = 'message-row support';
                            
                            const replyDate = msg.replyTimestamp 
                                ? new Date(msg.replyTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '';
                            const replyDay = msg.replyTimestamp 
                                ? new Date(msg.replyTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                : '';
                            
                            supportRow.innerHTML = \`
                                <div class="message-bubble">
                                    \${msg.reply}
                                    <div class="message-time">
                                        <i class="fas fa-circle" style="font-size:6px; color:#007aff; margin-right:4px;"></i>
                                        Heartquote · \${replyDay} \${replyDate}
                                    </div>
                                </div>
                            \`;
                            messagesArea.appendChild(supportRow);
                        }
                    });

                    messagesArea.scrollTop = messagesArea.scrollHeight;
                });

                // Ensure info bubble always appears even before first load
                setTimeout(() => ensureInfoBubble(), 50);
            `;

            const blob = new Blob([moduleCode], { type: 'application/javascript' });
            const moduleUrl = URL.createObjectURL(blob);
            const moduleScript = document.createElement('script');
            moduleScript.type = 'module';
            moduleScript.src = moduleUrl;
            
            moduleScript.onload = () => {
                URL.revokeObjectURL(moduleUrl);
            };
            
            moduleScript.onerror = (err) => {
                console.error('Module failed', err);
                loaderOverlay.classList.add('hidden');
                messagesArea.innerHTML = '<div class="empty-chat" style="color:#ff3b30;"><i class="fas fa-exclamation-triangle"></i> Failed to load. Refresh.</div>';
                URL.revokeObjectURL(moduleUrl);
            };

            document.head.appendChild(moduleScript);

        } catch (e) {
            console.warn('bootstrap error', e);
            loaderOverlay.classList.add('hidden');
            messagesArea.innerHTML = '<div class="empty-chat"><i class="fas fa-plug"></i> Connection error</div>';
        }
    }

    bootstrap();
})();
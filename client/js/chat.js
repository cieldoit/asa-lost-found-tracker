(() => {
  const API = window.API_BASE || `${window.location.origin}/api`;
  const token = () => window.Auth?.getToken?.() || localStorage.getItem('asa_token') || localStorage.getItem('token');
  const role = () => String(window.Auth?.getRole?.() || localStorage.getItem('asa_role') || localStorage.getItem('role') || '').toLowerCase();
  const isAdmin = () => ['admin', 'administrator'].includes(role());
  const state = { conversations: [], selectedID: null, starterItem: null, starterGeneral: false, messages: [], sending: false, refreshTimer: null, initialized: false, initPromise: null };

  function mountChatView() {
    if (document.getElementById('page-chat')) return;
    if (!document.querySelector('link[data-asa-chat-style]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/user/css/chat.css';
      link.dataset.asaChatStyle = 'true';
      document.head.append(link);
    }
    const page = document.createElement('section');
    page.className = 'page';
    page.id = 'page-chat';
    page.innerHTML = `<main class="chat-page"><section class="chat-shell" id="chatShell" aria-label="Messages"><aside class="chat-sidebar" id="chatSidebar"><div class="chat-sidebar-heading"><div><h1>Messages</h1><p id="chatListSubtitle">Conversations about reported items</p></div><div class="chat-sidebar-actions"><span id="chatConversationCount" class="chat-count">0</span>${isAdmin() ? '' : '<button type="button" id="chatStartGeneral" class="chat-new-button" aria-label="Start a general message to an administrator">+ New</button>'}</div></div><div id="chatConversationList" class="chat-conversation-list" aria-live="polite"><div class="chat-loading">Loading conversations…</div></div></aside><section class="chat-thread" id="chatThread" aria-label="Message thread"><div class="chat-empty-state" id="chatEmptyState"><div class="chat-empty-icon" aria-hidden="true">✉</div><h2 id="chatEmptyTitle">Select a conversation</h2><p id="chatEmptyDescription">Choose an item inquiry to read messages and reply.</p><div class="chat-empty-actions"><a class="chat-empty-action" id="chatBrowseItems" href="/" hidden>Browse items</a>${isAdmin() ? '' : '<button type="button" id="chatStartGeneralEmpty" class="chat-empty-action chat-empty-action-secondary" hidden>Contact an admin</button>'}</div></div><div class="chat-active-thread" id="chatActiveThread" hidden><div class="chat-thread-heading"><button type="button" id="chatBackToList" class="chat-mobile-back" aria-label="Back to conversations">←</button><div class="chat-item-avatar" id="chatItemAvatar">I</div><div class="chat-thread-title"><h2 id="chatItemTitle">Item</h2><p id="chatItemMeta"></p></div><span id="chatItemStatus" class="chat-item-status"></span></div><div class="chat-messages" id="chatMessages" aria-live="polite"></div><form class="chat-compose" id="chatComposeForm"><label class="sr-only" for="chatMessageInput">Write a message</label><textarea id="chatMessageInput" maxlength="2000" rows="1" placeholder="Write a message…" required></textarea><div class="chat-compose-footer"><span id="chatComposeHint">Messages are shared with ASA administrators.</span><button type="submit" id="chatSendButton"><span>Send</span><span aria-hidden="true">➤</span></button></div></form></div></section></section><p id="chatStatusMessage" class="chat-status-message" role="status" aria-live="polite"></p></main>`;
    const footer = document.querySelector('footer.bottom-bar');
    if (footer) footer.insertAdjacentElement('beforebegin', page);
    else document.body.append(page);
    const observer = new MutationObserver(() => document.body.classList.toggle('asa-chat-open', page.classList.contains('active')));
    observer.observe(page, { attributes: true, attributeFilter: ['class'] });
    document.body.classList.toggle('asa-chat-open', page.classList.contains('active'));
  }

  function redirectStandaloneChat() {
    if (!window.location.pathname.endsWith('/chat.html')) return false;
    if (!token()) {
      window.location.replace('/login/login.html');
      return true;
    }
    const itemID = new URLSearchParams(window.location.search).get('itemID');
    if (itemID) sessionStorage.setItem('asa_chat_item_id', itemID);
    const home = isAdmin() ? '/admin' : ({ student: '/student', staff: '/staff', visitor: '/visitor' }[role()] || '/');
    window.location.replace(`${home}#chat`);
    return true;
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API}/chat${path}`, {
      ...options,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token()}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
    });
    let data = {};
    try { data = await response.json(); } catch { /* Empty response. */ }
    if (response.status === 401 || response.status === 403 && !token()) {
      window.location.replace('/login/login.html');
      throw new Error('Please sign in to use Chat.');
    }
    if (!response.ok) throw new Error(data.error || 'Chat could not complete that request.');
    return data;
  }

  function attachUserNavigation() {
    if (isAdmin()) return;
    const header = document.querySelector('student-header, staff-header, visitor-header');
    if (!header) return;
    const icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>';
    const main = header.querySelector('.main-nav');
    const post = main?.querySelector('#snav-post');
    if (main && post && !main.querySelector('#snav-chat')) {
      post.insertAdjacentHTML('afterend', `<button type="button" class="nav-item" id="snav-chat" onclick="showPage('chat')">${icon}Chat<span class="chat-nav-unread" id="userChatUnreadBadge" hidden></span></button>`);
    }
    const mobile = header.querySelector('#mobileNav');
    const mobilePost = mobile?.querySelector('#smnav-post');
    if (mobile && mobilePost && !mobile.querySelector('#smnav-chat')) {
      mobilePost.insertAdjacentHTML('afterend', `<button type="button" class="mnav-item" id="smnav-chat" onclick="showPage('chat');closeMobileNav()">${icon}Chat<span class="chat-nav-unread" id="userMobileChatUnreadBadge" hidden></span></button>`);
    }
    refreshUserUnread();
  }

  function addItemInquiryAction() {
    if (isAdmin()) return;
    const modalInfo = document.querySelector('#itemModal .modal-info-sec');
    const claimButton = document.getElementById('claimBtn');
    if (!modalInfo || !claimButton || document.getElementById('askItemChatButton')) return;
    const button = document.createElement('button');
    button.id = 'askItemChatButton';
    button.type = 'button';
    button.textContent = 'Ask about this item';
    button.setAttribute('aria-label', 'Start a chat inquiry about this item');
    button.style.cssText = 'display:block;width:100%;margin-top:12px;padding:13px 18px;border:1px solid #1a5c2a;border-radius:10px;background:#fff;color:#1a5c2a;font:600 15px Poppins,Arial,sans-serif;cursor:pointer';
    button.addEventListener('click', () => {
      const itemID = document.getElementById('itemModal')?.dataset.itemId;
      if (!itemID) return;
      window.openASAChatForItem?.(itemID);
    });
    claimButton.insertAdjacentElement('afterend', button);
  }

  function formatTime(value, dateOnly = false) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, dateOnly ? { month: 'short', day: 'numeric', year: 'numeric' } : { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  function showStatus(message = '') {
    const node = document.getElementById('chatStatusMessage');
    if (node) node.textContent = message;
  }

  function renderConversationList() {
    const list = document.getElementById('chatConversationList');
    const count = document.getElementById('chatConversationCount');
    if (!list) return;
    if (count) count.textContent = String(state.conversations.length);
    if (!state.conversations.length) {
      list.innerHTML = `<div class="chat-list-empty">${isAdmin() ? 'No conversations yet.' : 'Your messages with ASA administrators will appear here.'}</div>`;
      return;
    }
    list.replaceChildren();
    for (const chat of state.conversations) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `chat-conversation${Number(chat.conversationID) === Number(state.selectedID) ? ' active' : ''}`;
      const avatar = document.createElement('span');
      avatar.className = 'chat-conversation-avatar';
      avatar.textContent = String(chat.itemTitle || 'I').trim().charAt(0).toUpperCase();
      const copy = document.createElement('span');
      copy.className = 'chat-conversation-copy';
      const top = document.createElement('span');
      top.className = 'chat-conversation-top';
      const name = document.createElement('strong');
      name.textContent = isAdmin() ? (chat.participantName || 'ASA user') : (chat.itemTitle || 'Item inquiry');
      const time = document.createElement('span');
      time.className = 'chat-conversation-time';
      time.textContent = formatTime(chat.lastMessageAt || chat.updatedAt);
      top.append(name, time);
      const item = document.createElement('span');
      item.className = 'chat-conversation-item';
      item.textContent = isAdmin() ? chat.itemTitle || 'Reported item' : (chat.itemID == null ? 'Direct message to ASA administrators' : [chat.itemType, chat.categoryName].filter(Boolean).join(' · '));
      const preview = document.createElement('span');
      preview.className = 'chat-conversation-preview';
      preview.textContent = chat.lastMessage || 'No messages yet.';
      copy.append(top, item, preview);
      button.append(avatar, copy);
      if (Number(chat.unreadCount) > 0) {
        const unread = document.createElement('span');
        unread.className = 'chat-unread';
        unread.textContent = Number(chat.unreadCount) > 9 ? '9+' : String(chat.unreadCount);
        unread.setAttribute('aria-label', `${chat.unreadCount} unread messages`);
        button.append(unread);
      }
      button.addEventListener('click', () => selectConversation(chat.conversationID));
      list.append(button);
    }
  }

  function updateNavBadges() {
    const badges = [document.getElementById('userChatUnreadBadge'), document.getElementById('userMobileChatUnreadBadge'), document.getElementById('adminChatUnreadBadge'), document.getElementById('adminMobileChatUnreadBadge')].filter(Boolean);
    const unread = state.conversations.reduce((total, chat) => total + Number(chat.unreadCount || 0), 0);
    for (const badge of badges) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.hidden = unread === 0;
    }
  }

  function updateEmptyState() {
    const title = document.getElementById('chatEmptyTitle');
    const description = document.getElementById('chatEmptyDescription');
    const browse = document.getElementById('chatBrowseItems');
    const general = document.getElementById('chatStartGeneralEmpty');
    if (isAdmin()) {
      if (title) title.textContent = state.conversations.length ? 'Select a conversation' : 'No conversations yet';
      if (description) description.textContent = state.conversations.length ? 'Choose an inquiry to read messages and reply.' : 'Item questions and direct messages from regular users will appear here.';
      if (browse) browse.hidden = true;
      if (general) general.hidden = true;
    } else if (state.conversations.length) {
      if (title) title.textContent = 'Select a conversation';
      if (description) description.textContent = 'Choose a conversation or start a new message to an ASA administrator.';
      if (browse) browse.hidden = true;
      if (general) general.hidden = true;
    } else {
      if (title) title.textContent = 'Ask an ASA administrator';
      if (description) description.textContent = 'Ask about a reported item, or send the admins a general message directly.';
      if (browse) {
        browse.href = ({ student: '/student', staff: '/staff', visitor: '/visitor' }[role()] || '/');
        browse.hidden = false;
      }
      if (general) general.hidden = false;
    }
  }

  async function refreshUserUnread() {
    if (!token() || isAdmin()) return;
    try {
      const conversations = await request('/conversations');
      state.conversations = conversations;
      updateNavBadges();
    } catch { /* The dashboard can still be used when chat is temporarily unavailable. */ }
  }

  async function loadConversations() {
    const list = document.getElementById('chatConversationList');
    if (list && !state.conversations.length) list.innerHTML = '<div class="chat-loading">Loading conversations…</div>';
    const conversations = await request('/conversations');
    state.conversations = conversations;
    renderConversationList();
    updateEmptyState();
    updateNavBadges();
    return conversations;
  }

  function renderHeader(conversation, item = null) {
    const title = document.getElementById('chatItemTitle');
    const meta = document.getElementById('chatItemMeta');
    const avatar = document.getElementById('chatItemAvatar');
    const status = document.getElementById('chatItemStatus');
    const selectedItem = item || conversation;
    if (title) title.textContent = selectedItem.itemTitle || selectedItem.title || 'Item inquiry';
    if (meta) {
      const parts = [];
      if (isAdmin() && conversation?.participantName) parts.push(`${conversation.participantName} · ${conversation.participantRole || 'User'}`);
      if (selectedItem.categoryName) parts.push(selectedItem.categoryName);
      if (selectedItem.locationName) parts.push(selectedItem.locationName);
      meta.textContent = parts.join(' · ') || (isAdmin() ? 'Item inquiry' : 'Your inquiry to ASA administrators');
    }
    if (avatar) avatar.textContent = String(title?.textContent || 'I').trim().charAt(0).toUpperCase();
    if (status) {
      status.textContent = selectedItem.itemStatus || 'Inquiry';
      status.hidden = !selectedItem.itemStatus;
    }
  }

  function renderMessages(messages) {
    const panel = document.getElementById('chatMessages');
    if (!panel) return;
    panel.replaceChildren();
    if (!messages.length && state.starterItem) {
      const intro = document.createElement('p');
      intro.className = 'chat-day-divider';
      intro.textContent = 'Ask an administrator a question about this item.';
      panel.append(intro);
    } else if (!messages.length) {
      const intro = document.createElement('p');
      intro.className = 'chat-day-divider';
      intro.textContent = 'Start the conversation with a message.';
      panel.append(intro);
    }
    for (const message of messages) {
      const senderIsAdmin = ['admin', 'administrator'].includes(String(message.senderRole).toLowerCase());
      const mine = isAdmin() ? senderIsAdmin : !senderIsAdmin;
      const bubble = document.createElement('article');
      bubble.className = `chat-message${mine ? ' mine' : ''}`;
      const author = document.createElement('span');
      author.className = 'chat-message-author';
      author.textContent = mine ? (isAdmin() ? 'ASA Admin' : 'You') : (message.senderName || 'ASA Admin');
      const text = document.createElement('div');
      text.className = 'chat-message-bubble';
      text.textContent = message.messageText;
      const time = document.createElement('time');
      time.className = 'chat-message-time';
      time.dateTime = message.createdAt || '';
      time.textContent = formatTime(message.createdAt);
      bubble.append(author, text, time);
      panel.append(bubble);
    }
    panel.scrollTop = panel.scrollHeight;
  }

  async function loadMessages(conversationID) {
    const data = await request(`/conversations/${encodeURIComponent(conversationID)}/messages`);
    state.messages = data.messages || [];
    state.starterItem = null;
    renderHeader(data.conversation);
    renderMessages(state.messages);
    await loadConversations();
    document.getElementById('chatComposeHint').textContent = isAdmin() ? `Replying to ${data.conversation.participantName || 'ASA user'}.` : 'Messages are shared with ASA administrators.';
    document.getElementById('chatMessageInput').placeholder = 'Write a message…';
  }

  async function selectConversation(conversationID) {
    state.selectedID = Number(conversationID);
    state.starterItem = null;
    state.starterGeneral = false;
    document.getElementById('chatShell')?.classList.add('thread-open');
    document.getElementById('chatEmptyState').hidden = true;
    document.getElementById('chatActiveThread').hidden = false;
    renderConversationList();
    try {
      await loadMessages(state.selectedID);
      showStatus();
    } catch (err) { showStatus(err.message); }
  }

  async function openItemStarter(itemID) {
    try {
      const { item } = await request(`/items/${encodeURIComponent(itemID)}`);
      state.selectedID = null;
      state.starterItem = item;
      state.starterGeneral = false;
      document.getElementById('chatShell')?.classList.add('thread-open');
      document.getElementById('chatEmptyState').hidden = true;
      document.getElementById('chatActiveThread').hidden = false;
      renderHeader(null, item);
      renderMessages([]);
      document.getElementById('chatComposeHint').textContent = 'Your message will be shared with ASA administrators.';
      const input = document.getElementById('chatMessageInput');
      input.placeholder = 'Write a message…';
      input.focus();
    } catch (err) { showStatus(err.message); }
  }

  async function openGeneralStarter() {
    const existing = state.conversations.find(chat => chat.itemID == null);
    if (existing) return selectConversation(existing.conversationID);
    state.selectedID = null;
    state.starterItem = null;
    state.starterGeneral = true;
    document.getElementById('chatShell')?.classList.add('thread-open');
    document.getElementById('chatEmptyState').hidden = true;
    document.getElementById('chatActiveThread').hidden = false;
    renderHeader(null, { itemTitle: 'General inquiry', title: 'General inquiry' });
    renderMessages([]);
    document.getElementById('chatComposeHint').textContent = 'Your message will go directly to ASA administrators.';
    const input = document.getElementById('chatMessageInput');
    input.placeholder = 'Write a message to an administrator…';
    input.focus();
  }

  async function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chatMessageInput');
    const button = document.getElementById('chatSendButton');
    const message = input.value.trim();
    if (!message || state.sending) return;
    state.sending = true;
    button.disabled = true;
    showStatus();
    try {
      if (state.starterItem || state.starterGeneral) {
        const payload = { message };
        if (state.starterItem) payload.itemID = state.starterItem.itemID;
        const data = await request('/conversations', { method: 'POST', body: JSON.stringify(payload) });
        input.value = '';
        state.selectedID = Number(data.conversationID);
        state.starterGeneral = false;
        await loadConversations();
        document.getElementById('chatEmptyState').hidden = true;
        document.getElementById('chatActiveThread').hidden = false;
        await loadMessages(state.selectedID);
      } else if (state.selectedID) {
        await request(`/conversations/${encodeURIComponent(state.selectedID)}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
        input.value = '';
        await loadMessages(state.selectedID);
      } else {
        throw new Error('Select an item conversation before sending a message.');
      }
      showStatus();
    } catch (err) { showStatus(err.message); }
    finally { state.sending = false; button.disabled = false; input.focus(); }
  }

  async function initializeChatPage() {
    if (!token()) { window.location.replace('/login/login.html'); return; }
    if (state.initialized) return;
    state.initialized = true;
    const heading = document.getElementById('chatListSubtitle');
    if (heading) heading.textContent = isAdmin() ? 'Item and general inquiries' : 'Your messages to ASA administrators';
    document.getElementById('chatComposeForm')?.addEventListener('submit', sendMessage);
    document.getElementById('chatStartGeneral')?.addEventListener('click', openGeneralStarter);
    document.getElementById('chatStartGeneralEmpty')?.addEventListener('click', openGeneralStarter);
    document.getElementById('chatBackToList')?.addEventListener('click', () => document.getElementById('chatShell')?.classList.remove('thread-open'));
    document.getElementById('chatMessageInput')?.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); document.getElementById('chatComposeForm').requestSubmit(); }
    });
    try {
      const conversations = await loadConversations();
      const itemID = sessionStorage.getItem('asa_chat_item_id');
      sessionStorage.removeItem('asa_chat_item_id');
      if (itemID && !isAdmin()) {
        const existing = conversations.find(chat => String(chat.itemID) === String(itemID));
        if (existing) await selectConversation(existing.conversationID);
        else await openItemStarter(itemID);
      }
    } catch (err) { showStatus(err.message); }
    window.setInterval(() => {
      if (document.hidden) return;
      loadConversations().catch(() => {});
      if (state.selectedID) loadMessages(state.selectedID).catch(() => {});
    }, 30000);
  }

  function handleRealtime(event) {
    if (event.detail?.type !== 'chat-changed') return;
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => {
      loadConversations().catch(() => {});
      if (state.selectedID && (!event.detail.payload?.conversationID || Number(event.detail.payload.conversationID) === Number(state.selectedID))) {
        loadMessages(state.selectedID).catch(() => {});
      }
    }, 250);
  }

  if (!redirectStandaloneChat()) mountChatView();

  window.openASAChatForItem = async itemID => {
    if (!itemID) return;
    document.getElementById('itemModal')?.classList.remove('active');
    if (typeof window.showPage === 'function') window.showPage('chat');
    if (state.initPromise) await state.initPromise;
    const existing = state.conversations.find(chat => String(chat.itemID) === String(itemID));
    if (existing) await selectConversation(existing.conversationID);
    else await openItemStarter(itemID);
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('/chat.html')) return;
    attachUserNavigation();
    addItemInquiryAction();
    state.initPromise = initializeChatPage();
    if (window.location.hash === '#chat' && typeof window.showPage === 'function') window.showPage('chat');
    window.addEventListener('asa:realtime', handleRealtime);
  });
})();

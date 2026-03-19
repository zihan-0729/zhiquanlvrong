/**
 * 智权绿融 · 智能顾问 Chat Widget
 * 引入方式：在任意页面 </body> 前加 <script src="chat-widget.js"></script>
 * 后端地址：http://localhost:5000/chat  (app.py)
 */
(function () {
  'use strict';

  const API_URL = '/chat';

  const SYSTEM_PROMPT = `你是"绿融智顾"，智权绿融平台的专属AI助手。智权绿融是一个专注于植物新品种权质押融资的数字化服务平台，面向种业中小企业提供融资申请、价值评估、法律风控和数据分析等服务。

你的职责：
1. 解答用户关于植物新品种权质押融资的问题
2. 指导用户完成融资申请流程（企业信息→品种资料→融资需求→提交审核）
3. 解释价值评估方法（市场收益法、评估指标含义）
4. 普及相关法律知识（品种权保护、质押合同、合规要求）
5. 解读平台数据和功能模块
6. 提供农业金融政策资讯

回答风格：专业、简洁、友好。适当使用数字列表和分点说明。遇到具体金融决策建议提示用户咨询专业顾问。`;

  const QUICK_QUESTIONS = [
    '如何提交融资申请？',
    '品种权质押的条件是什么？',
    '价值评估需要多长时间？',
    '融资利率是多少？',
    '如何查看申请进度？',
    '什么是品种权指纹识别？',
  ];

  // ─── Inject styles ───────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --cw-green-dark: #1b4332;
      --cw-green-mid: #2d6a4f;
      --cw-green-light: #52b788;
      --cw-green-pale: #b7e4c7;
      --cw-gold: #c9a84c;
      --cw-bg: #f0f4f2;
      --cw-white: #ffffff;
      --cw-text: #1a2e23;
      --cw-text-mid: #4a6358;
      --cw-text-light: #8a9e94;
      --cw-shadow: 0 8px 40px rgba(27,67,50,0.18);
    }

    /* ── FAB Button ── */
    #cw-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9998;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--cw-green-mid), var(--cw-green-dark));
      box-shadow: 0 4px 20px rgba(27,67,50,0.35), 0 0 0 0 rgba(82,183,136,0.4);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      animation: cw-pulse 3s ease-in-out infinite;
    }
    #cw-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 28px rgba(27,67,50,0.45);
    }
    #cw-fab svg { width: 24px; height: 24px; transition: all 0.3s; }
    #cw-fab .cw-icon-chat { display: block; }
    #cw-fab .cw-icon-close { display: none; }
    #cw-fab.open .cw-icon-chat { display: none; }
    #cw-fab.open .cw-icon-close { display: block; }
    #cw-fab .cw-badge {
      position: absolute;
      top: 2px; right: 2px;
      width: 16px; height: 16px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
      font-size: 9px;
      color: white;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      font-family: sans-serif;
    }
    @keyframes cw-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(27,67,50,0.35), 0 0 0 0 rgba(82,183,136,0.4); }
      50% { box-shadow: 0 4px 20px rgba(27,67,50,0.35), 0 0 0 10px rgba(82,183,136,0); }
    }

    /* ── Panel ── */
    #cw-panel {
      position: fixed;
      bottom: 100px;
      right: 28px;
      z-index: 9999;
      width: 380px;
      height: 580px;
      background: var(--cw-white);
      border-radius: 20px;
      box-shadow: var(--cw-shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(27,67,50,0.08);
      transform: scale(0.92) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: bottom right;
    }
    #cw-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* ── Header ── */
    #cw-header {
      background: linear-gradient(135deg, var(--cw-green-dark) 0%, var(--cw-green-mid) 100%);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    #cw-header::after {
      content: '';
      position: absolute;
      right: -24px; top: -24px;
      width: 90px; height: 90px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }
    .cw-avatar {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--cw-green-light), var(--cw-gold));
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .cw-header-info { flex: 1; }
    .cw-header-name {
      font-size: 14px; font-weight: 700; color: white;
      font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
      letter-spacing: 0.5px;
    }
    .cw-header-status {
      font-size: 11px; color: rgba(255,255,255,0.7);
      display: flex; align-items: center; gap: 5px; margin-top: 2px;
    }
    .cw-status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--cw-green-light);
      animation: cw-blink 2s ease-in-out infinite;
    }
    @keyframes cw-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .cw-header-actions { display: flex; gap: 8px; }
    .cw-hbtn {
      width: 28px; height: 28px; border-radius: 8px;
      background: rgba(255,255,255,0.1);
      border: none; cursor: pointer; color: rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; transition: all 0.2s;
    }
    .cw-hbtn:hover { background: rgba(255,255,255,0.2); color: white; }

    /* ── Messages ── */
    #cw-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      scroll-behavior: smooth;
      background: #fafcfb;
    }
    #cw-messages::-webkit-scrollbar { width: 4px; }
    #cw-messages::-webkit-scrollbar-track { background: transparent; }
    #cw-messages::-webkit-scrollbar-thumb { background: #c8ddd0; border-radius: 2px; }

    /* Welcome card */
    .cw-welcome {
      background: linear-gradient(135deg, rgba(27,67,50,0.04), rgba(82,183,136,0.06));
      border: 1px solid rgba(82,183,136,0.15);
      border-radius: 14px;
      padding: 16px;
      text-align: center;
    }
    .cw-welcome-icon { font-size: 28px; margin-bottom: 8px; }
    .cw-welcome h4 {
      font-size: 14px; font-weight: 700; color: var(--cw-green-dark);
      font-family: 'Noto Serif SC', serif;
      margin-bottom: 4px;
    }
    .cw-welcome p { font-size: 12px; color: var(--cw-text-mid); line-height: 1.6; }

    /* Quick questions */
    .cw-quick-wrap {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .cw-quick-btn {
      padding: 5px 11px;
      background: white;
      border: 1.5px solid #d0e8d8;
      border-radius: 20px;
      font-size: 11px;
      color: var(--cw-green-mid);
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
      font-weight: 500;
    }
    .cw-quick-btn:hover {
      background: var(--cw-green-mid);
      color: white;
      border-color: var(--cw-green-mid);
      transform: translateY(-1px);
    }

    /* Message bubbles */
    .cw-msg { display: flex; gap: 8px; align-items: flex-end; }
    .cw-msg.user { flex-direction: row-reverse; }
    .cw-msg-avatar {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; flex-shrink: 0;
    }
    .cw-msg.bot .cw-msg-avatar {
      background: linear-gradient(135deg, var(--cw-green-light), var(--cw-gold));
    }
    .cw-msg.user .cw-msg-avatar {
      background: var(--cw-green-dark);
      color: white; font-weight: 700; font-size: 11px;
    }
    .cw-bubble {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.65;
      font-family: 'Noto Sans SC', sans-serif;
    }
    .cw-msg.bot .cw-bubble {
      background: white;
      color: var(--cw-text);
      border: 1px solid rgba(27,67,50,0.07);
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(27,67,50,0.06);
    }
    .cw-msg.user .cw-bubble {
      background: linear-gradient(135deg, var(--cw-green-mid), var(--cw-green-dark));
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 8px rgba(27,67,50,0.2);
    }
    .cw-bubble b, .cw-bubble strong { font-weight: 700; }
    .cw-bubble ul { padding-left: 16px; margin: 4px 0; }
    .cw-bubble li { margin-bottom: 2px; }
    .cw-time {
      font-size: 10px; color: var(--cw-text-light);
      margin-top: 3px; padding: 0 4px;
    }
    .cw-msg.user .cw-time { text-align: right; }

    /* Typing indicator */
    .cw-typing .cw-bubble {
      padding: 12px 16px;
    }
    .cw-dots {
      display: flex; gap: 4px; align-items: center;
    }
    .cw-dots span {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--cw-green-light);
      animation: cw-dot 1.2s ease-in-out infinite;
    }
    .cw-dots span:nth-child(2) { animation-delay: 0.2s; }
    .cw-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cw-dot {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Error bubble */
    .cw-error-bubble {
      font-size: 12px; color: #dc2626;
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 10px; padding: 8px 12px;
      max-width: 80%;
    }

    /* ── Quick tags divider ── */
    .cw-divider {
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; color: var(--cw-text-light);
    }
    .cw-divider::before, .cw-divider::after {
      content: ''; flex: 1; height: 1px; background: #e4ede7;
    }

    /* ── Input Area ── */
    #cw-input-area {
      padding: 12px 14px;
      border-top: 1px solid #e8f0ea;
      background: white;
      flex-shrink: 0;
    }
    #cw-input-row {
      display: flex; align-items: flex-end; gap: 8px;
      background: #f0f4f2;
      border-radius: 12px;
      padding: 8px 10px;
      border: 1.5px solid transparent;
      transition: border-color 0.2s;
    }
    #cw-input-row:focus-within {
      border-color: var(--cw-green-light);
      background: white;
    }
    #cw-textarea {
      flex: 1;
      border: none;
      background: none;
      resize: none;
      font-size: 13px;
      color: var(--cw-text);
      font-family: 'Noto Sans SC', sans-serif;
      outline: none;
      max-height: 100px;
      line-height: 1.5;
      padding: 0;
    }
    #cw-textarea::placeholder { color: var(--cw-text-light); }
    #cw-send-btn {
      width: 34px; height: 34px; border-radius: 9px;
      background: linear-gradient(135deg, var(--cw-green-light), var(--cw-green-mid));
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(82,183,136,0.3);
    }
    #cw-send-btn:hover:not(:disabled) { transform: scale(1.05); }
    #cw-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    #cw-send-btn svg { width: 16px; height: 16px; color: white; fill: white; }
    #cw-input-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 8px; padding: 0 2px;
    }
    #cw-char-hint { font-size: 10px; color: var(--cw-text-light); }
    #cw-powered { font-size: 10px; color: var(--cw-text-light); }
    #cw-powered span { color: var(--cw-green-mid); font-weight: 600; }

    /* ── Connecting state banner ── */
    #cw-offline-banner {
      display: none;
      background: #fffbeb; border-bottom: 1px solid #fde68a;
      padding: 7px 14px; font-size: 11px; color: #92400e;
      text-align: center; flex-shrink: 0;
    }
    #cw-offline-banner.show { display: block; }

    /* ── Mobile responsive ── */
    @media (max-width: 480px) {
      #cw-panel {
        width: calc(100vw - 16px);
        right: 8px;
        bottom: 90px;
        height: 70vh;
      }
      #cw-fab { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ─── HTML structure ───────────────────────────────────────────────────────────
  const container = document.createElement('div');
  container.id = 'cw-root';
  container.innerHTML = `
    <!-- FAB -->
    <button id="cw-fab" title="智能顾问">
      <span class="cw-badge">1</span>
      <!-- Chat icon -->
      <svg class="cw-icon-chat" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <!-- Close icon -->
      <svg class="cw-icon-close" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <!-- Panel -->
    <div id="cw-panel">
      <!-- Header -->
      <div id="cw-header">
        <div class="cw-avatar">🌱</div>
        <div class="cw-header-info">
          <div class="cw-header-name">绿融智顾</div>
          <div class="cw-header-status">
            <span class="cw-status-dot"></span>
            智能问答顾问 · 随时为您服务
          </div>
        </div>
        <div class="cw-header-actions">
          <button class="cw-hbtn" id="cw-clear-btn" title="清空对话">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.88"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Offline banner -->
      <div id="cw-offline-banner">
        ⚠️ 未连接到后端服务（localhost:5000），请确认 app.py 已启动
      </div>

      <!-- Messages -->
      <div id="cw-messages">
        <div class="cw-welcome">
          <div class="cw-welcome-icon">🌾</div>
          <h4>您好，我是绿融智顾！</h4>
          <p>专注于植物新品种权质押融资领域，可为您解答融资申请、价值评估、法律风控等专业问题。</p>
        </div>
        <div class="cw-divider">快捷提问</div>
        <div class="cw-quick-wrap" id="cw-quick-wrap"></div>
      </div>

      <!-- Input -->
      <div id="cw-input-area">
        <div id="cw-input-row">
          <textarea id="cw-textarea" placeholder="输入您的问题..." rows="1" maxlength="500"></textarea>
          <button id="cw-send-btn" title="发送 (Enter)">
            <svg viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
          </button>
        </div>
        <div id="cw-input-footer">
          <span id="cw-char-hint">Enter 发送 · Shift+Enter 换行</span>
          <span id="cw-powered">Powered by <span>智谱 GLM-4</span></span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // ─── DOM refs ─────────────────────────────────────────────────────────────────
  const fab = document.getElementById('cw-fab');
  const panel = document.getElementById('cw-panel');
  const messages = document.getElementById('cw-messages');
  const textarea = document.getElementById('cw-textarea');
  const sendBtn = document.getElementById('cw-send-btn');
  const clearBtn = document.getElementById('cw-clear-btn');
  const quickWrap = document.getElementById('cw-quick-wrap');
  const offlineBanner = document.getElementById('cw-offline-banner');
  const badge = fab.querySelector('.cw-badge');

  // ─── State ────────────────────────────────────────────────────────────────────
  let isOpen = false;
  let isStreaming = false;
  let history = [{ role: 'system', content: SYSTEM_PROMPT }];
  let unread = 1;

  // ─── Quick questions ──────────────────────────────────────────────────────────
  QUICK_QUESTIONS.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'cw-quick-btn';
    btn.textContent = q;
    btn.onclick = () => sendMessage(q);
    quickWrap.appendChild(btn);
  });

  // ─── Toggle panel ─────────────────────────────────────────────────────────────
  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    fab.classList.toggle('open', isOpen);
    if (isOpen) {
      unread = 0;
      badge.style.display = 'none';
      setTimeout(() => textarea.focus(), 350);
    }
  });

  clearBtn.addEventListener('click', () => {
    if (isStreaming) return;
    history = [{ role: 'system', content: SYSTEM_PROMPT }];
    messages.innerHTML = `
      <div class="cw-welcome">
        <div class="cw-welcome-icon">🌾</div>
        <h4>对话已清空</h4>
        <p>随时开始新的提问，我随时为您服务！</p>
      </div>
      <div class="cw-divider">快捷提问</div>
      <div class="cw-quick-wrap" id="cw-quick-wrap"></div>
    `;
    const newWrap = document.getElementById('cw-quick-wrap');
    QUICK_QUESTIONS.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'cw-quick-btn';
      btn.textContent = q;
      btn.onclick = () => sendMessage(q);
      newWrap.appendChild(btn);
    });
  });

  // ─── Auto-resize textarea ─────────────────────────────────────────────────────
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  });

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────────
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', () => sendMessage());

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function getTime() {
    const d = new Date();
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(text) {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Simple markdown renderer: **bold**, `code`, - list item, numbered list
  function renderMd(raw) {
    let html = escapeHtml(raw);
    // bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f4f2;padding:1px 4px;border-radius:3px;font-size:12px;font-family:monospace">$1</code>');
    // numbered list lines
    html = html.replace(/^(\d+)\.\s(.+)$/gm, '<li>$2</li>');
    // bullet lines
    html = html.replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');
    // wrap consecutive <li> in <ul>
    html = html.replace(/((<li>.*?<\/li>\n?)+)/gs, '<ul style="padding-left:18px;margin:4px 0">$1</ul>');
    // line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  function appendUserMsg(text) {
    const div = document.createElement('div');
    div.className = 'cw-msg user';
    div.innerHTML = `
      <div>
        <div class="cw-bubble">${escapeHtml(text)}</div>
        <div class="cw-time">${getTime()}</div>
      </div>
      <div class="cw-msg-avatar">我</div>
    `;
    messages.appendChild(div);
    scrollToBottom();
  }

  function appendTyping() {
    const div = document.createElement('div');
    div.className = 'cw-msg bot cw-typing';
    div.id = 'cw-typing-indicator';
    div.innerHTML = `
      <div class="cw-msg-avatar">🌱</div>
      <div class="cw-bubble">
        <div class="cw-dots"><span></span><span></span><span></span></div>
      </div>
    `;
    messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function appendBotMsg(content) {
    const typing = document.getElementById('cw-typing-indicator');
    if (typing) typing.remove();

    const div = document.createElement('div');
    div.className = 'cw-msg bot';
    div.innerHTML = `
      <div class="cw-msg-avatar">🌱</div>
      <div>
        <div class="cw-bubble" id="cw-streaming-bubble"></div>
        <div class="cw-time">${getTime()}</div>
      </div>
    `;
    messages.appendChild(div);
    scrollToBottom();
    return document.getElementById('cw-streaming-bubble');
  }

  function appendErrorMsg(msg) {
    const typing = document.getElementById('cw-typing-indicator');
    if (typing) typing.remove();
    const div = document.createElement('div');
    div.className = 'cw-msg bot';
    div.innerHTML = `
      <div class="cw-msg-avatar">🌱</div>
      <div class="cw-error-bubble">⚠️ ${escapeHtml(msg)}</div>
    `;
    messages.appendChild(div);
    scrollToBottom();
  }

  // ─── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage(overrideText) {
    const text = (overrideText || textarea.value).trim();
    if (!text || isStreaming) return;

    // Reset input
    if (!overrideText) {
      textarea.value = '';
      textarea.style.height = 'auto';
    }

    isStreaming = true;
    sendBtn.disabled = true;
    textarea.disabled = true;

    // Append user bubble
    appendUserMsg(text);

    // Add to history
    history.push({ role: 'user', content: text });

    // Show typing
    appendTyping();

    // Stream from backend
    let fullContent = '';
    let bubble = null;

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.filter(m => m.role !== 'system' || history.indexOf(m) === 0) }),
        signal: AbortSignal.timeout(60000),
      });

      if (!resp.ok) throw new Error(`服务器错误 ${resp.status}`);

      offlineBanner.classList.remove('show');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);

            if (parsed.content) {
              if (!bubble) bubble = appendBotMsg('');
              fullContent += parsed.content;
              bubble.innerHTML = renderMd(fullContent);
              scrollToBottom();
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }

      if (!bubble) appendErrorMsg('未收到回复，请重试。');
      else history.push({ role: 'assistant', content: fullContent });

    } catch (err) {
      offlineBanner.classList.add('show');
      if (err.name === 'TypeError' || err.message.includes('fetch')) {
        appendErrorMsg('无法连接到后端服务，请确认 app.py 已在本地启动（python app.py）');
      } else {
        appendErrorMsg('请求失败：' + err.message);
      }
      history.pop(); // remove failed user message from history
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      textarea.disabled = false;
      textarea.focus();

      // Remove streaming bubble id
      if (bubble) bubble.removeAttribute('id');
    }
  }

  // ─── Check backend connectivity ───────────────────────────────────────────────
  async function checkBackend() {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      await fetch(API_URL.replace('/chat', '/'), { signal: ctrl.signal });
    } catch {
      // Silently fail — will show banner on first send attempt
    }
  }
  checkBackend();

})();

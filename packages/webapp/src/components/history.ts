import { LitElement, css, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement, property } from 'lit/decorators.js';
import panelSvg from '../../assets/panel.svg?raw';
import deleteSvg from '../../assets/delete.svg?raw';
import newChatSvg from '../../assets/new-chat.svg?raw';
import { store } from '../store.js';

export type HistoryComponentOptions = {
  strings: {
    openSidebar: string;
    closeSidebar: string;
    chats: string;
    deleteChatButton: string;
    errorMessage: string;
    noChatHistory: string;
  };
};

export const historyDefaultOptions: HistoryComponentOptions = {
  strings: {
    openSidebar: 'Open sidebar',
    closeSidebar: 'Close sidebar',
    chats: 'Chats',
    deleteChatButton: 'Delete chat',
    errorMessage: 'Cannot load chat history',
    noChatHistory: 'No chat history',
  },
};

@customElement('azc-history')
export class HistoryComponent extends LitElement {
  @property({
    type: Object,
    converter: (value) => ({ ...historyDefaultOptions, ...JSON.parse(value ?? '{}') }),
  })
  options: HistoryComponentOptions = historyDefaultOptions;

  @property() userId = ''; // Kept for compatibility but store handles it

  // Getters from store
  get chats() { return store.sortedChats; }
  get open() { return store.isSidebarOpen; }
  get isLoading() {
    // We only show loading in history if we are loading the LIST itself
    // or if we want to show loading stat per chat item?
    // For now, let's just ignore global loading here or maybe show a spinner if list is empty and fetching?
    // We don't expose 'isFetchingList' in store yet. Let's assume initialized.
    return false;
  }
  get activeChatId() { return store.activeChatId; }
  get hasError() { return !!store.globalError; }

  override connectedCallback() {
    super.connectedCallback();
    store.addEventListener('state-changed', this.handleStateChange);
    // Initialize store if not already? Store inits on demand or we call init here.
    // Let's call init once.
    if (this.chats.length === 0) {
      store.init();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    store.removeEventListener('state-changed', this.handleStateChange);
  }

  handleStateChange = () => {
    this.requestUpdate();
  };

  onPanelClicked() {
    store.setSidebarOpen(!this.open);
  }

  async onChatClicked(sessionId: string) {
    await store.selectChat(sessionId);
    if (window.innerWidth < 800) {
      store.setSidebarOpen(false);
    }
  }

  async onDeleteChatClicked(sessionId: string) {
    await store.deleteChat(sessionId);
  }

  onNewChatClicked() {
    store.createNewChat();
  }

  protected renderNoChatHistory = () =>
    this.chats.length === 0 && !this.isLoading && !this.hasError
      ? html`<div class="message">${this.options.strings.noChatHistory}</div>`
      : nothing;

  protected renderError = () =>
    this.hasError ? html`<div class="message error">${store.globalError || this.options.strings.errorMessage}</div>` : nothing;

  protected renderPanelButton = (standalone?: boolean) => html`
    <button
      class="icon-button ${standalone ? 'panel-button' : ''}"
      @click=${this.onPanelClicked}
      title=${this.open ? this.options.strings.closeSidebar : this.options.strings.openSidebar}
    >
      ${unsafeSVG(panelSvg)}
    </button>
  `;

  protected renderChatEntry = (entry: any) => html`
    <a
      class="chat-entry ${this.activeChatId === entry.id ? 'active' : ''}"
      href="#"
      @click=${(event: Event) => {
      event.preventDefault();
      this.onChatClicked(entry.id);
    }}
      title=${entry.title}
    >
      <span class="chat-title">${entry.title}</span>
      ${entry.isStreaming ? html`<span class="typing-indicator-small">...</span>` : nothing}
      <button
        class="icon-button"
        @click=${(event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.onDeleteChatClicked(entry.id);
    }}
        title="${this.options.strings.deleteChatButton}"
      >
        ${unsafeSVG(deleteSvg)}
      </button>
    </a>
  `;

  protected override render() {
    return html`<aside class="chats-panel">
        <div class="buttons">
          ${this.renderPanelButton()}
          <slot name="buttons"></slot>
        </div>
        <div class="chats">
          <div class="new-chat-section">
            <h2>New Chat</h2>
            <button class="new-chat-btn" @click=${this.onNewChatClicked}>
              ${unsafeSVG(newChatSvg)} New Chat
            </button>
          </div>
          <h2>${this.options.strings.chats}</h2>
          ${repeat(this.chats, (entry) => entry.id, (entry) => this.renderChatEntry(entry))}
          ${this.renderNoChatHistory()} ${this.renderError()}
        </div>
      </aside>
      ${this.open ? nothing : this.renderPanelButton(true)} `;
  }

  static override styles = css`
    :host {
      /* Base properties */
      --primary: var(--azc-primary, #07f);
      --bg: var(--azc-bg, #eee);
      --error: var(--azc-error, #e30);
      --text-color: var(--azc-text-color, #000);
      --space-md: var(--azc-space-md, 12px);
      --space-xl: var(--azc-space-xl, calc(var(--space-md) * 2));
      --space-xs: var(--azc-space-xs, calc(var(--space-md) / 2));
      --space-xxs: var(--azc-space-xs, calc(var(--space-md) / 4));
      --border-radius: var(--azc-border-radius, 16px);
      --focus-outline: var(--azc-focus-outline, 2px solid);
      --overlay-color: var(--azc-overlay-color, rgba(0 0 0 / 40%));

      /* Component-specific properties */
      --panel-bg: var(--azc-panel-bg, #fff);
      --panel-width: var(--azc-panel-width, 300px);
      --panel-shadow: var(--azc-panel-shadow, 0 0 10px rgba(0, 0, 0, 0.1));
      --error-color: var(--azc-error-color, var(--error));
      --error-border: var(--azc-error-border, none);
      --error-bg: var(--azc-error-bg, var(--card-bg));
      --icon-button-color: var(--azc-icon-button-color, var(--text-color));
      --icon-button-bg: var(--azc-icon-button-bg, none);
      --icon-button-bg-hover: var(--azc-icon-button-bg, rgba(0, 0, 0, 0.07));
      --panel-button-color: var(--azc-panel-button-color, var(--text-color));
      --panel-button-bg: var(--azc-panel-button-bg, var(--bg));
      --panel-button-bg-hover: var(--azc-panel-button-bg, hsl(from var(--panel-button-bg) h s calc(l - 6)));
      --chat-entry-bg: var(--azc-chat-entry-bg, none);
      --chat-entry-bg-hover: var(--azc-chat-entry-bg-hover, #f0f0f0);

      width: 0;
      transition: width 0.3s ease;
      overflow: hidden;
    }
    :host([open]) {
      /* This [open] selector likely won't update automatically based on getter unless we reflect property. 
         But we removed the property reflection. We should rely on class update or just always show based on component update 
      */
    }
    /* We need to use CSS variable or class binding for width since 'open' is now a getter from store 
       and we can't reflect it easily without @property. 
       Actually, let's just manually set the style or attribute in Updated? 
       OR just rely on the fact that if 'open' is false, we set width: 0 via styles?
    */
    .chats-panel {
        width: var(--panel-width);
        height: 100%;
        background: var(--panel-bg);
        overflow: auto;
    }
    
    /* Dynamic width handling */
    :host {
       width: var(--current-width, 0px);
    }
    
    .panel-button {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      margin: var(--space-xs);
      background: var(--panel-button-bg);
      color: var(--panel-button-color);

      &:hover {
        background: var(--panel-button-bg-hover);
      }
    }
    @media (width < 800px) {
      .chats-panel {
         /* Mobile behavior needs work with store */
      }
    }
    *:focus-visible {
      outline: var(--focus-outline) var(--primary);
    }
    button {
      border-radius: calc(var(--border-radius) / 2);
      outline: var(--focus-outline) transparent;
      transition: outline 0.3s ease;
      cursor: pointer;
    }
    h2 {
      margin: var(--space-md) 0 0 0;
      padding: var(--space-xs) var(--space-md);
      font-size: 0.9rem;
      font-weight: 600;
    }
    .buttons {
      display: flex;
      justify-content: space-between;
      padding: var(--space-xs);
      position: sticky;
      top: 0;
      background: var(--panel-bg);
      box-shadow: 0 var(--space-xs) var(--space-xs) var(--panel-bg);
    }

    .chats {
      margin: 0;
      padding: 0;
      font-size: 0.9rem;
    }
    .chat-title {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      flex: 1;
    }
    .chat-entry {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-xxs) var(--space-xxs) var(--space-xxs) var(--space-xs);
      margin: 0 var(--space-xs);
      border-radius: calc(var(--border-radius) / 2);
      color: var(--text-color);
      text-decoration: none;
      background: var(--chat-entry-bg);
      border-left: 3px solid transparent;

      & .icon-button {
        flex: 0 0 auto;
        padding: var(--space-xxs);
        width: 28px;
        height: 28px;
      }

      &:hover {
        background: var(--chat-entry-bg-hover);
      }
      
      &.active {
          background: var(--chat-entry-bg-hover);
          border-left: 3px solid var(--primary);
          font-weight: 600;
      }

      &:not(:focus):not(:hover) .icon-button:not(:focus) {
        opacity: 0;
      }
    }
    .message {
      padding: var(--space-xs) var(--space-md);
    }
    .error {
      color: var(--error-color);
    }
    .icon-button {
      width: 36px;
      height: 36px;
      padding: var(--space-xs);
      background: none;
      border: none;
      background: var(--icon-button-bg);
      color: var(--icon-button-color);
      font-size: 1.5rem;
      &:hover:not(:disabled) {
        background: var(--icon-button-bg-hover);
        color: var(--icon-button-color);
      }
    }
    
    /* ADDED FOR NEW CHAT FEATURE */
    .new-chat-section {
      padding: 0 var(--space-md);
      margin-bottom: var(--space-md);
    }
    .new-chat-btn {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: var(--border-radius);
      font-size: 1rem;
      cursor: pointer;
      font-weight: 600;
    }
    .new-chat-btn:hover {
      opacity: 0.9;
    }
    .new-chat-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .typing-indicator-small {
        font-size: 0.8rem;
        color: var(--primary);
        animation: blink 1.5s infinite;
    }
    @keyframes blink {
        0% { opacity: 0.2; }
        50% { opacity: 1; }
        100% { opacity: 0.2; }
    }
  `;

  protected override updated() {
    // Manually reflect open state to styles since we removed the reflected property
    // Or just set the property on the style?
    this.style.setProperty('--current-width', this.open ? 'var(--panel-width)' : '0px');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'azc-history': HistoryComponent;
  }
}

import * as React from 'react';
import MarkdownIt from 'markdown-it';
import katex from 'katex';

const h = React.createElement;

const NS = 'dsh-im-phone-chat';
const PANEL_ID = 'dsh-im-phone-chat';
    const RETAIN_SOURCE = 'phoneChatMirror';

    // IM workspaces come from dsh-im's public management RPC; the constant is
    // only the fallback for profiles where that channel is disabled.
    const FALLBACK_WORKSPACES = ['D:\\Users\\Daliy\\QQ'];
    const IM_RPC_CHANNELS = [
      'qq', 'weixin', 'feishu', 'dingtalk', 'wecom', 'wecom-app', 'slack',
      'telegram', 'discord', 'whatsapp', 'imessage', 'matrix', 'office', 'email',
    ];
    // Text blocks dsh-im appends to a real user message for its own bookkeeping.
    const WRAPPER_PREFIXES = ['<dsh_im_files>', '<dsh_im_source>', '<dsh_im_reply_to>', '<dsh_im_source_guidance>'];
    // Session-title prefixes emitted by dsh-im for channel conversations. Older
    // phone sessions can lose their workspace registration, so a title prefix is
    // the only channel marker that still identifies them.
    const CHANNEL_TITLE_PREFIXES = [
      '微信 · ', 'WeChat · ', '飞书 · ', 'Feishu · ', '钉钉 · ', 'DingTalk · ',
      '企业微信 · ', 'WeCom · ', 'QQ · ', 'Slack · ', 'Telegram · ', 'Discord · ',
      'WhatsApp · ', 'iMessage · ', 'Matrix · ', 'AI Office · ',
    ];
    const SHORT_DATE = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' });

    // ------------------------------------------------------ markdown + math
    // Messages are model output, so the mirror renders Markdown and KaTeX.
    // KaTeX uses MathML output: Chromium renders it natively, so no font files
    // or external stylesheet have to be served with the plugin.
    const markdown = new MarkdownIt({
      html: false,
      linkify: true,
      breaks: true,
      typographer: false,
    });
    const MATH_OPEN = '\uE000';
    const MATH_CLOSE = '\uE001';
    const MATH_TOKEN = /\uE000(\d+)\uE001/gu;

    function renderMathToken(tex, display) {
      return katex.renderToString(tex, {
        displayMode: display,
        output: 'mathml',
        throwOnError: false,
        strict: false,
        trust: false,
      });
    }

    function renderInlineText(text) {
      const math = [];
      const stash = (tex, display) => {
        math.push(renderMathToken(tex, display));
        return `${MATH_OPEN}${math.length - 1}${MATH_CLOSE}`;
      };
      let source = String(text);
      // Display math first, then inline forms, then single-dollar inline math.
      source = source.replace(/\$\$([\s\S]+?)\$\$/gu, (_match, tex) => stash(tex, true));
      source = source.replace(/\\\[([\s\S]+?)\\\]/gu, (_match, tex) => stash(tex, true));
      source = source.replace(/\\\(([\s\S]+?)\\\)/gu, (_match, tex) => stash(tex, false));
      source = source.replace(/\$(?!\$)((?:\\.|[^$\\])+?)\$/gu, (_match, tex) => stash(tex, false));
      let html = markdown.render(source);
      html = html.replace(MATH_TOKEN, (_match, index) => math[Number(index)] ?? '');
      return html;
    }

    /** Render one message's Markdown, keeping fenced code blocks out of math. */
    function renderRichText(text) {
      const value = String(text ?? '');
      if (value === '') return '';
      const segments = value.split(/(```[\s\S]*?```)/gu);
      return segments.map((segment, index) => {
        if (index % 2 === 1) return markdown.render(segment);
        return renderInlineText(segment);
      }).join('');
    }

    const zh = {
      'panel.label': '手机聊天',
      'panel.title': '手机聊天',
      'panel.subtitle': '实时同步手机 IM 通道里的消息与助手回复（只读镜像）',
      'panel.conversation': '会话',
      'panel.openSession': '在会话中打开',
      'panel.running': '正在回复…',
      'panel.statusLive': '实时同步中',
      'panel.loading': '正在载入会话…',
      'panel.loadOlder': '加载更早消息',
      'panel.loadingOlder': '正在加载…',
      'panel.userLabel': '手机',
      'panel.assistantLabel': '助手',
      'panel.image': '[图片]',
      'panel.noSessionsShort': '暂无会话',
      'panel.empty.noSessions': '还没有找到手机通道的会话。在手机上发一条消息，这里会自动出现。',
      'panel.empty.noMessages': '这个会话还没有消息。',
      'panel.errorPrefix': '加载失败：',
      'panel.footerNote': '只读镜像：消息来自手机 IM 通道，助手回复会自动同步到这里。',
      'panel.hookMissing': '当前 DSH 版本没有提供会话列表能力，无法同步手机会话。',
      'panel.removed': '这个会话已被删除。',
      'panel.pending': '正在读取会话列表…',
      'panel.imageUnavailable': '图片暂不可用',
      'panel.imageClickHint': '点击放大/旋转',
      'panel.closePreview': '点击任意位置关闭预览',
      'panel.rotateLeft': '↺ 左转 90°',
      'panel.rotateRight': '↻ 右转 90°',
      'panel.rotateReset': '重置方向',
      'panel.close': '关闭',
    };

    const en = {
      'panel.label': 'Phone chat',
      'panel.title': 'Phone chat',
      'panel.subtitle': 'Live read-only mirror of the phone IM conversation and assistant replies.',
      'panel.conversation': 'Conversation',
      'panel.openSession': 'Open session',
      'panel.running': 'Replying…',
      'panel.statusLive': 'Live',
      'panel.loading': 'Loading conversation…',
      'panel.loadOlder': 'Load earlier messages',
      'panel.loadingOlder': 'Loading…',
      'panel.userLabel': 'Phone',
      'panel.assistantLabel': 'Assistant',
      'panel.image': '[image]',
      'panel.noSessionsShort': 'No conversation',
      'panel.empty.noSessions': 'No phone channel conversation found yet. Send a message from your phone and it appears here.',
      'panel.empty.noMessages': 'This conversation has no messages yet.',
      'panel.errorPrefix': 'Failed to load: ',
      'panel.footerNote': 'Read-only mirror: messages come from the phone IM channel; assistant replies sync here automatically.',
      'panel.hookMissing': 'This DSH build does not expose the session list, so phone conversations cannot be mirrored.',
      'panel.removed': 'This conversation was removed.',
      'panel.pending': 'Reading conversations…',
      'panel.imageUnavailable': 'Image unavailable',
      'panel.imageClickHint': 'Click to enlarge / rotate',
      'panel.closePreview': 'Click anywhere to close',
      'panel.rotateLeft': '↺ Rotate left 90°',
      'panel.rotateRight': '↻ Rotate right 90°',
      'panel.rotateReset': 'Reset rotation',
      'panel.close': 'Close',
    };

    // ---------------------------------------------------------------- helpers
    function samePath(left, right) {
      if (typeof left !== 'string' || typeof right !== 'string') return false;
      return left.replace(/[\\/]+$/u, '').toLowerCase() === right.replace(/[\\/]+$/u, '').toLowerCase();
    }

    function normalizePath(value) {
      if (typeof value !== 'string') return '';
      return value.replace(/\\/gu, '/').replace(/\/+$/u, '').toLowerCase();
    }

    function hasChannelTitle(summary) {
      if (summary === null || typeof summary !== 'object') return false;
      const title = typeof summary.title === 'string' ? summary.title : '';
      return CHANNEL_TITLE_PREFIXES.some((prefix) => title.startsWith(prefix));
    }

    function isChannelUserMessage(message) {
      if (message === null || typeof message !== 'object') return false;
      const source = message.source;
      if (source === null || typeof source !== 'object') return false;
      if (source.kind !== 'user') return false;
      // Web-GUI typed messages carry no rpcId; IM-channel messages do.
      return typeof source.rpcId === 'string' && source.rpcId !== '';
    }

    function userVisibleText(content) {
      if (!Array.isArray(content)) return '';
      const parts = [];
      for (const block of content) {
        if (block === null || typeof block !== 'object') continue;
        if (block.type !== 'text' || typeof block.text !== 'string' || block.text === '') continue;
        if (WRAPPER_PREFIXES.some((prefix) => block.text.startsWith(prefix))) continue;
        // dsh-im placeholders that only describe the inline image below.
        if (block.text.startsWith('图片原文件已保存到工作区')) continue;
        if (/^图片\s*\d*\s*[（(]原图文件[:：][\s\S]*[）)]$/u.test(block.text.trim())) continue;
        parts.push(block.text);
      }
      return parts.join('\n').trim();
    }

    function assistantVisibleText(content) {
      if (!Array.isArray(content)) return '';
      const parts = [];
      for (const block of content) {
        if (block === null || typeof block !== 'object') continue;
        if (block.type === 'text' && typeof block.text === 'string' && block.text !== '') parts.push(block.text);
      }
      return parts.join('\n\n').trim();
    }

    /** Collect the image attachments of one message content array. */
    function collectImages(content) {
      if (!Array.isArray(content)) return [];
      const images = [];
      for (const block of content) {
        if (block === null || typeof block !== 'object' || block.type !== 'image') continue;
        const attachment = block.attachment !== null && typeof block.attachment === 'object' ? block.attachment : {};
        images.push({
          attachmentId: typeof attachment.attachmentId === 'string' ? attachment.attachmentId : '',
          mediaType: typeof attachment.mediaType === 'string' ? attachment.mediaType : '',
          width: typeof attachment.width === 'number' ? attachment.width : 0,
          height: typeof attachment.height === 'number' ? attachment.height : 0,
          bytes: typeof attachment.bytes === 'number' ? attachment.bytes : 0,
          name: typeof attachment.name === 'string' ? attachment.name : '',
        });
      }
      return images;
    }

    function timeLabel(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      try {
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }

    function newStep() {
      return { blocks: new Map(), final: null };
    }

    /** Fold one transient assistant stream chunk into a step's text blocks. */
    function foldChunk(step, chunk) {
      if (chunk === null || typeof chunk !== 'object') return;
      const index = Number.isInteger(chunk.index) ? chunk.index : 0;
      switch (chunk.type) {
        case 'block-start': {
          step.blocks.set(index, { kind: chunk.blockType, text: '' });
          break;
        }
        case 'text-delta': {
          const current = step.blocks.get(index);
          const base = current !== undefined && current.kind === 'text' ? current.text : '';
          step.blocks.set(index, { kind: 'text', text: base + String(chunk.text ?? '') });
          break;
        }
        case 'block-end': {
          const block = chunk.block;
          if (block !== null && typeof block === 'object' && block.type === 'text') step.blocks.set(index, { kind: 'text', text: String(block.text ?? '') });
          else if (block !== null && typeof block === 'object' && block.type === 'reasoning') step.blocks.set(index, { kind: 'reasoning', text: String(block.text ?? '') });
          else step.blocks.set(index, { kind: 'other', text: '' });
          break;
        }
        default:
          break;
      }
    }

    function stepText(step) {
      const rows = [...step.blocks.entries()].sort((a, b) => a[0] - b[0]);
      return rows.map(([, block]) => (block !== undefined && block.kind === 'text' ? block.text : '')).filter(Boolean).join('\n');
    }

    /**
     * Fold the continuous session event window into chat rows in event order.
     * A user message closes the current assistant bubble and consecutive
     * assistant messages merge into one bubble, so phone messages that queue or
     * steer into a running turn keep their real position instead of landing
     * after (or before) the whole turn's reply.
     */
    function reduceMessages(entries, sessionRunning) {
      const ordered = entries
        .filter((entry) => entry !== null && entry !== undefined && entry.event !== null && entry.event !== undefined)
        .slice()
        .sort((left, right) => (left.event.seq ?? 0) - (right.event.seq ?? 0));
      const rows = [];
      const settledSteps = new Set();
      const liveSteps = new Map();
      let assistant = null;
      const stepKey = (data) => `${String(data.turn)}:${String(data.step)}`;
      const ensureAssistant = (seq, time) => {
        if (assistant === null) {
          assistant = {
            kind: 'assistant',
            key: `assistant-${String(seq)}`,
            seq,
            time,
            text: '',
            images: [],
            live: false,
          };
          rows.push(assistant);
        }
        return assistant;
      };

      for (const entry of ordered) {
        const event = entry.event;
        const data = event.data !== null && typeof event.data === 'object' ? event.data : {};
        if (event.type === 'user/message') {
          if (event.surfaceOp !== undefined && event.surfaceOp !== 'append') continue;
          if (!isChannelUserMessage(data)) continue;
          const text = userVisibleText(data.content);
          const images = collectImages(data.content);
          if (text === '' && images.length === 0) continue;
          assistant = null;
          rows.push({
            kind: 'user',
            key: `user-${typeof data.id === 'string' ? data.id : String(event.seq)}`,
            seq: event.seq,
            time: event.time,
            text,
            images,
          });
          continue;
        }
        if (event.type === 'assistant/message') {
          if (event.surfaceOp !== undefined && event.surfaceOp !== 'append') continue;
          const key = stepKey(data);
          settledSteps.add(key);
          liveSteps.delete(key);
          const text = assistantVisibleText(data.message && data.message.content);
          if (text === '') continue;
          const row = ensureAssistant(event.seq, event.time);
          row.text = row.text === '' ? text : `${row.text}\n\n${text}`;
          continue;
        }
        if (event.type === 'assistant/live-chunk') {
          const key = stepKey(data);
          if (settledSteps.has(key)) continue;
          let step = liveSteps.get(key);
          if (step === undefined) {
            step = { seq: event.seq, time: event.time, blocks: new Map() };
            liveSteps.set(key, step);
          }
          foldChunk({ blocks: step.blocks }, data.chunk);
        }
      }

      // The active streamed step has no settled message yet: append it last.
      const liveEntries = [...liveSteps.values()].sort((left, right) => (left.seq ?? 0) - (right.seq ?? 0));
      const liveParts = liveEntries.map((step) => stepText({ blocks: step.blocks })).filter(Boolean);
      if (liveParts.length > 0) {
        const last = liveEntries[liveEntries.length - 1];
        const row = ensureAssistant(last.seq ?? 0, last.time ?? 0);
        const text = liveParts.join('\n\n');
        row.text = row.text === '' ? text : `${row.text}\n\n${text}`;
        row.live = sessionRunning === true;
      } else if (assistant !== null && sessionRunning === true) {
        assistant.live = true;
      }

      if (rows.length > 400) rows.splice(0, rows.length - 400);
      return rows;
    }

    function errorText(error) {
      if (error === null || error === undefined) return '';
      if (typeof error === 'string') return error;
      if (typeof error.message === 'string' && error.message !== '') return error.message;
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    }

    // ------------------------------------------------------------- components
    function PanelIcon({ size = 18 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' },
      },
      h('path', { d: 'M20 12.4c0 3.7-3.6 6.7-8 6.7-.9 0-1.8-.1-2.6-.4L4 21l1.3-3.6C3.9 16.1 3 14.3 3 12.4 3 8.7 6.6 5.7 11 5.7s9 3 9 6.7Z' }),
      h('path', { d: 'M7.6 12.4h.01M11 12.4h.01M14.4 12.4h.01', strokeWidth: 2.3 }));
    }

    function createTranslator(tFromSlot) {
      if (typeof tFromSlot === 'function') {
        return (key) => {
          try {
            const value = tFromSlot(key);
            return typeof value === 'string' && value !== '' ? value : (zh[key] ?? key);
          } catch {
            return zh[key] ?? key;
          }
        };
      }
      return (key) => zh[key] ?? key;
    }

    function MessageImage({ session, image, t }) {
      const holderRef = React.useRef(null);
      const [visible, setVisible] = React.useState(false);
      const [state, setState] = React.useState({ phase: 'idle', url: null, error: null });
      const [zoomed, setZoomed] = React.useState(false);
      const [rotation, setRotation] = React.useState(0);
      const [loadedSize, setLoadedSize] = React.useState(null);
      const [viewport, setViewport] = React.useState(() => ({
        width: typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 1280,
        height: typeof window !== 'undefined' && Number.isFinite(window.innerHeight) ? window.innerHeight : 800,
      }));
      const label = image.name !== ''
        ? image.name
        : (image.width > 0 && image.height > 0 ? `${String(image.width)}×${String(image.height)}` : t('panel.image'));

      // Fetch bytes only when the image scrolls near the viewport: old phone
      // conversations can hold dozens of large photos.
      React.useEffect(() => {
        const node = holderRef.current;
        if (node === null) return undefined;
        if (typeof IntersectionObserver !== 'function') {
          setVisible(true);
          return undefined;
        }
        const observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            observer.disconnect();
          }
        }, { rootMargin: '320px' });
        observer.observe(node);
        return () => observer.disconnect();
      }, []);

      React.useEffect(() => {
        if (!visible) return undefined;
        const attachmentId = image.attachmentId;
        if (attachmentId === '' || session === null || session === undefined || typeof session.readAttachment !== 'function') {
          setState({ phase: 'missing', url: null, error: null });
          return undefined;
        }
        let cancelled = false;
        let objectUrl = null;
        setState({ phase: 'loading', url: null, error: null });
        Promise.resolve(session.readAttachment(attachmentId)).then((result) => {
          if (cancelled) return;
          const value = result !== null && typeof result === 'object' && result.ok === true ? result.value : null;
          const data = value !== null && typeof value === 'object' ? value.data : null;
          if (!data) throw new Error(t('panel.imageUnavailable'));
          const attachmentMeta = value !== null && typeof value === 'object' ? value.attachment : null;
          const mediaType = attachmentMeta !== null && typeof attachmentMeta === 'object' && typeof attachmentMeta.mediaType === 'string'
            ? attachmentMeta.mediaType
            : (image.mediaType !== '' ? image.mediaType : 'image/*');
          objectUrl = URL.createObjectURL(new Blob([data], { type: mediaType }));
          setState({ phase: 'ready', url: objectUrl, error: null });
        }).catch((error) => {
          if (!cancelled) setState({ phase: 'error', url: null, error: errorText(error) });
        });
        return () => {
          cancelled = true;
          if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        };
      }, [visible, session, image.attachmentId, image.mediaType, t]);

      // Keep the rotated visual box inside the viewport: CSS max-* rules apply to
      // the unrotated layout box, which crops tall portrait images after a 90°
      // turn, so the preview sizes the image explicitly instead.
      React.useEffect(() => {
        if (!zoomed) return undefined;
        const update = () => setViewport({
          width: Number.isFinite(window.innerWidth) ? window.innerWidth : 1280,
          height: Number.isFinite(window.innerHeight) ? window.innerHeight : 800,
        });
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
      }, [zoomed]);

      const preview = React.useMemo(() => {
        const imageStyle = { transform: `rotate(${String(rotation)}deg)` };
        const stageStyle = {};
        const width = image.width > 0 ? image.width : (loadedSize === null ? 0 : loadedSize.width);
        const height = image.height > 0 ? image.height : (loadedSize === null ? 0 : loadedSize.height);
        if (width <= 0 || height <= 0) return { imageStyle, stageStyle };
        const rotated = rotation % 180 !== 0;
        const maxWidth = Math.max(160, viewport.width - 96);
        const maxHeight = Math.max(160, viewport.height - 176);
        const scale = Math.min(
          maxWidth / (rotated ? height : width),
          maxHeight / (rotated ? width : height),
          1,
        );
        const elementWidth = Math.round(width * scale);
        const elementHeight = Math.round(height * scale);
        imageStyle.width = `${String(elementWidth)}px`;
        imageStyle.height = `${String(elementHeight)}px`;
        imageStyle.maxWidth = 'none';
        imageStyle.maxHeight = 'none';
        // Reserve the rotated visual box: a transform does not change the layout
        // box, and without this the rotated landscape images overlap the toolbar.
        stageStyle.width = `${String(rotated ? elementHeight : elementWidth)}px`;
        stageStyle.height = `${String(rotated ? elementWidth : elementHeight)}px`;
        return { imageStyle, stageStyle };
      }, [rotation, image.width, image.height, loadedSize, viewport]);

      let content;
      if (state.phase === 'ready' && state.url !== null) {
        content = h('img', {
          className: 'dsh-im-phone-chat-image',
          src: state.url,
          alt: label,
          title: `${label} · ${t('panel.imageClickHint')}`,
          onClick: () => setZoomed(true),
        });
      } else if (state.phase === 'error' || state.phase === 'missing') {
        content = h('div', { className: 'dsh-im-phone-chat-imagePlaceholder is-error' },
          h('span', null, `${t('panel.imageUnavailable')} · ${label}`),
          state.error === null ? null : h('span', { className: 'dsh-im-phone-chat-imageError' }, state.error));
      } else {
        content = h('div', { className: 'dsh-im-phone-chat-imagePlaceholder' },
          h('span', { className: 'dsh-im-phone-chat-typing' }, h('i'), h('i'), h('i')),
          h('span', null, label));
      }

      return h('div', { className: 'dsh-im-phone-chat-imageHolder', ref: holderRef },
        content,
        zoomed && state.url !== null ? h('div', {
          className: 'dsh-im-phone-chat-lightbox',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': label,
          onClick: () => { setRotation(0); setZoomed(false); },
        },
        h('div', { className: 'dsh-im-phone-chat-lightboxBar', onClick: (event) => event.stopPropagation() },
          h('button', {
            type: 'button',
            className: 'dsh-im-phone-chat-lightboxButton',
            onClick: () => setRotation((value) => (value + 270) % 360),
          }, t('panel.rotateLeft')),
          h('button', {
            type: 'button',
            className: 'dsh-im-phone-chat-lightboxButton',
            onClick: () => setRotation((value) => (value + 90) % 360),
          }, t('panel.rotateRight')),
          h('button', {
            type: 'button',
            className: 'dsh-im-phone-chat-lightboxButton',
            disabled: rotation === 0,
            onClick: () => setRotation(0),
          }, t('panel.rotateReset')),
          h('button', {
            type: 'button',
            className: 'dsh-im-phone-chat-lightboxButton',
            onClick: () => { setRotation(0); setZoomed(false); },
          }, t('panel.close'))),
        h('div', { className: 'dsh-im-phone-chat-lightboxStage', style: preview.stageStyle },
          h('img', {
            className: 'dsh-im-phone-chat-lightboxImage',
            src: state.url,
            alt: label,
            style: preview.imageStyle,
            onLoad: (event) => {
              const target = event.target;
              if (target && target.naturalWidth > 0 && target.naturalHeight > 0) {
                setLoadedSize({ width: target.naturalWidth, height: target.naturalHeight });
              }
            },
            onClick: (event) => event.stopPropagation(),
          })),
        h('div', { className: 'dsh-im-phone-chat-lightboxHint' }, t('panel.closePreview'))) : null);
    }

    function MessageImages({ session, images, t }) {
      if (!Array.isArray(images) || images.length === 0) return null;
      return h('div', { className: 'dsh-im-phone-chat-images' },
        images.map((image, index) => h(MessageImage, {
          key: image.attachmentId !== '' ? image.attachmentId : `image-${String(index)}`,
          session,
          image,
          t,
        })));
    }

    function MessageBubble({ row, session, t }) {
      const user = row.kind === 'user';
      const stamp = timeLabel(row.time);
      const images = Array.isArray(row.images) ? row.images : [];
      // Streamed text renders as plain text: a half-written formula would flash
      // KaTeX parse errors. Settled messages render Markdown + math.
      const rich = row.live !== true && row.text !== '';
      const html = React.useMemo(() => (rich ? renderRichText(row.text) : ''), [rich, row.text]);
      let body;
      if (row.text === '') {
        body = images.length > 0 ? null : h('div', { className: 'dsh-im-phone-chat-bubbleText dsh-im-phone-chat-bubbleTextEmpty' },
          row.live === true ? h('span', { className: 'dsh-im-phone-chat-typing' }, h('i'), h('i'), h('i')) : null);
      } else if (rich) {
        body = h('div', {
          className: 'dsh-im-phone-chat-bubbleText dsh-im-phone-chat-rich',
          dangerouslySetInnerHTML: { __html: html },
        });
      } else {
        body = h('div', { className: 'dsh-im-phone-chat-bubbleText' },
          row.text,
          row.live === true ? h('span', { className: 'dsh-im-phone-chat-caret' }) : null);
      }
      return h('div', { className: `dsh-im-phone-chat-row ${user ? 'is-user' : 'is-assistant'}` },
        h('div', { className: 'dsh-im-phone-chat-bubble' },
          h('div', { className: 'dsh-im-phone-chat-bubbleMeta' },
            h('span', { className: 'dsh-im-phone-chat-role' }, t(user ? 'panel.userLabel' : 'panel.assistantLabel')),
            stamp === '' ? null : h('span', { className: 'dsh-im-phone-chat-time' }, stamp)),
          body,
          h(MessageImages, { session, images, t })));
    }

    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      render() {
        if (this.state.error !== null) {
          return h('div', { className: 'dsh-im-phone-chat-root' },
            h('div', { className: 'dsh-im-phone-chat-notice is-error' },
              `手机聊天面板出错：${errorText(this.state.error)}`));
        }
        return this.props.children;
      }
    }

export const inject = ['slots', 'sessions', 'locale', 'connection'];

export function apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-im-phone-chat: locale');
        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.pluginCss = 'dsh-im-phone-chat';
          style.textContent = cssText();
          document.head.appendChild(style);
          return () => style.remove();
        }, 'dsh-im-phone-chat: styles');

        const t = ctx.locale.bind(NS);
        const sessions = ctx.get('sessions');
        const connection = ctx.get('connection');

        function MirrorBody({ binding, title, t: tl }) {
          const eventWindow = React.useSyncExternalStore(
            React.useCallback((listener) => binding.eventSource.subscribe(listener), [binding]),
            React.useCallback(() => binding.eventSource.getSnapshot(), [binding]),
            React.useCallback(() => binding.eventSource.getSnapshot(), [binding]),
          );
          const sessionSnapshot = React.useSyncExternalStore(
            React.useCallback((listener) => binding.session.subscribe(listener), [binding]),
            React.useCallback(() => binding.session.getSnapshot(), [binding]),
            React.useCallback(() => binding.session.getSnapshot(), [binding]),
          );
          const running = sessionSnapshot.running === true;
          const rows = React.useMemo(
            () => reduceMessages(Array.isArray(eventWindow.entries) ? eventWindow.entries : [], running),
            [eventWindow, running],
          );
          const listRef = React.useRef(null);
          const stickRef = React.useRef(true);
          const restoreRef = React.useRef(null);

          const signature = `${String(rows.length)}:${rows.length === 0 ? '0' : String(rows[rows.length - 1].text.length)}`;
          React.useLayoutEffect(() => {
            const element = listRef.current;
            if (element === null) return;
            const restore = restoreRef.current;
            if (restore !== null) {
              restoreRef.current = null;
              element.scrollTop = restore.top + (element.scrollHeight - restore.height);
              return;
            }
            if (stickRef.current) element.scrollTop = element.scrollHeight;
          }, [signature, running]);

          const onScroll = React.useCallback(() => {
            const element = listRef.current;
            if (element === null) return;
            stickRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
          }, []);

          const onLoadOlder = React.useCallback(() => {
            const element = listRef.current;
            if (element !== null) restoreRef.current = { height: element.scrollHeight, top: element.scrollTop };
            Promise.resolve(binding.session.loadOlder()).catch(() => {});
          }, [binding]);

          const body = [];
          if (sessionSnapshot.openState === 'error') {
            body.push(h('div', { className: 'dsh-im-phone-chat-notice is-error', key: 'openError' },
              tl('panel.errorPrefix') + errorText(sessionSnapshot.openError)));
          } else if (sessionSnapshot.removed === true) {
            body.push(h('div', { className: 'dsh-im-phone-chat-notice', key: 'removed' }, tl('panel.removed')));
          } else if (rows.length === 0 && sessionSnapshot.openState !== 'open') {
            body.push(h('div', { className: 'dsh-im-phone-chat-notice', key: 'loading' }, tl('panel.loading')));
          } else {
            const hasMore = eventWindow.hasMore === true;
            if (hasMore) {
              body.push(h('button', {
                type: 'button',
                className: 'dsh-im-phone-chat-loadOlder',
                key: 'older',
                onClick: onLoadOlder,
              }, sessionSnapshot.loadingOlder === true ? tl('panel.loadingOlder') : tl('panel.loadOlder')));
            }
            if (rows.length === 0) {
              body.push(h('div', { className: 'dsh-im-phone-chat-notice', key: 'empty' }, tl('panel.empty.noMessages')));
            }
            for (const row of rows) body.push(h(MessageBubble, { key: row.key, row, session: binding.session, t: tl }));
            if (running) {
              body.push(h('div', { className: 'dsh-im-phone-chat-typingRow', key: 'typing' },
                h('span', { className: 'dsh-im-phone-chat-typing' }, h('i'), h('i'), h('i')),
                h('span', null, tl('panel.running'))));
            }
          }

          return h('div', { className: 'dsh-im-phone-chat-body', ref: listRef, onScroll }, body);
        }

        function PhoneChatPanel(props) {
          const tr = createTranslator(props && props.t);
          const list = typeof props.useSessions === 'function' ? props.useSessions((snapshot) => snapshot) : null;
          const workspaces = typeof props.useWorkspaces === 'function' ? props.useWorkspaces((snapshot) => snapshot) : null;
          const [workspacePaths, setWorkspacePaths] = React.useState(() => FALLBACK_WORKSPACES.map(normalizePath));
          const [selectedId, setSelectedId] = React.useState(null);
          const [retained, setRetained] = React.useState({ status: 'idle' });

          // Discover IM workspaces through dsh-im's public management RPC.
          React.useEffect(() => {
            let cancelled = false;
            if (connection === null || connection === undefined || !connection.rpc || typeof connection.rpc.call !== 'function') {
              return undefined;
            }
            (async () => {
              const found = new Set(FALLBACK_WORKSPACES.map(normalizePath));
              await Promise.all(IM_RPC_CHANNELS.map(async (channel) => {
                try {
                  const raw = await connection.rpc.call('/api', `dsh-im/${channel}`, { method: 'connection.status', payload: {} });
                  const value = raw !== null && typeof raw === 'object' && raw.ok === true ? raw.value : raw;
                  const snapshot = value !== null && typeof value === 'object' && value.snapshot !== undefined ? value.snapshot : value;
                  const bots = snapshot !== null && typeof snapshot === 'object' && Array.isArray(snapshot.bots) ? snapshot.bots : [];
                  for (const bot of bots) {
                    const path = bot !== null && typeof bot === 'object' ? bot.workspace : undefined;
                    if (typeof path === 'string' && path !== '') found.add(normalizePath(path));
                  }
                } catch {
                  // Channel not installed in this profile.
                }
              }));
              if (!cancelled) setWorkspacePaths([...found]);
            })();
            return () => { cancelled = true; };
          }, []);

          const candidates = React.useMemo(() => {
            if (list === null || typeof list !== 'object') return [];
            const byId = list.byId !== null && typeof list.byId === 'object' ? list.byId : {};
            const candidatesInternal = [];
            const known = new Set();
            const workspaceIds = new Set();
            const workspaceItems = workspaces !== null && workspaces !== undefined && Array.isArray(workspaces.items) ? workspaces.items : [];
            for (const workspace of workspaceItems) {
              if (workspace === null || typeof workspace !== 'object') continue;
              if (!workspacePaths.includes(normalizePath(workspace.path))) continue;
              for (const id of Array.isArray(workspace.sessionIds) ? workspace.sessionIds : []) workspaceIds.add(id);
            }
            const isChannelTitled = (summary) => hasChannelTitle(summary);
            const ids = Array.isArray(list.ids) ? list.ids : Object.keys(byId);
            for (const id of ids) {
              const summary = byId[id];
              if (summary === null || typeof summary !== 'object') continue;
              if (summary.blank === true) continue;
              const inWorkspace = workspaceIds.has(id) || workspacePaths.includes(normalizePath(summary.cwd));
              if (!inWorkspace && !isChannelTitled(summary)) continue;
              if (known.has(summary.id)) continue;
              known.add(summary.id);
              candidatesInternal.push(summary);
            }
            candidatesInternal.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
            return candidatesInternal;
          }, [list, workspaces, workspacePaths]);

          const runningSessionId = candidates.find((row) => row.running === true)?.id ?? null;
          const previousRunningRef = React.useRef(null);

          // Pick the initial conversation and follow a conversation that newly
          // starts running; never override a manual pick just because the list
          // snapshot was refreshed.
          React.useEffect(() => {
            setSelectedId((current) => {
              const exists = current !== null && candidates.some((row) => row.id === current);
              const startedRunning = runningSessionId !== null
                && runningSessionId !== previousRunningRef.current
                && runningSessionId !== current;
              if (startedRunning) return runningSessionId;
              if (exists) return current;
              // Prefer a real channel conversation (title prefixed by dsh-im)
              // over a work session that merely lives in the channel workspace.
              const preferred = candidates.find((row) => hasChannelTitle(row)) ?? candidates[0];
              return runningSessionId ?? (preferred === undefined ? null : preferred.id);
            });
            previousRunningRef.current = runningSessionId;
          }, [candidates, runningSessionId]);

          // Retain the selected session and expose its binding to the body.
          React.useEffect(() => {
            if (sessions === null || sessions === undefined || selectedId === null || selectedId === undefined) {
              setRetained({ status: 'idle' });
              return undefined;
            }
            let reference;
            try {
              reference = sessions.retain(selectedId, { source: RETAIN_SOURCE });
            } catch (error) {
              setRetained({ status: 'error', message: errorText(error) });
              return undefined;
            }
            let disposed = false;
            setRetained({ status: 'pending' });
            reference.ready.then((binding) => {
              if (!disposed) setRetained({ status: 'ready', binding });
            }, (error) => {
              if (!disposed) setRetained({ status: 'error', message: errorText(error) });
            });
            return () => {
              disposed = true;
              try {
                reference.release();
              } catch {
                // Idempotent release.
              }
            };
          }, [sessions, selectedId]);

          const openSession = React.useCallback(() => {
            if (selectedId === null) return;
            const workspace = ctx.get('uiWorkspace');
            if (workspace && typeof workspace.openSession === 'function') workspace.openSession(selectedId);
          }, [selectedId]);

          if (list === null) {
            return h('div', { className: 'dsh-im-phone-chat-root' },
              h('div', { className: 'dsh-im-phone-chat-notice is-error' }, tr('panel.hookMissing')));
          }

          const sessionLabel = (row) => {
            const title = typeof row.title === 'string' && row.title.trim() !== '' ? row.title.trim() : (typeof row.displayTitle === 'string' ? row.displayTitle : '');
            const base = title === '' ? row.id : title;
            if (typeof row.updatedAt !== 'number' || !Number.isFinite(row.updatedAt)) return base;
            try {
              return `${base} · ${SHORT_DATE.format(new Date(row.updatedAt))}`;
            } catch {
              return base;
            }
          };
          const running = candidates.some((row) => row.running === true);
          const listPhase = list.phase === 'pending' ? 'pending' : 'ready';

          let content;
          if (retained.status === 'ready') {
            const current = candidates.find((row) => row.id === selectedId);
            content = h(MirrorBody, { binding: retained.binding, title: current === undefined ? null : sessionLabel(current), t: tr });
          } else if (retained.status === 'error') {
            content = h('div', { className: 'dsh-im-phone-chat-notice is-error' },
              tr('panel.errorPrefix') + retained.message);
          } else if (retained.status === 'pending') {
            content = h('div', { className: 'dsh-im-phone-chat-notice' }, tr('panel.loading'));
          } else if (listPhase === 'pending') {
            content = h('div', { className: 'dsh-im-phone-chat-notice' }, tr('panel.pending'));
          } else {
            content = h('div', { className: 'dsh-im-phone-chat-notice' }, tr('panel.empty.noSessions'));
          }

          return h('div', { className: 'dsh-im-phone-chat-root' },
            h('header', { className: 'dsh-im-phone-chat-header' },
              h('div', { className: 'dsh-im-phone-chat-heading' },
                h('div', { className: 'dsh-im-phone-chat-title' }, tr('panel.title')),
                h('div', { className: 'dsh-im-phone-chat-subtitle' }, tr('panel.subtitle'))),
              h('div', { className: 'dsh-im-phone-chat-toolbar' },
                h('label', { className: 'dsh-im-phone-chat-field' },
                  h('span', { className: 'dsh-im-phone-chat-fieldLabel' }, tr('panel.conversation')),
                  h('select', {
                    className: 'dsh-im-phone-chat-select',
                    value: selectedId ?? '',
                    onChange: (event) => setSelectedId(event.target.value === '' ? null : event.target.value),
                  },
                  candidates.length === 0
                    ? h('option', { value: '' }, tr('panel.noSessionsShort'))
                    : candidates.map((row) => h('option', { key: row.id, value: row.id }, sessionLabel(row))))),
                h('span', { className: `dsh-im-phone-chat-status${running ? ' is-running' : ''}` },
                  h('span', { className: 'dsh-im-phone-chat-dot' }),
                  h('span', null, running ? tr('panel.running') : tr('panel.statusLive'))),
                h('button', {
                  type: 'button',
                  className: 'dsh-im-phone-chat-button',
                  onClick: openSession,
                  disabled: selectedId === null,
                }, tr('panel.openSession')))),
            content,
            h('footer', { className: 'dsh-im-phone-chat-footer' }, tr('panel.footerNote')));
        }

        ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          locale: NS,
          label: () => t('panel.label'),
        }, PanelIcon)), 'dsh-im-phone-chat: sidebar entry');

        ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, (props) => h(PanelBoundary, null, h(PhoneChatPanel, props)))), 'dsh-im-phone-chat: main panel');
}

// Exported only for the pre-flight harness; it has no runtime consumers.
export const __test = Object.freeze({
  reduceMessages,
  userVisibleText,
  assistantVisibleText,
  collectImages,
  isChannelUserMessage,
  renderRichText,
  MessageBubble,
});

// ------------------------------------------------------------------- CSS
function cssText() {
      return `
.dsh-im-phone-chat-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 1.6;
  padding-top: var(--dsh-frame-top-clearance, 0px);
  box-sizing: border-box;
}
.dsh-im-phone-chat-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: flex-end;
  justify-content: space-between;
  padding: 20px 24px 14px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  flex: 0 0 auto;
}
.dsh-im-phone-chat-heading { min-width: 220px; }
.dsh-im-phone-chat-title { font-size: 20px; font-weight: 600; letter-spacing: .01em; }
.dsh-im-phone-chat-subtitle { margin-top: 2px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.dsh-im-phone-chat-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.dsh-im-phone-chat-field { display: flex; align-items: center; gap: 8px; }
.dsh-im-phone-chat-fieldLabel { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.dsh-im-phone-chat-select {
  min-width: 190px;
  max-width: 320px;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--dsw-radius-md, 8px);
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
}
.dsh-im-phone-chat-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  white-space: nowrap;
}
.dsh-im-phone-chat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary);
  display: inline-block;
}
.dsh-im-phone-chat-status.is-running .dsh-im-phone-chat-dot { background: var(--dsw-alias-brand-primary); }
.dsh-im-phone-chat-button {
  height: 30px;
  padding: 0 12px;
  border-radius: var(--dsw-radius-md, 8px);
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.dsh-im-phone-chat-button:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dsh-im-phone-chat-button:disabled { opacity: .5; cursor: default; }
.dsh-im-phone-chat-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 18px max(16px, calc((100% - 880px) / 2)) 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dsh-im-phone-chat-row { display: flex; flex-direction: column; max-width: min(680px, 86%); }
.dsh-im-phone-chat-row.is-user { align-self: flex-end; align-items: flex-end; }
.dsh-im-phone-chat-row.is-assistant { align-self: flex-start; align-items: flex-start; }
.dsh-im-phone-chat-bubble {
  border-radius: var(--dsw-radius-lg, 14px);
  padding: 10px 14px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  max-width: 100%;
  box-sizing: border-box;
}
.dsh-im-phone-chat-row.is-user .dsh-im-phone-chat-bubble {
  border-bottom-right-radius: 4px;
  background: var(--dsw-specific-bubble, var(--dsw-alias-bg-layer-2));
}
.dsh-im-phone-chat-row.is-assistant .dsh-im-phone-chat-bubble { border-bottom-left-radius: 4px; }
.dsh-im-phone-chat-bubbleMeta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font-size: 11px;
}
.dsh-im-phone-chat-role { font-weight: 600; }
.dsh-im-phone-chat-bubbleText { white-space: pre-wrap; overflow-wrap: anywhere; }
.dsh-im-phone-chat-imageLine { margin-top: 4px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
/* Inline images fetched through session.readAttachment(). */
.dsh-im-phone-chat-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.dsh-im-phone-chat-imageHolder { max-width: 100%; }
.dsh-im-phone-chat-image {
  display: block;
  max-width: min(340px, 100%);
  max-height: 280px;
  border-radius: var(--dsw-radius-md, 8px);
  border: 0.5px solid var(--dsw-alias-border-l2);
  cursor: zoom-in;
  object-fit: contain;
  background: var(--dsw-alias-bg-base);
}
.dsh-im-phone-chat-imagePlaceholder {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  max-width: min(340px, 100%);
  padding: 14px 16px;
  border-radius: var(--dsw-radius-md, 8px);
  border: 0.5px dashed var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.dsh-im-phone-chat-imagePlaceholder.is-error { color: var(--dsw-alias-state-error-primary); flex-direction: column; align-items: flex-start; }
.dsh-im-phone-chat-imageError { font-size: 11px; opacity: .85; }
.dsh-im-phone-chat-lightbox {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 72%, transparent);
  backdrop-filter: blur(6px);
  cursor: zoom-out;
}
.dsh-im-phone-chat-lightboxBar {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  cursor: default;
  padding: 6px 10px;
  border-radius: var(--dsw-radius-lg, 12px);
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));
  box-shadow: var(--dsw-shadow-lv2, none);
}
.dsh-im-phone-chat-lightboxButton {
  height: 30px;
  padding: 0 12px;
  border-radius: var(--dsw-radius-md, 8px);
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.dsh-im-phone-chat-lightboxButton:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dsh-im-phone-chat-lightboxButton:disabled { opacity: .45; cursor: default; }
.dsh-im-phone-chat-lightboxStage {
  position: relative;
  z-index: 1;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  max-width: 100%;
  overflow: visible;
}
.dsh-im-phone-chat-lightboxImage {
  flex: none;
  max-width: 92vw;
  max-height: 78vh;
  object-fit: contain;
  border-radius: var(--dsw-radius-lg, 12px);
  box-shadow: var(--dsw-shadow-lv3, 0 12px 40px rgba(0, 0, 0, .35));
  cursor: default;
  transition: transform .15s ease;
}
.dsh-im-phone-chat-lightboxHint { position: relative; z-index: 3; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.dsh-im-phone-chat-caret {
  display: inline-block;
  width: 6px;
  height: 1.02em;
  margin-left: 2px;
  vertical-align: -2px;
  background: var(--dsw-alias-brand-primary);
  animation: dsh-im-phone-chat-blink 1s steps(2, start) infinite;
}
@keyframes dsh-im-phone-chat-blink { 50% { opacity: 0; } }
.dsh-im-phone-chat-typing { display: inline-flex; align-items: center; gap: 4px; }
.dsh-im-phone-chat-typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary);
  animation: dsh-im-phone-chat-bounce 1.2s infinite ease-in-out;
  display: inline-block;
}
.dsh-im-phone-chat-typing i:nth-child(2) { animation-delay: .15s; }
.dsh-im-phone-chat-typing i:nth-child(3) { animation-delay: .3s; }
@keyframes dsh-im-phone-chat-bounce { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }
.dsh-im-phone-chat-typingRow {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  padding: 2px 4px;
}
.dsh-im-phone-chat-notice {
  align-self: center;
  margin: auto;
  max-width: 520px;
  text-align: center;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  padding: 28px 16px;
}
.dsh-im-phone-chat-notice.is-error { color: var(--dsw-alias-state-error-primary); }
.dsh-im-phone-chat-loadOlder {
  align-self: center;
  border: 1px solid var(--dsw-alias-border-l1);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  border-radius: 999px;
  padding: 4px 14px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  flex: 0 0 auto;
}
.dsh-im-phone-chat-loadOlder:hover { background: var(--dsw-alias-bg-layer-1); }
.dsh-im-phone-chat-footer {
  flex: 0 0 auto;
  padding: 10px 24px;
  border-top: 0.5px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
/* Rendered message body (Markdown + KaTeX MathML). */
.dsh-im-phone-chat-rich { white-space: normal; }
.dsh-im-phone-chat-rich > :first-child { margin-top: 0; }
.dsh-im-phone-chat-rich > :last-child { margin-bottom: 0; }
.dsh-im-phone-chat-rich p { margin: 0 0 .55em; }
.dsh-im-phone-chat-rich h1,
.dsh-im-phone-chat-rich h2,
.dsh-im-phone-chat-rich h3,
.dsh-im-phone-chat-rich h4 {
  margin: .7em 0 .35em;
  font-size: 1.05em;
  font-weight: 600;
  line-height: 1.4;
}
.dsh-im-phone-chat-rich ul,
.dsh-im-phone-chat-rich ol { margin: .2em 0 .55em; padding-left: 1.4em; }
.dsh-im-phone-chat-rich li { margin: .15em 0; }
.dsh-im-phone-chat-rich blockquote {
  margin: .4em 0;
  padding: .1em .8em;
  border-left: 3px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
.dsh-im-phone-chat-rich code {
  font-family: var(--ds-font-family-code, ui-monospace, "Cascadia Code", Consolas, monospace);
  font-size: .92em;
  padding: .1em .3em;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-im-phone-chat-rich pre {
  margin: .45em 0;
  padding: 10px 12px;
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-2);
  overflow-x: auto;
}
.dsh-im-phone-chat-rich pre code { padding: 0; background: none; }
.dsh-im-phone-chat-rich a { color: var(--dsw-alias-brand-primary); text-decoration: none; }
.dsh-im-phone-chat-rich a:hover { text-decoration: underline; }
.dsh-im-phone-chat-rich table {
  border-collapse: collapse;
  margin: .45em 0;
  font-size: .95em;
}
.dsh-im-phone-chat-rich th,
.dsh-im-phone-chat-rich td {
  border: 1px solid var(--dsw-alias-border-l1);
  padding: 4px 8px;
  text-align: left;
}
.dsh-im-phone-chat-rich th { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }
.dsh-im-phone-chat-rich hr { border: none; border-top: 1px solid var(--dsw-alias-border-l1); margin: .6em 0; }
/* KaTeX MathML output: no font files required. */
.dsh-im-phone-chat-rich .katex { color: inherit; font-size: 1.05em; }
.dsh-im-phone-chat-rich .katex-display {
  display: block;
  margin: .5em 0;
  overflow-x: auto;
  overflow-y: hidden;
}
.dsh-im-phone-chat-rich .katex .katex-mathml { position: absolute; clip: rect(1px, 1px, 1px, 1px); width: 1px; height: 1px; overflow: hidden; }
.dsh-im-phone-chat-rich .katex .katex-html { display: none; }
.dsh-im-phone-chat-rich math { font-size: 1.05em; }
.dsh-im-phone-chat-rich .katex-error { color: var(--dsw-alias-state-error-primary); font-family: var(--ds-font-family-code, monospace); }
`;
}

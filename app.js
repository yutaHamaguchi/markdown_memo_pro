document.addEventListener('DOMContentLoaded', () => {
  // クリップボード履歴のインスタンスを作成
  const clipboardHistory = new ClipboardHistory();
  const mainContent = document.getElementById('main-content');
  
  // ツールバーの作成
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  
  const copyAllBtn = document.createElement('button');
  copyAllBtn.innerHTML = '📋 全体をコピー';
  copyAllBtn.className = 'toolbar-button';
  
  const copyMarkdownBtn = document.createElement('button');
  copyMarkdownBtn.innerHTML = '📝 マークダウンをコピー';
  copyMarkdownBtn.className = 'toolbar-button';
  
  const copyHtmlBtn = document.createElement('button');
  copyHtmlBtn.innerHTML = '🌐 HTMLをコピー';
  copyHtmlBtn.className = 'toolbar-button';
  
  toolbar.appendChild(copyMarkdownBtn);
  toolbar.appendChild(copyHtmlBtn);
  toolbar.appendChild(copyAllBtn);
  
  // エディタコンテナの作成
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  
  // 入力エリアの作成
  const inputArea = document.createElement('div');
  inputArea.className = 'input-area';
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'マークダウンを入力してください...';
  inputArea.appendChild(textarea);
  
  // プレビューエリアの作成
  const previewArea = document.createElement('div');
  previewArea.className = 'preview-area';
  
  // トースト通知用の要素
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.display = 'none';
  
  // エディタコンテナに追加
  mainContent.appendChild(toolbar);
  editorContainer.appendChild(inputArea);
  editorContainer.appendChild(previewArea);
  mainContent.appendChild(editorContainer);
  mainContent.appendChild(toast);


    // クリップボード履歴の更新関数
  function updateClipboardHistoryUI() {
    const historyContainer = document.getElementById('clipboardHistory');
    historyContainer.innerHTML = '';
    
    clipboardHistory.getItems().forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const content = document.createElement('div');
      content.className = 'history-item-content';
      content.textContent = item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '');
      
      const meta = document.createElement('div');
      meta.className = 'history-item-meta';
      
      const time = document.createElement('span');
      time.className = 'history-item-time';
      time.textContent = new Date(item.timestamp).toLocaleString();
      
      const type = document.createElement('span');
      type.className = 'history-item-type';
      type.textContent = item.type;
      
      meta.appendChild(time);
      meta.appendChild(type);
      
      historyItem.appendChild(content);
      historyItem.appendChild(meta);
      
      // クリックでテキストエリアに挿入
      historyItem.addEventListener('click', () => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        textarea.value = text.substring(0, start) + item.content + text.substring(end);
        updatePreview();
        showToast('テキストを挿入しました');
      });
      
      historyContainer.appendChild(historyItem);
    });
  }

  // クリップボード履歴のクリアボタン
  document.getElementById('clearHistory').addEventListener('click', () => {
    clipboardHistory.clear();
    showToast('履歴をクリアしました');
  });

  // クリップボード履歴の監視
  clipboardHistory.addListener((action, item) => {
    updateClipboardHistoryUI();
  });

  // Marked.jsの設定
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {}
      }
      return code;
    }
  });

  // コピー機能のヘルパー関数
  async function copyToClipboard(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      clipboardHistory.addItem(text, 'copy');
      showToast(message || 'コピーしました！');
    } catch (err) {
      showToast('コピーに失敗しました');
    }
  }

  // トースト表示関数
  function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 2000);
  }

  // プレビューの更新関数
  function updatePreview() {
    const markdown = textarea.value;
    const html = marked.parse(markdown);
    previewArea.innerHTML = html;
    
    // シンタックスハイライトの適用
    previewArea.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
      
      // コードブロックにコピーボタンを追加
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-code-button';
      copyButton.innerHTML = '📋';
      copyButton.title = 'コードをコピー';
      
      const pre = block.parentElement;
      pre.style.position = 'relative';
      pre.appendChild(copyButton);
      
      copyButton.addEventListener('click', () => {
        copyToClipboard(block.textContent, 'コードをコピーしました！');
      });
    });

    // 保存
    chrome.storage.local.set({ 'savedMarkdown': markdown });
  }

  // コピーボタンのイベントリスナー
  copyAllBtn.addEventListener('click', () => {
    const markdown = textarea.value;
    const html = previewArea.innerHTML;
    copyToClipboard(`# Markdown\n${markdown}\n\n# HTML\n${html}`, '全体をコピーしました！');
  });

  copyMarkdownBtn.addEventListener('click', () => {
    copyToClipboard(textarea.value, 'マークダウンをコピーしました！');
  });

  copyHtmlBtn.addEventListener('click', () => {
    copyToClipboard(previewArea.innerHTML, 'HTMLをコピーしました！');
  });

  // テキストエリアの選択範囲コピー機能
  textarea.addEventListener('keydown', (e) => {
    // Ctrl+C または Cmd+C
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (textarea.selectionStart !== textarea.selectionEnd) {
        const selectedText = textarea.value.substring(
          textarea.selectionStart,
          textarea.selectionEnd
        );
        copyToClipboard(selectedText, '選択範囲をコピーしました！');
      }
    }
    // タブキーの処理
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
      updatePreview();
    }
  });

  // 保存されたデータの読み込み
  chrome.storage.local.get(['savedMarkdown'], (result) => {
    if (result.savedMarkdown) {
      textarea.value = result.savedMarkdown;
      updatePreview();
    }
  });

  // イベントリスナーの設定
  textarea.addEventListener('input', updatePreview);
  
  // 初期表示時にクリップボード履歴を更新
  updateClipboardHistoryUI();
});

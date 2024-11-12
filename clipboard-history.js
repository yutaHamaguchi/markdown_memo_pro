class ClipboardHistory {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.history = [];
    this.loadHistory();
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(['clipboardHistory']);
      this.history = result.clipboardHistory || [];
    } catch (error) {
      console.error('Failed to load clipboard history:', error);
      this.history = [];
    }
  }

  async saveHistory() {
    try {
      await chrome.storage.local.set({ clipboardHistory: this.history });
    } catch (error) {
      console.error('Failed to save clipboard history:', error);
    }
  }

  addItem(content, type = 'text') {
    const timestamp = new Date().toISOString();
    const newItem = {
      id: `clip-${timestamp}`,
      content,
      type,
      timestamp,
    };

    this.history.unshift(newItem);
    if (this.history.length > this.maxSize) {
      this.history.pop();
    }

    this.saveHistory();
    this.notifyListeners('add', newItem);
  }

  removeItem(id) {
    const index = this.history.findIndex(item => item.id === id);
    if (index !== -1) {
      const removedItem = this.history.splice(index, 1)[0];
      this.saveHistory();
      this.notifyListeners('remove', removedItem);
    }
  }

  clear() {
    this.history = [];
    this.saveHistory();
    this.notifyListeners('clear');
  }

  getItems() {
    return [...this.history];
  }

  // Observer pattern implementation
  listeners = new Set();

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(action, item) {
    this.listeners.forEach(callback => callback(action, item));
  }
}

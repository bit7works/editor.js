class Index {
  constructor(store) {
    this.store = store;
  }

  getDefaultDocumentPath() {
    let defaultPath = '';
    let currentPath = this.getCurrentDocumentPath();
    if (currentPath) {
      defaultPath = currentPath;
    }

    return defaultPath;
  }

  setCurrentDocumentPath(path) {
    console.log('SET [current-document-path] > ', path);
    this.store.set('current-document-path', path);
  }

  getCurrentDocumentPath() {
    return this.store.get('current-document-path');
  }
}

module.exports = Index;

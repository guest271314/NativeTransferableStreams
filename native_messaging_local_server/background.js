function sendNativeMessage(title, url) {
  chrome.runtime.sendNativeMessage('native_messaging_local_server', {}, (nativeMessage) => {
    console.log({nativeMessage, title, url});
  });
}

chrome.tabs.onUpdated.addListener((tabId, {title}, {url}) => {
  if (/(start|stop)_local_server/.test(title)) {
    sendNativeMessage(title, url);
  }
});

chrome.action.onClicked.addListener(({title, url}) => {
  sendNativeMessage(title, url);
});

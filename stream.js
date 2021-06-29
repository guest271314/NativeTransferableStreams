async function nativeTransferableStream(readable) {
  return new Promise(async (resolve) => {
    onmessage = async (e) => {
      console.log(e.data);
      if (e.data === 'Ready') {
        e.source.postMessage(readable, e.origin, [readable]);
      } 
      if (e.data instanceof ReadableStream) {
        const message = await audioStream(e.data);
        onmessage = null;
        resolve(message);
      }
    };
    const transferableWindow = document.createElement('iframe');
    transferableWindow.style.display = 'none';
    transferableWindow.name = location.href;
    transferableWindow.src = 'chrome-extension://<id>/nativeTransferableStream.html';
    document.body.appendChild(transferableWindow);
  }).catch((err) => {
    throw err;
  });
}

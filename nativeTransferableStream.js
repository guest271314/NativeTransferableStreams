async function nativeTransferableStream(readable) {
  return new Promise(async (resolve) => {
    // setDocumentTitle();
    onmessage = async (e) => {
      if (e.data === 'Ready') {
        e.source.postMessage(readable, e.origin, [readable]);
      } else {
        console.log(e.data);
      }
      if (e.data instanceof ReadableStream) {
        const message = await audioStream(e.data);
        onmessage = null;
        // setDocumentTitle();
        transferableWindow.close();
        resolve(message);
      }
    };

    const transferableWindow = window.open(
      'http://localhost:8000/index.html',
      location.href,
      'menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=100,height=100'
    );
  }).catch((err) => {
    throw err;
  });
}

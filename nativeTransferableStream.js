async function nativeTransferableStream(stdin) {
  return new Promise((resolve) => {
    onmessage = async (e) => {
      if (e.data === 'Ready') {
        const encoder = new TextEncoder();
        const input = encoder.encode(stdin);
        const readable = new ReadableStream({
          start(c) {
            c.enqueue(input);
            c.close();
          },
        });
        e.source.postMessage(readable, e.origin, [readable]);
      }
      if (e.data instanceof ReadableStream) {
        const message = await audioStream(e.data);
        onmessage = null;
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

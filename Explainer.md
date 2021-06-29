**Problem**

No web standard exists that specifies a means to execute local arbitrary native applications and shell scripts streaming STDIN and STDOUT from and to the any browing context.

For example, Web Speech API does not support SSML input to the speech synthesis engine https://github.com/WICG/speech-api/issues/10, or the ability to capture the output of `speechSynthesis.speak()` as a`MedaiStreamTrack` or raw audio https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html.

See [Issue 1115640: [FUGU] NativeTransferableStream](https://bugs.chromium.org/p/chromium/issues/detail?id=1115640).

**Solution**

Use existing web platform technologies to stream from the browser (STDIN) to local server (STDOUT) to the browser at any origin.

Steps:

1. On Web page create an `<iframe>` with `src` set to `chrome-extension://<id>/nativeTransferableStream.html`, append element to `document`.

2. Turn on local server in `nativeTransferableStream.js` using Native Messaging.

3. `fetch()` `localhost` with `POST` body set as command to run at a local shell, for example using PHP `passthru()`.

4. Transfer `ReadableStream` of `Response.body` representing STDOUT using `postMessage()` from `<iframe>` to `parent`.

5. Turn off local server in `nativeTransferableStream.js` using Native Messaging.

6. Read `ReadableStream` at `parent`, remove `<iframe>` element from `document`.

**Example**

Usage
```
// stream.js
async function nativeTransferableStream(readable) {
  return new Promise(async (resolve) => {
    onmessage = async (e) => {
      if (e.data === 'Ready') {
        e.source.postMessage(readable, e.origin, [readable]);
      } else {
        console.log(e.data);
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

try {
  let text = `Test.`.replace(
    /"/g,
    ''
  );
  console.log(
    await nativeTransferableStream(
      new ReadableStream({
        start(c) {
          c.enqueue(
            new File([`espeak-ng -m -v 'Storm' --stdout "${text}"`], 'tts', {
              type: 'application/octet-stream',
            })
          );
          c.close();
        },
      })
    )
  );
} catch (err) {
  console.error(err);
};
```

**Problem**

No web standard exists that specifies a means to execute local arbitrary native applications and shell scripts streaming STDIN and STDOUT from and to the any browing context.

For example, Web Speech API does not support SSML input to the speech synthesis engine https://github.com/WICG/speech-api/issues/10, or the ability to capture the output of `speechSynthesis.speak()` as a`MedaiStreamTrack` or raw audio https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html.

See [Issue 1115640: [FUGU] NativeTransferableStream](https://bugs.chromium.org/p/chromium/issues/detail?id=1115640).

**Solution**

Use existing web platform technologies to stream STDIN and STDOUT from the browser.

Steps:

1. Start your local server. This can be achieves using a browser extension with Native Messaging to toggle the local server on and off.

2. Create an HTML document in the root of the server directory.

3. Turn off popup blocker at browser settings/preferences.

4. Open `Window` using `window.open()` with URL set to HTML document at 2.

5. `postMessage()` to `opener` from newly opened `Window`.

6. Transfer `ReadableStream` representing `STDIN` using `postMessage()` from `opener` to newly opened `Window`.

7. Read `ReadableStream` at newly opened Window.

8. `fetch()` localhost with `POST` body set as command to run at a local shell, for example using PHP `passthru()`.

9. Transfer `ReadableStream` of `Response.body` representing STDOUT using `postMessage()` from newly opened `Window` to `opener`.

10. Read `ReadableStream` at `opener`.

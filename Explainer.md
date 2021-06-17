**Problem**

No web standard exists that specifies a means to execute local arbitrary native applications and shell scripts streaming STDIN and STDOUT from and to the any browing context.

For example, Web Speech API does not support SSML input to the speech synthesis engine https://github.com/WICG/speech-api/issues/10, or the ability to capture the output of `speechSynthesis.speak()` as a`MedaiStreamTrack` or raw audio https://lists.w3.org/Archives/Public/public-speech-api/2017Jun/0000.html.

See [Issue 1115640: [FUGU] NativeTransferableStream](https://bugs.chromium.org/p/chromium/issues/detail?id=1115640).

**Solution**

Use existing web platform technologies to stream from the browser (STDIN) to local server (STDOUT) to the browser at any origin.

Steps:

1. Start your local server. The local server can be started and stopped using a browser extension and Native Messaging by clicking on extension badge icon, or setting `document.title` to `'start_local_server'` and `'stop_local_server'`. An example implementation in this repository is [native_messaging_local_server](https://github.com/guest271314/NativeTransferableStreams/tree/main/native_messaging_local_server).

2. Create an HTML document in the root of the server directory.

3. Turn off popup blocker at browser settings/preferences.

4. Open `Window` using `window.open()` with URL set to HTML document at 2.

5. `postMessage()` to `opener` from newly opened `Window`.

6. Transfer `ReadableStream` representing `STDIN` using `postMessage()` from `opener` to newly opened `Window`.

7. Read `ReadableStream` at newly opened Window.

8. `fetch()` localhost with `POST` body set as command to run at a local shell, for example using PHP `passthru()`.

9. Transfer `ReadableStream` of `Response.body` representing STDOUT using `postMessage()` from newly opened `Window` to `opener`.

10. Read `ReadableStream` at `opener`.

**Example**

Local server
```
<?php 
if (isset($_POST["tts"])) {
    print($_GET["tts"]);
    header('Vary: Origin');
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, HEAD");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers");    
    header("Content-Type: text/plain");
    header("X-Powered-By:");
    echo passthru($_POST["tts"]);
    exit();
  }
```
index.html in root of server

```
<!DOCTYPE html>
<html>
  <body>
    NativeTransferableStream
    <script>
      onload = async (e) => {
        opener.postMessage('Ready', name);
        onmessage = async ({ data }) => {
          const { value: file, done } = await e.data.getReader().read();
          const fd = new FormData();
          const stdin = await file.text();
          document.body.textContent = `Running ${stdin}`;
          fd.append(file.name, stdin);
          const { body } = await fetch('http://localhost:8000', {
            method: 'post',
            body: fd,
            cache: 'no-store',
          });
          opener.postMessage(body, name, [body]);
        };
      };
    </script>
  </body>
</html>
```
Usage at any origin

```
async function nativeTransferableStream(readable) {
  return new Promise(async (resolve) => {
    setDocumentTitle();
    onmessage = async (e) => {
      if (e.data === 'Ready') {
        e.source.postMessage(readable, e.origin, [readable]);
      } else {
        console.log(e.data);
      }
      if (e.data instanceof ReadableStream) {
        const message = await audioStream(e.data, transferableWindow);
        onmessage = null;
        setDocumentTitle();
        // transferableWindow.close();
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

// Turn local server, applications, devices, shell scripts, on and off programmatically
// or with user action using an extension and Native Messaging
function setDocumentTitle() {
  return (document.title =
    document.title === 'start_local_server'
      ? 'stop_local_server'
      : 'start_local_server');
}

let text = `... So we need people to have weird new ideas. We need more ideas to break it and make it better.

Use it
Break it
File bugs
Request features

- Real time front-end alchemy, or: 
  capturing, playing, altering and encoding video and audio streams, without servers or plugins! 
  by Soledad Penadés
   
von Braun believed in testing. I cannot emphasize that term enough – test, test, test. 
Test to the point it breaks. 

- Ed Buckbee, NASA Public Affairs Officer, Chasing the Moon

Now watch. Um, this how science works.
One researcher comes up with a result.
And that is not the truth. No, no.
A scientific emergent truth is not the
result of one experiment. What has to 
happen is somebody else has to verify
it. Preferably a competitor. Preferably
someone who doesn't want you to be correct.

- Neil deGrasse Tyson, May 3, 2017 at 92nd Street Y`;

try {
  console.log(
    await nativeTransferableStream(
      new ReadableStream({
        start(c) {
          c.enqueue(
            new File([`espeak-ng -m --stdout "${text}"`], 'tts', {
              type: 'application/octet-stream',
            })
          );
          c.close();
        },
      })
    );
} 
catch (err) {
  console.error(err);
}
```

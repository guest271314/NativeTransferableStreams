async function audioStream(readable) {
  let readOffset = 0;
  let duration = 0;
  let init = false;
  const ac = new AudioContext({
    sampleRate: 22050,
    latencyHint: 0,
  });
  await ac.suspend();
  const msd = new MediaStreamAudioDestinationNode(ac, {
    channelCount: 1,
  });
  let inputController;
  const inputStream = new ReadableStream({
    async start(_) {
      return (inputController = _);
    },
  });
  const abortable = new AbortController();
  const { signal } = abortable;
  const inputReader = inputStream.getReader();
  const { stream } = msd;
  const [track] = stream.getAudioTracks();
  const osc = new OscillatorNode(ac, { frequency: 0 });
  const processor = new MediaStreamTrackProcessor({ track });
  const generator = new MediaStreamTrackGenerator({ kind: 'audio' });
  const { writable } = generator;
  const { readable: audioReadable } = processor;
  const audioWriter = writable.getWriter();
  const mediaStream = new MediaStream([generator]);
  const source = new MediaStreamAudioSourceNode(ac, { mediaStream });
  source.connect(ac.destination);
  osc.connect(msd);
  osc.start();
  track.onmute = track.onunmute = track.onended = (e) => console.log(e);
  // const recorder = new MediaRecorder(mediaStream);
  // recorder.ondataavailable = ({ data }) => console.log(URL.createObjectURL(data));
  // recorder.start();
  let channelData = [];
  await Promise.all([
    readable.pipeTo(
      new WritableStream({
        async write(value, c) {
          let i = 0;
          if (!init) {
            init = true;
            i = 44;
          }
          for (; i < value.buffer.byteLength; i++, readOffset++) {
            if (channelData.length === 440) {
              inputController.enqueue([...channelData]);
              channelData.length = 0;
            }
            channelData.push(value[i]);
          }
        },
        async close() {
          console.log('Done writing input stream.');
          if (channelData.length) {
            inputController.enqueue(channelData);
          }
          inputController.close();
        },
      })
    ),
    audioReadable.pipeTo(
      new WritableStream({
        async write({ timestamp }) {
          if (inputController.desiredSize === 0) {
            msd.disconnect();
            osc.disconnect();
            source.disconnect();
            track.stop();
            // abortable.abort();
            await audioWriter.close();
            await audioWriter.closed;
            await inputReader.cancel();
            generator.stop();
            await ac.close();
            console.log(
              `readOffset:${readOffset}, duration:${duration}, ac.currentTime:${ac.currentTime}`,
              `generator.readyState:${generator.readyState}, audioWriter.desiredSize:${audioWriter.desiredSize}`
            );
            return await Promise.all([
              new Promise((resolve) => (stream.oninactive = resolve)),
              new Promise((resolve) => (ac.onstatechange = resolve)),
            ]);
          }
          const uint8 = new Uint8Array(440);
          const { value, done } = await inputReader.read();
          if (!done) uint8.set(new Uint8Array(value));
          const uint16 = new Uint16Array(uint8.buffer);
          const floats = new Float32Array(220);
          // https://stackoverflow.com/a/35248852
          for (let i = 0; i < uint16.length; i++) {
            const int = uint16[i];
            // If the high bit is on, then it is a negative number, and actually counts backwards.
            const float =
              int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
            floats[i] = float;
          }
          const buffer = new AudioBuffer({
            numberOfChannels: 1,
            length: floats.length,
            sampleRate: 22050,
          });
          buffer.getChannelData(0).set(floats);
          duration += buffer.duration;
          const frame = new AudioData({ timestamp, buffer }); 
          await audioWriter.write(frame);
        },
        close() {
          console.log('Done reading input stream.');
        },
      }),
      { signal, preventClose: false }
    ),
    ac.resume(),
  ]);
  return 'Done streaming.';
}

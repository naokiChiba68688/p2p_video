const Peer = window.Peer;

(async function main() {
  const localStream = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localStream.muted = true;
  localStream.srcObject = localStream;
  localStream.playsInline = true;
  await localStream.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom("roomName", {
      mode: "mesh",
      stream: localStream,
    });

    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteStreams.append(newVideo);
      await newVideo.play().catch(console.error);
    });
    
    room.on('peerLeave', peerId => {
      const remoteStream = remoteStreams.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteStream.srcObject.getTracks().forEach(track => track.stop());
      remoteStream.srcObject = null;
      remoteStream.remove();
    });

    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      Array.from(remoteStreams.children).forEach(remoteStream => {
        remoteStream.srcObject.getTracks().forEach(track => track.stop());
        remoteStream.srcObject = null;
        remoteStream.remove();
      });
    });
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });
  });

  peer.on('error', console.error);
})();
const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: '96b366cf-59e8-4816-8240-fa8efa462b40',
    debug: 3,
  }));

  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand_str = '';
  for ( var i = 0; i < 8; i++ ) {
    rand_str += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  let joinId = document.getElementById('room_id');
  joinId.innerHTML = rand_str;

  let urlParameter = location.search;

  if(urlParameter == ''){
    let idBox = document.getElementById('js-room-id');
    idBox.value = rand_str;
  }else{
    let urlParameters = urlParameter.split('=');
    let idBox = document.getElementById('js-room-id');
    idBox.value = urlParameters[1];
  }

  let triggerButton = document.getElementById('js-join-trigger');
  triggerButton.click;

  let joinUrl = document.getElementById('shareUrl');
  joinUrl.innerHTML = location.href + '?id=' + rand_str;
  joinUrl.href = location.href + '?id=' + rand_str;

  joinTrigger.addEventListener('click', () => {
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
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();
    });

    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });
  });

  peer.on('error', console.error);
})();
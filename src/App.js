// src/App.js
import React, { useEffect, useState } from 'react';
import { collection, doc, addDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import './App.css';

function App({ firestore }) {
    const [callId, setCallId] = useState('');
    const [pc, setPc] = useState(new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    }));

    useEffect(() => {
        const webcamButton = document.getElementById('webcamButton');
        const webcamVideo = document.getElementById('webcamVideo');
        const callButton = document.getElementById('callButton');
        const callInput = document.getElementById('callInput');
        const answerButton = document.getElementById('answerButton');
        const remoteVideo = document.getElementById('remoteVideo');
        const hangupButton = document.getElementById('hangupButton');

        let localStream = null;
        let remoteStream = new MediaStream();

        const setupMediaSources = async () => {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStream.getTracks().forEach(track => {
                    pc.addTrack(track, localStream);
                });
                pc.ontrack = event => {
                    event.streams[0].getTracks().forEach(track => {
                        remoteStream.addTrack(track);
                    });
                };
                webcamVideo.srcObject = localStream;
                remoteVideo.srcObject = remoteStream;
                callButton.disabled = false;
                answerButton.disabled = false;
                webcamButton.disabled = true;
            } catch (error) {
                console.error('Error accessing media devices.', error);
            }
        };

        const createOffer = async () => {
            try {
                const callDocRef = await addDoc(collection(firestore, 'calls'), {});
                const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
                const answerCandidatesRef = collection(callDocRef, 'answerCandidates');
                callInput.value = callDocRef.id;
                setCallId(callDocRef.id);

                pc.onicecandidate = event => {
                    event.candidate && addDoc(offerCandidatesRef, event.candidate.toJSON());
                };

                const offerDescription = await pc.createOffer();
                await pc.setLocalDescription(offerDescription);

                await updateDoc(callDocRef, { offer: offerDescription });

                onSnapshot(callDocRef, snapshot => {
                    const data = snapshot.data();
                    if (data?.answer && !pc.currentRemoteDescription) {
                        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                });

                onSnapshot(answerCandidatesRef, snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const candidate = new RTCIceCandidate(change.doc.data());
                            pc.addIceCandidate(candidate);
                        }
                    });
                });

                hangupButton.disabled = false;
            } catch (error) {
                console.error('Error creating offer.', error);
            }
        };

        const answerCall = async () => {
            try {
                const callDocRef = doc(firestore, 'calls', callInput.value);
                const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
                const answerCandidatesRef = collection(callDocRef, 'answerCandidates');

                pc.onicecandidate = event => {
                    event.candidate && addDoc(answerCandidatesRef, event.candidate.toJSON());
                };

                const callData = (await getDoc(callDocRef)).data();

                if (callData?.offer) {
                    const offerDescription = callData.offer;
                    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
                    const answerDescription = await pc.createAnswer();
                    await pc.setLocalDescription(answerDescription);
                    await updateDoc(callDocRef, { answer: answerDescription });
                }

                onSnapshot(offerCandidatesRef, snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const candidate = new RTCIceCandidate(change.doc.data());
                            pc.addIceCandidate(candidate);
                        }
                    });
                });

                hangupButton.disabled = false;
            } catch (error) {
                console.error('Error answering call.', error);
            }
        };

        const hangupCall = () => {
            pc.close();
            localStream.getTracks().forEach(track => track.stop());
            remoteStream.getTracks().forEach(track => track.stop());

            webcamVideo.srcObject = null;
            remoteVideo.srcObject = null;

            webcamButton.disabled = false;
            callButton.disabled = true;
            answerButton.disabled = true;
            hangupButton.disabled = true;

            setCallId('');
        };

        webcamButton.onclick = setupMediaSources;
        callButton.onclick = createOffer;
        answerButton.onclick = answerCall;
        hangupButton.onclick = hangupCall;

    }, [firestore, pc]);

    return (
        <div>
            {callId && <p>Share this call ID: {callId}</p>}
        </div>
    );
}

export default App;

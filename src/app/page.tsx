"use client";
import React from "react";

export default function Home() {
	const [audioStream, setAudioStream] = React.useState<MediaStream | null>(
		null,
	);
	const [audioContext, setAudioContext] = React.useState<AudioContext | null>(
		null,
	);
	const [analyzer, setAnalyzer] = React.useState<AnalyserNode | null>(null);
	const [permissionGranted, setPermissionGranted] = React.useState(false);

	const requestMicrophoneAccess = async () => {
		try {
			if (!navigator.mediaDevices) {
				return;
			}
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});
			const context = new window.AudioContext();
			const analyzerNode = context.createAnalyser();
			analyzerNode.fftSize = 256;
			analyzerNode.smoothingTimeConstant = 0.8;

			setAudioStream(stream);
			setAudioContext(context);
			setAnalyzer(analyzerNode);
			setPermissionGranted(true);

			const source = context.createMediaStreamSource(stream);
			source.connect(analyzerNode);
		} catch (err) {
			console.error("Error accessing microphone:", err);
			setPermissionGranted(false);
		}
	};

	React.useEffect(() => {
		return () => {
			if (audioStream) {
				for (const track of audioStream.getTracks()) {
					track.stop();
				}
			}
			if (audioContext) {
				audioContext.close();
			}
		};
	}, [audioStream, audioContext]);

	React.useEffect(() => {
		const checkBlowing = () => {
			if (!analyzer) return false;
			const dataArray = new Uint8Array(analyzer.frequencyBinCount);
			analyzer.getByteFrequencyData(dataArray);
			// Calculate average volume with more weight on lower frequencies
			const average = dataArray.slice(0, 100).reduce((a, b) => a + b) / 100;

			if (average > 50) {
				// Lowered threshold for better sensitivity
				const container = document.getElementById("candles-container");
				const flames = Array.from(container?.querySelectorAll(".flame") || []);

				if (flames.length > 0) {
					const randomIndex = Math.floor(Math.random() * flames.length);
					flames[randomIndex].remove();

					if (flames.length === 1) {
						const audio = document.getElementById(
							"birthday-song",
						) as HTMLAudioElement;
						if (audio) {
							// For mobile devices: play with user interaction
							const playPromise = audio.play();
							if (playPromise !== undefined) {
								playPromise.catch((error) => {
									console.error("Audio playback failed:", error);
								});
							}
						}
					}
				}
			}
		};

		const interval = setInterval(checkBlowing, 100);
		return () => clearInterval(interval);
	}, [analyzer]);

	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 sm:p-8">
			<div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-12 shadow-2xl">
				<div className="mb-8 sm:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300 text-center animate-pulse">
					<h1 className="text-4xl sm:text-7xl font-extrabold ">
						Happy Birthday Bebe! 🎉
					</h1>
					<h3 className="text-xl">You&apos;re loved and appreciated</h3>
				</div>
				{!permissionGranted && (
					<button
						type="button"
						onClick={requestMicrophoneAccess}
						className="w-full mb-6 sm:mb-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
					>
						Click to Enable Microphone 🎤
					</button>
				)}

				<p className="w-full flex justify-center">Blow on the screen</p>
				<div
					className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-10 sm:gap-12 mb-8 sm:mb-12 p-4 sm:p-8 bg-white/5 rounded-2xl"
					id="candles-container"
				>
					{[...Array(26)].map((_, index) => (
						<div
							key={`candle-${index}`}
							className="candle w-4 sm:w-6 h-16 sm:h-24 bg-gradient-to-t from-yellow-300 to-yellow-100 rounded-lg relative cursor-pointer transform hover:scale-110 transition-transform duration-300 shadow-lg"
						>
							<div className="flame w-4 sm:w-6 h-6 sm:h-8 bg-gradient-to-t from-orange-500 via-yellow-400 to-white absolute -top-6 sm:-top-8 rounded-full animate-flicker shadow-glow" />
						</div>
					))}
				</div>

				<audio
					id="birthday-song"
					src="/friendship.mp3"
					className="w-full"
					preload="auto"
				>
					<track kind="captions" />
				</audio>
			</div>

			<style jsx>{`
				@keyframes flicker {
					0% { transform: scale(1.1) rotate(-2deg); opacity: 0.9; }
					25% { transform: scale(0.9) rotate(2deg); opacity: 1; }
					50% { transform: scale(1.05) rotate(-1deg); opacity: 0.95; }
					75% { transform: scale(0.95) rotate(1deg); opacity: 0.9; }
					100% { transform: scale(1) rotate(0); opacity: 1; }
				}
				
				.animate-flicker {
					animation: flicker 0.5s infinite alternate;
				}

				.shadow-glow {
					box-shadow: 0 0 20px 5px rgba(255, 165, 0, 0.5);
				}
			`}</style>
		</main>
	);
}

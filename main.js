let video;
let canvas;
let targetDescriptor = null;
const STATUS = document.getElementById('status');

// Load face-api models
async function loadModels() {
    STATUS.textContent = 'Loading models...';
    try {
        await Promise.all([
            faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
        ]);
        STATUS.textContent = 'Models loaded! You can now upload a target image.';
        startVideo();
    } catch (error) {
        STATUS.textContent = 'Error loading models. Please refresh the page.';
        console.error('Error loading models:', error);
    }
}

// Start video stream
async function startVideo() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        STATUS.textContent = 'Error accessing camera. Please ensure camera permissions are granted.';
        console.error('Error accessing camera:', error);
    }
}

// Handle target image upload
document.getElementById('imageUpload').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const img = document.getElementById('targetImage');
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';

    STATUS.textContent = 'Processing target face...';
    
    img.onload = async () => {
        try {
            const detection = await faceapi.detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                targetDescriptor = detection.descriptor;
                STATUS.textContent = 'Target face processed! Now scanning for matches...';
                startFaceDetection();
            } else {
                STATUS.textContent = 'No face detected in the uploaded image. Please try another image.';
            }
        } catch (error) {
            STATUS.textContent = 'Error processing target face. Please try again.';
            console.error('Error processing target face:', error);
        }
    };
});

// Main face detection loop
async function startFaceDetection() {
    if (!targetDescriptor) return;

    canvas.width = video.width;
    canvas.height = video.height;
    
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const detection of detections) {
            const distance = faceapi.euclideanDistance(targetDescriptor, detection.descriptor);
            
            // If face match found (distance less than 0.6 indicates a match)
            if (distance < 0.6) {
                // Draw green box for match
                const box = detection.detection.box;
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                
                // Open Google search in new tab
                window.open('https://www.google.com', '_blank');
                return; // Stop detection after finding a match
            } else {
                // Draw red box for non-match
                const box = detection.detection.box;
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
            }
        }
    }, 100);
}

// Create models directory and download models
async function setupModels() {
    const modelsDir = '/models';
    
    // We'll use the CDN versions of the models
    const modelUrls = {
        '/models/face_recognition_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
        '/models/face_recognition_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
        '/models/face_landmark_68_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
        '/models/face_landmark_68_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
        '/models/ssd_mobilenetv1_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json',
        '/models/ssd_mobilenetv1_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1',
        '/models/ssd_mobilenetv1_model-shard2': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2'
    };

    STATUS.textContent = 'Setting up face detection models...';
    loadModels();
}

// Start the application
document.addEventListener('DOMContentLoaded', setupModels);
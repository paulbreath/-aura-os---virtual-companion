const API_KEY = '0xNDQiDH8USqAeMDh8PMYYykPgmXozzWhqXbr57QIoUNajGlvsO7h1KjcrgD';

async function testVideoGeneration() {
  console.log('Testing ModelsLab Video Generation API...\n');
  
  // Test 1: Text to Video
  console.log('=== Test 1: Text to Video (cogvideox) ===');
  try {
    const response = await fetch('https://modelslab.com/api/v6/video/text2video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: API_KEY,
        model_id: 'cogvideox',
        prompt: 'a beautiful anime girl smiling and waving at camera, gentle movement, soft lighting',
        negative_prompt: 'low quality, blurry, static',
        height: 512,
        width: 512,
        num_frames: 25,
        num_inference_steps: 20,
        guidance_scale: 7,
        output_type: 'mp4',
        instant_response: true
      }),
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    if (data.status === 'success' && data.output?.[0]) {
      console.log('✅ Video URL:', data.output[0]);
    } else if (data.status === 'processing') {
      console.log('⏳ Processing, polling...');
      await pollForVideo(data.fetch_result || `https://modelslab.com/api/v6/video/fetch/${data.id}`, API_KEY);
    }
  } catch (error) {
    console.error('Text to video error:', error.message);
  }
  
  // Test 2: Image to Video
  console.log('\n=== Test 2: Image to Video (wan2.1) ===');
  try {
    const response = await fetch('https://modelslab.com/api/v6/video/img2video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: API_KEY,
        model_id: 'wan2.1',
        init_image: 'https://pub-3626123a908346a7a8be8d9295f44e26.r2.dev/generations/0-080eec20-aa5d-40c1-8ea4-482ed2d537a7.jpg',
        prompt: 'gentle movement, breathing, blinking, subtle motion',
        negative_prompt: 'low quality, distorted, static',
        height: 480,
        width: 480,
        num_frames: 81,
        instant_response: true
      }),
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    if (data.status === 'success' && data.output?.[0]) {
      console.log('✅ Video URL:', data.output[0]);
    }
  } catch (error) {
    console.error('Image to video error:', error.message);
  }
  
  // Test 3: Image to Video Ultra
  console.log('\n=== Test 3: Image to Video Ultra (wan2.2) ===');
  try {
    const response = await fetch('https://modelslab.com/api/v6/video/img2video_ultra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: API_KEY,
        model_id: 'wan2.2',
        init_image: 'https://pub-3626123a908346a7a8be8d9295f44e26.r2.dev/generations/0-080eec20-aa5d-40c1-8ea4-482ed2d537a7.jpg',
        prompt: 'gentle breathing, blinking, subtle smile, soft movement',
        negative_prompt: 'low quality, distorted, ugly',
        resolution: 720,
        num_frames: 81,
      }),
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    if (data.status === 'success' && data.output?.[0]) {
      console.log('✅ Video URL:', data.output[0]);
    }
  } catch (error) {
    console.error('Image to video ultra error:', error.message);
  }
}

async function pollForVideo(fetchUrl, apiKey) {
  const maxAttempts = 60; // 视频需要更长时间
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
    
    try {
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey }),
      });
      const data = await res.json();
      console.log(`Poll ${i + 1}/${maxAttempts}: ${data.status}`);
      
      if (data.status === 'success') {
        console.log('✅ Video URL:', data.output?.[0]);
        return;
      } else if (data.status === 'failed') {
        console.error('❌ Generation failed:', data.message);
        return;
      }
    } catch (e) {
      console.error('Poll error:', e.message);
    }
  }
  console.error('Polling timeout');
}

testVideoGeneration().catch(console.error);
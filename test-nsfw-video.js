const API_KEY = '0xNDQiDH8USqAeMDh8PMYYykPgmXozzWhqXbr57QIoUNajGlvsO7h1KjcrgD';

async function generateNSFWVideo() {
  console.log('Generating NSFW video with ModelsLab...\n');
  
  // Test 1: Text-to-Video with NSFW prompt
  console.log('=== Test 1: Text-to-Video (wan2.1) with NSFW prompt ===');
  
  try {
    const response = await fetch('https://modelslab.com/api/v6/video/text2video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: API_KEY,
        model_id: 'wan2.1',
        prompt: 'beautiful anime girl, erotic movement, gentle touching, seductive pose, sensual dance, breathing motion',
        negative_prompt: 'low quality, distorted, ugly, deformed, static, frozen',
        height: 480,
        width: 480,
        num_frames: 81,
        fps: 16,
        instant_response: true
      }),
    });
    
    const data = await response.json();
    console.log('\nInitial response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    if (data.status === 'success' && data.output?.[0]) {
      console.log('\n✅ Video ready immediately!');
      console.log('Video URL:', data.output[0]);
      return data.output[0];
    } else if (data.status === 'processing') {
      console.log('\n⏳ Processing, estimated ETA:', data.eta, 'seconds');
      console.log('Fetch URL:', data.fetch_result);
      
      if (data.future_links?.[0]) {
        console.log('Future link:', data.future_links[0]);
      }
      
      // 开始轮询
      const videoUrl = await pollForResult(data.fetch_result, API_KEY);
      return videoUrl;
    } else if (data.status === 'error') {
      console.error('\n❌ Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return null;
  }
}

async function pollForResult(fetchUrl, apiKey) {
  console.log('\n=== Polling for video result ===');
  const maxAttempts = 60;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒
    
    try {
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey }),
      });
      
      const data = await res.json();
      console.log(`Poll ${i + 1}/${maxAttempts}: ${data.status} (ETA: ${data.eta || '-'}s)`);
      
      if (data.status === 'success') {
        console.log('\n✅ Video generated!');
        console.log('Video URL:', data.output?.[0]);
        console.log('Generation time:', data.generationTime, 'seconds');
        return data.output?.[0];
      } else if (data.status === 'failed') {
        console.error('\n❌ Generation failed:', data.message);
        return null;
      }
    } catch (e) {
      console.error('Poll error:', e.message);
    }
  }
  
  console.error('\n⏱️ Polling timeout');
  return null;
}

generateNSFWVideo().then(url => {
  if (url) {
    console.log('\n========================================');
    console.log('VIDEO URL:', url);
    console.log('========================================');
  }
}).catch(console.error);
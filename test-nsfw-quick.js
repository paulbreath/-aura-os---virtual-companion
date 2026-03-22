const API_KEY = '0xNDQiDH8USqAeMDh8PMYYykPgmXozzWhqXbr57QIoUNajGlvsO7h1KjcrgD';

async function testNSFWVideo() {
  console.log('Testing NSFW video generation...\n');
  
  const response = await fetch('https://modelslab.com/api/v6/video/text2video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: API_KEY,
      model_id: 'wan2.1',
      prompt: 'beautiful anime girl, erotic dancing, seductive movements, sensual',
      negative_prompt: 'low quality, distorted, ugly, deformed, static',
      height: 480,
      width: 480,
      num_frames: 81,
      fps: 16,
      instant_response: true
    }),
  });
  
  const data = await response.json();
  console.log('Response status:', data.status);
  console.log('Message:', data.message);
  console.log('ETA:', data.eta, 'seconds');
  console.log('Future link:', data.future_links?.[0] || 'None');
  console.log('Fetch URL:', data.fetch_result || 'None');
  
  if (data.status === 'processing') {
    console.log('\n✅ NSFW video request ACCEPTED by ModelsLab!');
    console.log('The prompt was not blocked.');
  }
}

testNSFWVideo().catch(console.error);

export async function generateReport(images) {
  const formData = new FormData();
  images.forEach((img, index) => {
    formData.append('photo', {
      uri: img.uri,
      name: `photo_${index}.jpg`,
      type: 'image/jpeg',
    });
  });
  formData.append('categories', JSON.stringify(images.map(img => img.category)));

  console.log('Sending FormData ...', {
    imageCount: images.length,
    sampleUri: images[0]?.uri.substring(0, 20) + '...',
    categories: images.map(img => img.category),
  });

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('HTTP Error Response:', { status: response.status, text: errorText });
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    const result = await response.text();
    console.log('Received report:', result.substring(0, 100) + '...');
    return result;
  } catch (error) {
    console.log('Network error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw error;
  }
}

export async function getChatResponse(userMessage, { systemPrompt, context, conversationHistory }) {
  console.log('Sending chat request to ...', {
    message: userMessage.substring(0, 20) + '...',
    contextLength: context?.length || 0,
    historyLength: conversationHistory?.length || 0,
  });

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, systemPrompt, context, conversationHistory }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('HTTP Error Response:', { status: response.status, text: errorText });
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    const result = await response.text();
    console.log('Received chat response:', result.substring(0, 100) + '...');
    return result;
  } catch (error) {
    console.log('Network error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw error;
  }
}
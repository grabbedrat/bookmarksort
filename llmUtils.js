async function generateTagsBatch(batch) {
  const apiKey = ''; // Replace with your actual OpenAI API key
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  const descriptions = batch.map(bookmark => `URL: ${bookmark.url}\nTitle: ${bookmark.name}\n`).join('');
  const prompt = `Generate 6 relevant tags for each of the following bookmarks based on the provided URL and title. ` +
                 `Format the tags as a comma-separated list, with each tag surrounded by square brackets, like this: ` +
                 `'[tag1], [tag2], [tag3], [tag4], [tag5], [tag6]'. Each bookmark's tags should be on a separate line. ` +
                 `Do not include any numbers or additional text before the tags. Focus on generating tags that capture ` +
                 `the main topics, categories, key information, and any other relevant details.\n\n` +
                 `${descriptions}\nTags:`;

  const data = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates comprehensive and relevant tags for bookmarks. " +
                 "Follow the specified format for the tags: a comma-separated list with each tag surrounded by square brackets, " +
                 "like this: '[tag1], [tag2], [tag3], [tag4], [tag5], [tag6]'. Each bookmark's tags should be on a separate line. " +
                 "Do not include any numbers or additional text before the tags. Consistency in formatting is essential for proper processing."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    const generatedTags = result.choices[0].message.content.trim();

    // Extract tags from the generated text
    const extractedTags = [];
    generatedTags.split("\n").forEach(line => {
      if (line.trim()) {
        const tags = [...line.matchAll(/\[(.*?)\]/g)].map(match => match[1]);
        extractedTags.push(tags);
      }
    });

    // Ensure the length of extractedTags matches the batch length
    while (extractedTags.length < batch.length) {
      extractedTags.push([]); // Add empty tags for missing entries
    }

    return extractedTags;
  } catch (error) {
    console.error('Error generating tags:', error);
    return batch.map(() => []); // Return empty tags for each bookmark in case of an error
  }
}

async function processBatch(batch) {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const generatedTags = await generateTagsBatch(batch);
      return batch.map((bookmark, index) => {
        const existingTags = bookmark.tags || [];
        const newTags = generatedTags[index] || [];
        return {
          ...bookmark,
          tags: [...new Set([...existingTags, ...newTags])], // Merge and remove duplicates
        };
      });
    } catch (error) {
      console.error(`Error processing batch: ${error}`);
      retries += 1;
      if (retries === maxRetries) {
        console.error('Max retries reached for batch. Skipping batch.');
        return batch.map(bookmark => ({ ...bookmark, tags: bookmark.tags || [] }));
      }
    }
  }
}

async function addTagsToBookmarks(bookmarkData, batchSize = 10) {
  const batches = [];
  for (let i = 0; i < bookmarkData.length; i += batchSize) {
    batches.push(bookmarkData.slice(i, i + batchSize));
  }

  // Process batches in parallel
  const promises = batches.map(batch => processBatch(batch));
  const taggedData = await Promise.all(promises);

  // Flatten the list of lists
  return taggedData.flat();
}

async function generateFolderNames(clusteredBookmarks) {
  // Generate meaningful folder names based on clustered bookmarks using LLM
  
  // Traverse the clusteredBookmarks hierarchy
  async function traverseAndGenerateNames(folder) {
    if (folder.children && folder.children.length > 0) {
      for (const child of folder.children) {
        if (child.type === 'folder') {
          // Generate meaningful name for the child folder based on its bookmarks
          const folderName = await generateFolderName(child.children.filter(item => item.type === 'bookmark'));
          child.name = folderName;
          
          // Recursively traverse child folders
          await traverseAndGenerateNames(child);
        }
      }
    }
  }
  
  // Generate folder name based on bookmarks using LLM
  async function generateFolderName(bookmarks) {
    const apiKey = ''; // Replace with your actual OpenAI API key
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    
    const prompt = `Generate a single meaningful folder name for a folder containing the following bookmarks:\n\n`;
    const bookmarkDetails = bookmarks.map(bookmark => `URL: ${bookmark.url}\nName: ${bookmark.name}\n`).join('\n');
    
    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates meaningful folder names based on the provided bookmarks. Please return only a single folder name as the output will be directly used as the folder name."
        },
        {
          role: "user",
          content: prompt + bookmarkDetails
        }
      ],
      temperature: 0.7,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      const folderName = result.choices[0].message.content.trim();
      
      return folderName;
    } catch (error) {
      console.error('Error generating folder name:', error);
      return 'Untitled Folder';
    }
  }
  
  // Start the folder name generation process from the root folder
  await traverseAndGenerateNames(clusteredBookmarks);
  
  return clusteredBookmarks;
}

export { addTagsToBookmarks, generateFolderNames };
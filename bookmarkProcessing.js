import { runPythonScript } from "./pyodide.js";
import { addTagsToBookmarks, generateFolderNames } from "./llmUtils.js";

export async function simplifyBookmarkData(bookmarkItems, processedIds = null) {
  if (processedIds === null) {
    processedIds = new Set();
  }
  const simplifiedBookmarks = [];
  let omittedCount = 0;
  let totalCount = 0;

  for (const bookmarkItem of bookmarkItems) {
    const { id, title, url, children } = bookmarkItem;
    totalCount++;

    if (id && processedIds.has(id)) {
      continue;
    }
    if (!title || !url) {
      omittedCount++;
      continue;
    }
    const simplifiedBookmark = { title, url };
    if (id) {
      simplifiedBookmark.id = id;
      processedIds.add(id);
    }
    if (children) {
      const simplifiedChildren = await simplifyBookmarkData(children, processedIds);
      simplifiedBookmark.children = simplifiedChildren;
    }
    simplifiedBookmarks.push(simplifiedBookmark);
  }

  if (omittedCount > 0) {
    console.log(`Omitted ${omittedCount} out of ${totalCount} bookmarks due to empty title or url.`);
  }

  return simplifiedBookmarks;
}

async function clusterBookmarks(embeddedBookmarks) {
  const clusteredBookmarks = await runPythonScript('cluster_bookmarks.py', embeddedBookmarks);
  return clusteredBookmarks;
}

async function generateEmbeddings(bookmarkData) {
  if (!Array.isArray(bookmarkData)) {
    throw new Error('Invalid input: bookmarkData must be an array.');
  }
  if (!bookmarkData.every(bookmark => typeof bookmark.title === 'string' && Array.isArray(bookmark.tags))) {
    throw new Error('Invalid input: Each bookmark must have a title (string) and tags (array).');
  }

  //const textList = bookmarkData.map(bookmark => `${bookmark.title} ${bookmark.tags.join(' ')}`);
  // instead of the above, lets include url as well
  const textList = bookmarkData.map(bookmark => `${bookmark.title} ${bookmark.tags.join(' ')} ${bookmark.url}`);


  const apiUrl = "https://api.jina.ai/v1/embeddings";
  const apiToken = "Bearer jina_7c6509f6adab46e7a37346ede1677ee5TCgmavjTQrDBAeHGmK-2vu7xIasd";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": apiToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: textList,
        model: 'jina-embeddings-v2-base-en',
        encoding_type: 'float'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result.data.map(embedding => embedding.embedding);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function processBookmarks(bookmarks) {
  console.log('Bookmarks:', bookmarks);

  const simplifiedBookmarks = await simplifyBookmarkData(bookmarks);
  console.log('Simplified bookmarks:', simplifiedBookmarks);
  
  const taggedBookmarks = await addTagsToBookmarks(simplifiedBookmarks);
  console.log('Tagged bookmarks:', taggedBookmarks);

  const bookmarkData = taggedBookmarks.map(bookmark => ({
    id: bookmark.id,
    title: bookmark.title,
    tags: bookmark.tags
  }));

  const embeddings = await generateEmbeddings(bookmarkData);
  const embeddedBookmarks = taggedBookmarks.map((bookmark, index) => ({
    ...bookmark,
    embedding: embeddings[index]
  }));
  console.log('Embedded bookmarks:', embeddedBookmarks);

  //download 
  downloadJSON(embeddedBookmarks, 'embedded_bookmarks.json');
  
  let clusteredBookmarks = [];
  try {
    clusteredBookmarks = await clusterBookmarks(embeddedBookmarks);
    console.log('Clustered bookmarks:', clusteredBookmarks);
  } catch (error) {
    console.error('Error clustering bookmarks:', error);
    // Handle the error, e.g., display an error message to the user
    throw error;
  }
  
  const processedBookmarks = await generateFolderNames(clusteredBookmarks);
  console.log('Processed bookmarks w/ folder names:', processedBookmarks);
  
  downloadJSON(processedBookmarks, 'processed_bookmarks.json');
  
  return processedBookmarks;
}

export { processBookmarks };
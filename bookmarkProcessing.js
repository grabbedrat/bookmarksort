// bookmarkProcessing.js
import { runPythonCode } from "./pyodide.js";
import { callLLMAPI } from "./llmUtils.js";

export async function simplifyBookmarkData(bookmarkItems, processedIds = null) {
  if (processedIds === null) {
    processedIds = new Set();
  }

  const simplifiedBookmarks = [];

  for (const bookmarkItem of bookmarkItems) {
    const { id, title, url, children } = bookmarkItem;
    if (id && processedIds.has(id)) {
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

  return simplifiedBookmarks;
}

async function tagBookmarks(bookmarks) {
  // Tag bookmarks using LLM calls for enhanced categorization
  const taggedBookmarks = await Promise.all(
    bookmarks.map(async bookmark => {
      const prompt = `Categorize the following bookmark: ${bookmark.title} - ${bookmark.url}`;
      const tags = await callLLMAPI(prompt);
      return {
        ...bookmark,
        tags: tags.split(",").map(tag => tag.trim())
      };
    })
  );
  return taggedBookmarks;
}

async function clusterBookmarks(bookmarks) {
  // Prepare bookmark data for clustering
  const bookmarkData = bookmarks.map(bookmark => ({
    id: bookmark.id,
    text: `${bookmark.title} ${bookmark.url} ${bookmark.tags.join(" ")}`
  }));

  // Call Python function for clustering using Pyodide
  const pythonCode = `
    import json
    from sklearn.feature_extraction.text import TfidfVectorizer
    from hdbscan import HDBSCAN

    def cluster_bookmarks(bookmark_data):
      # Convert bookmark data to Python object
      bookmarks = json.loads(bookmark_data)

      # Extract features using TF-IDF
      vectorizer = TfidfVectorizer()
      features = vectorizer.fit_transform([bookmark['text'] for bookmark in bookmarks])

      # Perform clustering using HDBSCAN
      clusterer = HDBSCAN(min_cluster_size=5, metric='euclidean')
      cluster_labels = clusterer.fit_predict(features.toarray())

      # Assign cluster labels to bookmarks
      for i, label in enumerate(cluster_labels):
        bookmarks[i]['cluster'] = int(label)

      return json.dumps(bookmarks)
  `;

  const clusteredBookmarksJson = await runPythonCode(pythonCode, JSON.stringify(bookmarkData));
  const clusteredBookmarks = JSON.parse(clusteredBookmarksJson);

  return clusteredBookmarks;
}

async function generateFolderNames(clusteredBookmarks) {
  // Generate meaningful folder names based on clustered bookmarks using LLM
  const folderNames = {};
  for (const bookmark of clusteredBookmarks) {
    if (bookmark.cluster !== -1) {
      if (!folderNames[bookmark.cluster]) {
        const clusterBookmarks = clusteredBookmarks.filter(b => b.cluster === bookmark.cluster);
        const prompt = `Generate a folder name for the following bookmarks:\n${clusterBookmarks.map(b => `- ${b.title}`).join("\n")}`;
        const folderName = await callLLMAPI(prompt);
        folderNames[bookmark.cluster] = folderName.trim();
      }
      bookmark.folder = folderNames[bookmark.cluster];
    }
  }
  return clusteredBookmarks;
}

async function processBookmarks(bookmarks) {
  const simplifiedBookmarks = await simplifyBookmarkData(bookmarks);
  console.log('Simplified bookmarks:', simplifiedBookmarks);
  const taggedBookmarks = await tagBookmarks(simplifiedBookmarks);
  console.log('Tagged bookmarks:', taggedBookmarks);
  const clusteredBookmarks = await clusterBookmarks(taggedBookmarks);
  console.log('Clustered bookmarks:', clusteredBookmarks);
  const processedBookmarks = await generateFolderNames(clusteredBookmarks);
  console.log('Processed bookmarks w/ folder names:', processedBookmarks);
  return processedBookmarks;
}

export { processBookmarks };
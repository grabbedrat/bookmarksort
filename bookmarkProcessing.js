import { runPythonScript } from "./pyodide.js";
import { addTagsToBookmarks, generateFolderNames } from "./llmUtils.js";

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

async function clusterBookmarks(bookmarks) {
  const bookmarkData = bookmarks.map(bookmark => ({
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    tags: bookmark.tags
  }));
  const clusteredBookmarks = await runPythonScript('cluster_bookmarks.py', bookmarkData);
  return clusteredBookmarks;
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
  const simplifiedBookmarks = await simplifyBookmarkData(bookmarks);
  console.log('Simplified bookmarks:', simplifiedBookmarks);
  const taggedBookmarks = await addTagsToBookmarks(simplifiedBookmarks);
  console.log('Tagged bookmarks:', taggedBookmarks);
  const clusteredBookmarks = await clusterBookmarks(taggedBookmarks);
  console.log('Clustered bookmarks:', clusteredBookmarks);

  downloadJSON(clusteredBookmarks, 'clustered_bookmarks.json');

  const processedBookmarks = await generateFolderNames(clusteredBookmarks);
  console.log('Processed bookmarks w/ folder names:', processedBookmarks);

  downloadJSON(processedBookmarks, 'processed_bookmarks.json');

  return processedBookmarks;
}

export { processBookmarks };
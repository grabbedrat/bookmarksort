// bookmarkUtils.js
export function simplifyBookmarkData(bookmarkItem, processedIds = null) {
  if (processedIds === null) {
    processedIds = new Set();
  }

  const { id, title, url, children } = bookmarkItem;

  // Check if the bookmark has already been processed
  if (id && processedIds.has(id)) {
    return null;
  }

  const simplifiedBookmark = { title, url };

  if (id) {
    simplifiedBookmark.id = id;
    processedIds.add(id);
  }

  if (children) {
    simplifiedBookmark.children = children
      .map(child => simplifyBookmarkData(child, processedIds))
      .filter(child => child !== null);
  }

  return simplifiedBookmark;
}
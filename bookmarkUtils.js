// Improved bookmarkUtils.js
export function simplifyBookmarkData(bookmarkItem) {
  let simplifiedBookmarks = [];

  function processItem(item) {
    if (item.url) {
      simplifiedBookmarks.push({
        name: item.title,
        url: item.url,
      });
    } else if (item.children) {
      item.children.forEach(processItem); // Recursive call for folders
    }
  }

  processItem(bookmarkItem); // Initial call to process the bookmarkItem or root folder
  return simplifiedBookmarks;
}
import { processBookmarks } from "./bookmarkProcessing.js";

async function getBookmarks() {
  try {
    const bookmarkTreeNodes = await browser.bookmarks.getTree();
    const bookmarks = [];

    function flattenBookmarkTree(node) {
      if (node.url) {
        bookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url,
        });
      }
      if (node.children) {
        node.children.forEach(flattenBookmarkTree);
      }
    }

    bookmarkTreeNodes.forEach(flattenBookmarkTree);
    return bookmarks;
  } catch (error) {
    console.error('Failed to retrieve bookmarks:', error);
    throw error;
  }
}

async function handleBookmarkRetrieval() {
  try {
    const bookmarks = await getBookmarks();
    const processedBookmarks = await processBookmarks(bookmarks);
    // TODO: Update the browser's bookmark structure with the processed bookmarks
  } catch (error) {
    console.error('Failed to handle bookmark retrieval:', error);
  }
}

function initializeUI() {
  const sortButton = document.getElementById('sortBookmarksButton');
  sortButton.addEventListener('click', handleBookmarkRetrieval);
}

export { initializeUI };

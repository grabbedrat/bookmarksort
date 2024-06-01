import { simplifyBookmarkData } from "./bookmarkUtils.js";
import { processBookmarks } from "./bookmarkProcessing.js";

async function getBookmarks() {
  try {
    const bookmarks = await browser.bookmarks.getTree();
    return bookmarks;
  } catch (error) {
    console.error('Failed to retrieve bookmarks:', error);
    throw error;
  }
}

async function handleBookmarkRetrieval() {
  try {
    const bookmarks = await getBookmarks();
    const simplifiedBookmarks = bookmarks.map(bookmark => simplifyBookmarkData(bookmark));
    console.log('Simplified bookmarks:', simplifiedBookmarks);
    const processedBookmarks = await processBookmarks(simplifiedBookmarks);
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

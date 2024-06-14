import { processBookmarks } from "./bookmarkProcessing.js";

async function getBookmarks() {
  try {
    const bookmarkTreeNodes = await browser.bookmarks.getTree();
    const bookmarks = [];
    
    function flattenBookmarkTree(node) {
      if (node.url) {
        bookmarks.push({
          id: node.id,
          name: node.title,
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

async function updateBookmarkStructure(processedBookmarks) {
  try {
    // Create a new root folder for the organized bookmarks
    const organizedFolder = await browser.bookmarks.create({
      title: 'Organized Bookmarks',
    });
   
    // Recursively create folders and add bookmarks
    async function createFoldersAndBookmarks(bookmarkData, parentId) {
      for (const item of bookmarkData) {
        if (item.type === 'folder') {
          const folder = await browser.bookmarks.create({
            parentId: parentId,
            title: item.name,
          });
          console.log(`Created folder: ${item.name}`);
          await createFoldersAndBookmarks(item.children, folder.id);
        } else if (item.type === 'bookmark') {
          await browser.bookmarks.create({
            parentId: parentId,
            title: item.name || 'Untitled Bookmark',
            url: item.url,
          });
        }
      }
    }
   
    // Start creating folders and bookmarks from the root level
    await createFoldersAndBookmarks(processedBookmarks, organizedFolder.id);
    console.log('Bookmark structure updated successfully.');
  } catch (error) {
    console.error('Failed to update bookmark structure:', error);
    throw error;
  }
}

async function handleBookmarkRetrieval() {
  try {
    const bookmarks = await getBookmarks();
    const processedBookmarks = await processBookmarks(bookmarks);
    console.log('Processed bookmarks:', processedBookmarks);
    
    if (!processedBookmarks || !processedBookmarks.children || !Array.isArray(processedBookmarks.children)) {
      console.error('Invalid processed bookmarks data:', processedBookmarks);
      throw new Error('Invalid processed bookmarks data');
    }
    
    console.log('Processed bookmarks received, updating bookmark structure...');
    await updateBookmarkStructure(processedBookmarks.children);
  } catch (error) {
    console.error('Failed to handle bookmark retrieval:', error);
  }
}

function initializeUI() {
  const sortButton = document.getElementById('sortBookmarksButton');
  sortButton.addEventListener('click', handleBookmarkRetrieval);
}

export { initializeUI };
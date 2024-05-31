// eventHandlers.js
import { simplifyBookmarkData } from "./bookmarkUtils.js";
import { preprocessBookmarks, clusterBookmarks, generateBookmarkFolders } from "./backend/bookmarkProcessing.js";

const debugMode = true;

function logDebug(message) {
  if (debugMode) {
    console.log(message);
  }
}

function safelyGetElementById(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id '${id}' not found.`);
  return element;
}

async function removeBookmarksRecursively(bookmarkNodes) {
  for (const node of bookmarkNodes) {
    if (node.children) {
      await removeBookmarksRecursively(node.children);
    }
    if (node.url) {
      await browser.bookmarks.remove(node.id);
    } else if (node.id !== "0" && node.id !== "1" && node.id !== "2" && !["toolbar_____", "menu________", "unfiled_____", "mobile______"].includes(node.id)) {
      await browser.bookmarks.removeTree(node.id);
    }
  }
}

async function removeAllBookmarksExceptRoots() {
  try {
    const roots = await browser.bookmarks.getTree();
    for (const root of roots) {
      await removeBookmarksRecursively(root.children);
    }
    logDebug("All non-root bookmarks and folders removed.");
  } catch (error) {
    console.error("Error removing all bookmarks except roots:", error);
    throw error;
  }
}

async function setBookmarksInBrowser(sortedBookmarks) {
  try {
    await removeAllBookmarksExceptRoots();

    const toolbarFolderId = "toolbar_____";

    let creationPromises = [];
    for (const [category, bookmarks] of Object.entries(sortedBookmarks)) {
      const newFolder = await browser.bookmarks.create({
        parentId: toolbarFolderId,
        title: category
      });
      for (const bookmark of bookmarks) {
        const creationPromise = browser.bookmarks.create({
          parentId: newFolder.id,
          title: bookmark.name,
          url: bookmark.url
        });
        creationPromises.push(creationPromise);
      }
    }

    await Promise.all(creationPromises);
    logDebug("New bookmarks added to the browser.");
  } catch (error) {
    console.error("Error setting bookmarks in the browser:", error);
    throw error;
  }
}

async function initializeUI() {
  const sortButton = safelyGetElementById("saveBookmarksButton");
  const indicator = safelyGetElementById("waitingIndicator");
  const errorContainer = safelyGetElementById("errorContainer");

  sortButton.addEventListener("click", async () => {
    indicator.style.display = "block";
    errorContainer.style.display = "none";

    try {
      const bookmarkItems = await browser.bookmarks.getTree();
      const simplifiedBookmarks = bookmarkItems.flatMap(item =>
        simplifyBookmarkData(item)
      );

      const preprocessedBookmarks = preprocessBookmarks(simplifiedBookmarks);
      const clusteredBookmarks = clusterBookmarks(preprocessedBookmarks);
      const sortedBookmarks = generateBookmarkFolders(clusteredBookmarks);

      await setBookmarksInBrowser(sortedBookmarks);
      logDebug("Bookmarks added to the browser successfully.");
    } catch (error) {
      console.error("Error processing bookmarks:", error);
      errorContainer.textContent = error.message || "An unexpected error occurred. Please try again later.";
      errorContainer.style.display = "block";
    } finally {
      indicator.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", initializeUI);
// backend/bookmarkProcessing.js
import * as clustering from "./clustering.js";
import * as dataPreprocessing from "./dataPreprocessing.js";

export function preprocessBookmarks(bookmarks) {
  // Preprocess the bookmarks using the functions from dataPreprocessing.js
  const preprocessedBookmarks = dataPreprocessing.preprocessBookmarks(bookmarks);
  return preprocessedBookmarks;
}

export function clusterBookmarks(preprocessedBookmarks) {
  // Cluster the preprocessed bookmarks using the functions from clustering.js
  const clusteredBookmarks = clustering.clusterBookmarks(preprocessedBookmarks);
  return clusteredBookmarks;
}

export function generateBookmarkFolders(clusteredBookmarks) {
  // Generate bookmark folders based on the clustered bookmarks
  const bookmarkFolders = {};

  for (const [cluster, bookmarks] of Object.entries(clusteredBookmarks)) {
    const folderName = `Cluster ${cluster}`;
    bookmarkFolders[folderName] = bookmarks;
  }

  return bookmarkFolders;
}
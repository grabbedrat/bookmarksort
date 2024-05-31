/*
 * Function to recursively remove unnecessary properties from bookmark items.
 */
function stripUnneededInfo(bookmarkItem) {
  delete bookmarkItem.id;
  delete bookmarkItem.index;
  delete bookmarkItem.parentId;

  if (bookmarkItem.children) {
      bookmarkItem.children.forEach(child => stripUnneededInfo(child));
  }
}

/*
* Function to fetch all bookmarks, clean them, and save them to a file.
*/
function saveBookmarksToFile(bookmarkItems) {
  // Serialize the cleaned bookmark tree to a JSON format string.
  const bookmarksData = JSON.stringify(bookmarkItems, null, 2);
  // Create a blob with the bookmarks data.
  const blob = new Blob([bookmarksData], {type: "application/json"});
  // Create a URL for the blob.
  const url = URL.createObjectURL(blob);

  // Programmatically create an anchor element to trigger the download.
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookmarks_backup.json"; // Set the name for the file to be downloaded.
  document.body.appendChild(a); // Append the anchor to the body temporarily.
  a.click(); // Simulate a click on the anchor to trigger the download.
  document.body.removeChild(a); // Remove the anchor from the body.
  URL.revokeObjectURL(url); // Clean up by revoking the blob URL.
}

// Function that processes bookmarks and sends them to the server.
function sendBookmarksToServer() {
  browser.bookmarks.getTree().then(bookmarkItems => {
      // Iterate over the entire bookmark tree to remove unneeded properties.
      bookmarkItems.forEach(item => stripUnneededInfo(item));

      // First, save the cleaned bookmarks locally.
      saveBookmarksToFile(bookmarkItems);

      // Next, send the bookmarks to the server.
      // Convert the bookmark items to a format suitable for the server if necessary.
      const bookmarksData = JSON.stringify(bookmarkItems, null, 2);
      fetch('http://localhost:5000/cluster', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: bookmarksData,
      })
      .then(response => response.json())
      .then(data => {
          console.log('Success:', data);
          // Assuming the server responds with a URL to download the processed bookmarks,
          // or with the processed bookmarks directly in the response.
          // If the server responds with the direct data to download:
          const processedBookmarkData = JSON.stringify(data, null, 2);
          const blob = new Blob([processedBookmarkData], {type: "application/json"});
          const url = URL.createObjectURL(blob);

          // Create an anchor to trigger the download of the processed bookmarks.
          const a = document.createElement("a");
          a.href = url;
          a.download = "processed_bookmarks.json"; // Set the download file name.
          document.body.appendChild(a); // Append the anchor to the body temporarily.
          a.click(); // Simulate a click on the anchor to trigger the download.
          document.body.removeChild(a); // Remove the anchor from the body.
          URL.revokeObjectURL(url); // Clean up by revoking the blob URL.
      })
      .catch(error => {
          console.error('Error:', error);
      });
  });
}

// Setup the event listener for the document to bind the save function to a button click.
document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('saveBookmarksButton');
  if (saveButton) {
      saveButton.addEventListener('click', sendBookmarksToServer);
  }
});

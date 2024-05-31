# Bookmark Sorting Extension
A browser extension that intelligently sorts and organizes your bookmarks using machine learning techniques.

## Features
- Retrieves and preprocesses bookmark data from your browser
- Tags bookmarks using language model (LLM) calls for enhanced categorization
- Embeds bookmarks using BERT differentiable semantics for accurate clustering
- Performs hierarchical density-based spatial clustering of applications with noise (HDBSCAN) to group similar bookmarks together
- Generates meaningful folder names using LLM based on the clustered bookmarks
- Updates the browser's bookmark structure with the newly organized folders

## Installation
1. Clone the repository
2. Install the necessary dependencies
3. Build the extension
4. Load the extension in your browser

## Usage
1. Click on the extension icon in your browser's toolbar
2. Click the "Sort Bookmarks" button to initiate the bookmark sorting process
3. Wait for the extension to retrieve, preprocess, cluster, and reorganize your bookmarks
4. Once the process is complete, your bookmarks will be sorted into newly generated folders

## Configuration
The extension provides a few configuration options that can be modified in the `config.js` file:
- `LLM_API_KEY`: Your API key for the language model service (e.g., OpenAI, Anthropic)
- `BERT_MODEL`: The BERT model to be used for embedding bookmarks (e.g., 'bert-base-uncased')
- `HDBSCAN_MIN_CLUSTER_SIZE`: The minimum cluster size parameter for the HDBSCAN algorithm
- `HDBSCAN_MIN_SAMPLES`: The minimum samples parameter for the HDBSCAN algorithm

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
This project is licensed under the MIT License.

## Acknowledgements
- OpenAI for providing the language model API
- Hugging Face for the BERT models and transformers library
- hdbscan for the hierarchical density-based spatial clustering algorithm
- Pyodide for enabling Python execution in the browser
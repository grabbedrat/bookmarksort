import numpy as np
from sklearn.decomposition import PCA
import hdbscan
import json

def cluster_bookmarks(bookmark_data):
    # Parse the JSON input if it's a string
    if isinstance(bookmark_data, str):
        bookmark_data = json.loads(bookmark_data)

    print("Received bookmark data:", bookmark_data)
    
    # Extract embeddings from the bookmark data
    embeddings = np.array([bookmark["embedding"] for bookmark in bookmark_data])
    print("Extracted embeddings:", embeddings)
    
    # Validate that there is at least one non-empty embedding array
    if embeddings.size == 0:
        raise ValueError("Embeddings are empty. Cannot perform clustering.")
    
    # Reduce the dimensionality of the embeddings using PCA
    pca = PCA(n_components=2)
    reduced_embeddings = pca.fit_transform(embeddings)
    
    # Create an instance of the HDBSCAN clusterer with the specified hyperparameters
    clusterer = hdbscan.HDBSCAN(min_cluster_size=2, min_samples=1,
                                cluster_selection_epsilon=0.5, metric='euclidean',
                                gen_min_span_tree=True)
    
    # Fit the clusterer to the reduced embeddings
    clusterer.fit(reduced_embeddings)
    
    # Build the cluster hierarchy from the condensed tree
    cluster_hierarchy = {}
    for _, row in clusterer.condensed_tree_.to_pandas().iterrows():
        child = row['child']
        parent = row['parent']
        if parent not in cluster_hierarchy:
            cluster_hierarchy[parent] = {'children': []}
        if child not in cluster_hierarchy:
            cluster_hierarchy[child] = {'children': []}
        cluster_hierarchy[parent]['children'].append(child)
    
    # Find the root cluster
    root_cluster = None
    for cluster_id in cluster_hierarchy:
        if cluster_id not in [child for parent in cluster_hierarchy for child in cluster_hierarchy[parent]['children']]:
            root_cluster = cluster_id
            break
    
    # Assign bookmarks to their respective clusters
    cluster_bookmarks = {}
    for i, cluster_id in enumerate(clusterer.labels_):
        if cluster_id not in cluster_bookmarks:
            cluster_bookmarks[cluster_id] = []
        cluster_bookmarks[cluster_id].append(bookmark_data[i])
    
    # Recursive function to generate the folder structure
    def generate_folder_structure(cluster_id, depth=0):
        folder = {}
        folder["name"] = f"Folder {cluster_id}"
        folder["type"] = "folder"
        folder["children"] = [{"name": bookmark["title"], "type": "bookmark", "url": bookmark["url"]} for bookmark in cluster_bookmarks.get(cluster_id, [])]
        for child_id in cluster_hierarchy.get(cluster_id, {}).get('children', []):
            child_folder = generate_folder_structure(child_id, depth + 1)
            if child_folder:
                folder["children"].append(child_folder)
        if folder["children"]:
            return folder
        else:
            return None
    
    # Generate the root folder structure
    root_folder = {
        "name": "Root",
        "type": "folder",
        "children": [generate_folder_structure(root_cluster)]
    }
    
    # Return the folder structure as a JSON string
    return json.dumps(root_folder, indent=2)

import numpy as np
import hdbscan
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
import json

min_cluster_size = 5  # Default: 5, Recommended range: 1-20
min_samples = 1  # Default: 1, Recommended range: 1-10
cluster_selection_epsilon = 0.0  # Default: 0.0, Recommended range: 0.0-1.0
metric = 'euclidean'  # Default: 'euclidean', Options: 'euclidean', 'cosine', 'manhattan'

def cluster_bookmarks(bookmark_data_json):
    bookmarks = json.loads(bookmark_data_json)
    bookmarks_data = [{"title": bookmark.get("title", ""), "url": bookmark.get("url", ""), "tags": " ".join(bookmark.get("tags", []))} for bookmark in bookmarks]

    # Check if there are any valid tags
    if not any(bookmark["tags"].strip() for bookmark in bookmarks_data):
        # Return a default structure if there are no valid tags
        return json.dumps({
            "name": "Root",
            "children": [{"name": "Uncategorized", "bookmarks": bookmarks_data}]
        }, indent=2)

    vectorizer = TfidfVectorizer()
    features = vectorizer.fit_transform([bookmark["tags"] for bookmark in bookmarks_data])

    pca = PCA(n_components=2)
    reduced_features = pca.fit_transform(features.toarray())

    clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, min_samples=min_samples,
                                cluster_selection_epsilon=cluster_selection_epsilon, metric=metric,
                                gen_min_span_tree=True)
    clusterer.fit(reduced_features)

    cluster_hierarchy = {}
    for _, row in clusterer.condensed_tree_.to_pandas().iterrows():
        child = row['child']
        parent = row['parent']
        if parent not in cluster_hierarchy:
            cluster_hierarchy[parent] = {'children': []}
        if child not in cluster_hierarchy:
            cluster_hierarchy[child] = {'children': []}
        cluster_hierarchy[parent]['children'].append(child)

    root_cluster = None
    for cluster_id in cluster_hierarchy:
        if cluster_id not in [child for parent in cluster_hierarchy for child in cluster_hierarchy[parent]['children']]:
            root_cluster = cluster_id
            break

    cluster_bookmarks = {}
    for i, cluster_id in enumerate(clusterer.labels_):
        if cluster_id not in cluster_bookmarks:
            cluster_bookmarks[cluster_id] = []
        cluster_bookmarks[cluster_id].append(bookmarks_data[i])

    def generate_folder_structure(cluster_id, depth=0):
        folder = {}
        folder["name"] = f"Folder {cluster_id}"
        folder["bookmarks"] = cluster_bookmarks.get(cluster_id, [])
        folder["children"] = []

        for child_id in cluster_hierarchy.get(cluster_id, {}).get('children', []):
            child_folder = generate_folder_structure(child_id, depth + 1)
            if child_folder:
                folder["children"].append(child_folder)

        if folder["bookmarks"] or folder["children"]:
            folder["depth"] = depth
            return folder
        else:
            return None

    root_folder = {
        "name": "Root",
        "children": [generate_folder_structure(root_cluster)]
    }

    return json.dumps(root_folder, indent=2)
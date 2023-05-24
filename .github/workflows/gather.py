import os
import json
import codecs

def find_metadata_files(repo_path):
    metadata_files = []

    for root, dirs, files in os.walk(repo_path):
        if 'metadata.json' in files:
            metadata_files.append(os.path.join(root, 'metadata.json'))

    return metadata_files

def extract_readme(file_path):
    readme_path = os.path.join(os.path.dirname(file_path), 'README.md')
    if os.path.exists(readme_path):
        with codecs.open(readme_path, 'r', 'utf-8') as readme_file:
            return readme_file.read()
    else:
        readme_path = os.path.join(os.path.dirname(os.path.dirname(file_path)), 'README.md')
        if os.path.exists(readme_path):
            with codecs.open(readme_path, 'r', 'utf-8') as readme_file:
                return readme_file.read()
        else:
            return ''

def extract_application_name(readme_path):
    # Extract the application name from the README file path
    parts = readme_path.split(os.sep)
    if 'applications' in parts:
        index = parts.index('applications')
        if index + 1 < len(parts):
            return parts[index + 1]
    return ''

def gather_metadata(repo_path, output_file):
    metadata_files = find_metadata_files(repo_path)
    metadata = []

    for file_path in metadata_files:
        with open(file_path, 'r') as file:
            data = json.load(file)
            readme = extract_readme(file_path)
            application_name = extract_application_name(file_path)
            data['readme'] = readme
            data['application_name'] = application_name
            metadata.append(data)

    with open(output_file, 'w') as output:
        json.dump(metadata, output)

repo_path = 'holohub/applications'
output_file = 'aggregate_metadata.json'

gather_metadata(repo_path, output_file)

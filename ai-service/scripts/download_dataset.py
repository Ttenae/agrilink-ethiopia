# download_dataset.py
# Simple script to download PlantVillage dataset

import os
import zipfile
import requests
from tqdm import tqdm

def download_dataset():
    print("🚀 Downloading PlantVillage dataset...")
    print("⚠️ This is a large dataset (1.2GB). Please be patient.")
    
    # Kaggle API requires authentication
    # For now, just print instructions
    print("""
    To download the dataset:
    
    1. Go to: https://www.kaggle.com/datasets/emmarex/plantdisease
    2. Click Download
    3. Extract to: data/plant_disease/
    
    Or use Kaggle CLI:
    kaggle datasets download -d emmarex/plantdisease -p data/
    unzip data/plantdisease.zip -d data/plant_disease/
    """)

if __name__ == "__main__":
    download_dataset()

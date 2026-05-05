import os
import torchvision.datasets as datasets
from torchvision import transforms

def download_and_setup_food101():
    """
    Downloads and extracts the Food-101 dataset using PyTorch's built-in 
    torchvision module. This is the safest and most reliable way to get the data.
    """
    
    # Create data directory
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    print(f"Starting Food-101 Dataset Download (This is ~5GB and may take a while)...")
    print(f"Target Directory: {data_dir}\n")
    
    try:
        # Download Training Set (Will download the full dataset once)
        train_dataset = datasets.Food101(
            root=data_dir, 
            split='train', 
            download=True
        )
        print("\n✅ Training dataset downloaded and verified successfully!")
        
        # Validation/Test Set (Uses the same downloaded archive)
        test_dataset = datasets.Food101(
            root=data_dir, 
            split='test', 
            download=True
        )
        print("✅ Test dataset verified successfully!")
        
        print(f"\nDataset Statistics:")
        print(f"- Number of Training Images: {len(train_dataset)}")
        print(f"- Number of Test Images: {len(test_dataset)}")
        print(f"- Number of Classes: {len(train_dataset.classes)}")
        
        print("\n🎉 The dataset is ready for Phase 2 (Model Training).")
        
    except Exception as e:
        print(f"\n❌ Error downloading the dataset: {e}")
        print("Please ensure you have a stable internet connection and enough disk space (~5GB).")

if __name__ == "__main__":
    download_and_setup_food101()

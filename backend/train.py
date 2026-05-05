import os
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
from tqdm import tqdm

NUM_CLASSES = 101 # Food-101 has 101 classes
BATCH_SIZE = 32
EPOCHS = 5

def get_transforms():
    """Standard transformations for ImageNet pre-trained models."""
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform

def get_model(model_name, device):
    """Initializes and modifies the selected model architecture."""
    if model_name == 'resnet50':
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        # Freeze base layers
        for param in model.parameters():
            param.requires_grad = False
        # Modify classifier
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, NUM_CLASSES)
        
    elif model_name == 'efficientnet':
        model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        for param in model.parameters():
            param.requires_grad = False
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_ftrs, NUM_CLASSES)
        
    elif model_name == 'vit':
        model = models.vit_b_16(weights=models.ViT_B_16_Weights.IMAGENET1K_V1)
        for param in model.parameters():
            param.requires_grad = False
        num_ftrs = model.heads.head.in_features
        model.heads.head = nn.Linear(num_ftrs, NUM_CLASSES)
        
    else:
        raise ValueError("Invalid model name. Choose 'resnet50', 'efficientnet', or 'vit'.")

    return model.to(device)

def train_model(model_name):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")
    
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    train_transform, val_transform = get_transforms()
    
    # Load datasets
    print("Loading datasets...")
    train_data = datasets.Food101(root=data_dir, split='train', transform=train_transform, download=False)
    val_data = datasets.Food101(root=data_dir, split='test', transform=val_transform, download=False)
    
    train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_data, batch_size=BATCH_SIZE, shuffle=False, num_workers=4)
    
    # Initialize model
    print(f"Initializing {model_name}...")
    model = get_model(model_name, device)
    
    criterion = nn.CrossEntropyLoss()
    # Only optimize the parameters that require gradients (the new classifier head)
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.001)
    
    best_acc = 0.0
    metrics = {"train_loss": [], "val_loss": [], "val_acc": []}
    
    for epoch in range(EPOCHS):
        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        print("-" * 10)
        
        # Training phase
        model.train()
        running_loss = 0.0
        
        for inputs, labels in tqdm(train_loader, desc="Training"):
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            
        epoch_loss = running_loss / len(train_data)
        metrics["train_loss"].append(epoch_loss)
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        correct = 0
        
        with torch.no_grad():
            for inputs, labels in tqdm(val_loader, desc="Validating"):
                inputs, labels = inputs.to(device), labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * inputs.size(0)
                _, preds = torch.max(outputs, 1)
                correct += torch.sum(preds == labels.data)
                
        epoch_val_loss = val_loss / len(val_data)
        epoch_val_acc = correct.double() / len(val_data)
        
        metrics["val_loss"].append(epoch_val_loss)
        metrics["val_acc"].append(epoch_val_acc.item())
        
        print(f"Train Loss: {epoch_loss:.4f} | Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.4f}")
        
        # Save best model
        if epoch_val_acc > best_acc:
            best_acc = epoch_val_acc
            save_path = os.path.join(os.path.dirname(__file__), f'{model_name}_best.pth')
            torch.save(model.state_dict(), save_path)
            print(f"[SUCCESS] Saved new best model to {save_path}")
            
    # Save metrics for Phase 3 plotting
    import json
    metrics_path = os.path.join(os.path.dirname(__file__), f'{model_name}_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f)
        
    print(f"\n[DONE] Training complete for {model_name}. Best accuracy: {best_acc:.4f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Food-101 Classification Models")
    parser.add_argument('--model', type=str, required=True, choices=['resnet50', 'efficientnet', 'vit'], 
                        help="Choose the model to train: resnet50, efficientnet, or vit")
    
    args = parser.parse_args()
    train_model(args.model)

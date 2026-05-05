import os
import json
import torch
import torch.nn as nn
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
from tqdm import tqdm
from train import get_model, NUM_CLASSES, BATCH_SIZE

MODELS_TO_EVALUATE = ['resnet50', 'efficientnet', 'vit']

def plot_comparative_metrics():
    """Reads the JSON metrics saved during training and plots comparative curves."""
    print("Generating Comparative Graphs...")
    
    plt.figure(figsize=(12, 5))
    
    # Plot Accuracy
    plt.subplot(1, 2, 1)
    for model_name in MODELS_TO_EVALUATE:
        metrics_file = os.path.join(os.path.dirname(__file__), f'{model_name}_metrics.json')
        if os.path.exists(metrics_file):
            with open(metrics_file, 'r') as f:
                metrics = json.load(f)
                plt.plot(metrics['val_acc'], label=model_name.upper(), marker='o')
    
    plt.title('Validation Accuracy Comparison')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)
    
    # Plot Loss
    plt.subplot(1, 2, 2)
    for model_name in MODELS_TO_EVALUATE:
        metrics_file = os.path.join(os.path.dirname(__file__), f'{model_name}_metrics.json')
        if os.path.exists(metrics_file):
            with open(metrics_file, 'r') as f:
                metrics = json.load(f)
                plt.plot(metrics['val_loss'], label=model_name.upper(), marker='x')
                
    plt.title('Validation Loss Comparison')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    graph_path = os.path.join(os.path.dirname(__file__), 'comparative_graphs.png')
    plt.savefig(graph_path)
    print(f"[SUCCESS] Saved comparative graphs to {graph_path}")

def generate_confusion_matrix(model_name, device, dataloader, class_names):
    """Generates and saves a confusion matrix for a specific model."""
    weights_path = os.path.join(os.path.dirname(__file__), f'{model_name}_best.pth')
    if not os.path.exists(weights_path):
        print(f"Skipping {model_name} confusion matrix: No weights found at {weights_path}")
        return

    print(f"\nEvaluating {model_name.upper()} on Test Set for Confusion Matrix...")
    
    model = get_model(model_name, device)
    model.load_state_dict(torch.load(weights_path, map_location=device, weights_only=True))
    model.eval()
    
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in tqdm(dataloader, desc=f"Testing {model_name}"):
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    # Print Classification Report (Precision, Recall, F1)
    report = classification_report(all_labels, all_preds, target_names=class_names)
    report_path = os.path.join(os.path.dirname(__file__), f'{model_name}_classification_report.txt')
    with open(report_path, 'w') as f:
        f.write(report)
    print(f"[SUCCESS] Saved classification report to {report_path}")

    # Generate Confusion Matrix
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(20, 20)) # Large figure due to 101 classes
    sns.heatmap(cm, annot=False, cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title(f'Confusion Matrix: {model_name.upper()}')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    
    cm_path = os.path.join(os.path.dirname(__file__), f'{model_name}_confusion_matrix.png')
    plt.savefig(cm_path)
    print(f"[SUCCESS] Saved confusion matrix to {cm_path}")

if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # 1. Plot the training curves
    plot_comparative_metrics()
    
    # 2. Setup Data for Confusion Matrix
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    if os.path.exists(data_dir):
        val_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        test_data = datasets.Food101(root=data_dir, split='test', transform=val_transform, download=False)
        test_loader = DataLoader(test_data, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
        class_names = test_data.classes
        
        # Run evaluation for whichever models have been trained
        for model_name in MODELS_TO_EVALUATE:
            generate_confusion_matrix(model_name, device, test_loader, class_names)
    else:
        print("\nData directory not found. Please ensure you have downloaded the dataset before running full evaluation.")

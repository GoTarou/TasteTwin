import os
import json
import torch
from flask import Flask, request, jsonify
from torchvision import transforms
from PIL import Image
import io

# Import the model initialization from our training script
from train import get_model, NUM_CLASSES

app = Flask(__name__)

# Global variables for the model and data
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
class_names = []
nutrition_db = {}

def load_resources():
    """Loads the model weights, class names, and nutritional database into memory."""
    global model, class_names, nutrition_db
    
    print("Loading resources...")
    
    # 1. Load Class Names
    # We try to read from the dataset's meta folder if it exists
    classes_path = os.path.join(os.path.dirname(__file__), 'data', 'food-101', 'meta', 'classes.txt')
    if os.path.exists(classes_path):
        with open(classes_path, 'r') as f:
            class_names = [line.strip() for line in f.readlines()]
    else:
        # Fallback if dataset isn't downloaded yet
        class_names = [f"class_{i}" for i in range(NUM_CLASSES)]
        print("Warning: classes.txt not found. Using fallback class names.")

    # 2. Load Nutrition DB
    db_path = os.path.join(os.path.dirname(__file__), 'nutrition_db.json')
    if os.path.exists(db_path):
        with open(db_path, 'r') as f:
            nutrition_db = json.load(f)
    else:
        print("Warning: nutrition_db.json not found.")

    # 3. Load Model (Defaulting to efficientnet for speed/size balance)
    model_name = 'resnet50'
    weights_path = os.path.join(os.path.dirname(__file__), f'{model_name}_best.pth')
    
    model = get_model(model_name, device)
    
    if os.path.exists(weights_path):
        model.load_state_dict(torch.load(weights_path, map_location=device, weights_only=True))
        print(f"[SUCCESS] Loaded {model_name} weights successfully.")
    else:
        print(f"[WARNING] Model weights not found at {weights_path}. Using untrained model!")
    
    model.eval()

# Transformation pipeline exactly matching validation
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "device": str(device)})

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided in the request"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Empty file name"}), 400

    try:
        # Read and preprocess the image
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        input_tensor = transform(img).unsqueeze(0).to(device)
        
        # Run Inference
        with torch.no_grad():
            outputs = model(input_tensor)
            _, predicted_idx = torch.max(outputs, 1)
            
        # Get class name
        class_idx = predicted_idx.item()
        predicted_class = class_names[class_idx]
        
        # Look up nutrition (fallback to default if not found)
        nutrition = nutrition_db.get(predicted_class, nutrition_db.get("default", {}))
        
        return jsonify({
            "success": True,
            "prediction": {
                "class_id": class_idx,
                "name": predicted_class.replace('_', ' ').title()
            },
            "nutrition": nutrition
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Load all heavy resources before starting the server
    load_resources()
    
    # Run the Flask app
    print("\n[STARTING] TasteTwin AI Backend on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)

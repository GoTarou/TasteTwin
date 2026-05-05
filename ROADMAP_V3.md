# TasteTwin — ROADMAP v3 (Custom Machine Learning Model)

> **Last updated:** 2026-05-03
> **Goal:** Transition from using the third-party Gemini Vision API to training, deploying, and integrating a custom Convolutional Neural Network (CNN) for food recognition.

---

## 🎯 ARCHITECTURE SHIFT

**Old Architecture (v2):**
React Native App -> Third-party Gemini API (Cloud) -> Returns Prediction & Nutrition Data

**New Architecture (v3):**
React Native App -> **Custom Python Server (Flask/FastAPI)** -> **Custom Trained CNN (PyTorch/TensorFlow)** -> Returns Prediction -> Python Server maps prediction to Nutrition Data via JSON DB -> React Native App

---

## 🚀 PHASE 1: Data Preparation & Exploration
**Objective:** Acquire and format the datasets for training classification and recommendation systems.
**Datasets Used:** Food-101 (Image Classification) and Recipe1M+ (Semantic Understanding & Recommendations).

1. **Download Datasets:** Download the Food-101 dataset and Recipe1M+ dataset to your local machine or a cloud environment like Google Colab or Kaggle.
2. **Data Cleaning:** Inspect the datasets for corrupted images or missing ingredient lists and remove them.
3. **Train/Val/Test Split:** Organize the dataset into `train/`, `val/`, and `test/` folders (typically 80% train, 10% validation, 10% test).
4. **Data Augmentation:** Apply transformations such as random horizontal flips, rotations, and color jitter to artificially increase the size of the training dataset and prevent overfitting.
5. **Normalization:** Resize all images to a standard dimension (e.g., 224x224 pixels) and normalize pixel values to match standard pre-trained model expectations (e.g., ImageNet standards).

---

## 🧠 PHASE 2: Model Architecture & Training
**Objective:** Train and compare three distinct deep learning architectures (CNNs and Transformers) to identify the best performer for the final application.
**Recommended Framework:** PyTorch.
**Models to Train:**
- **Model 1 (Baseline CNN):** ResNet-50 (Used in original im2recipe code, strong baseline)
- **Model 2 (Lightweight CNN):** EfficientNet-B0 (Highly optimized balance of accuracy and size, great for mobile-first apps)
- **Model 3 (Transformer):** Vision Transformer (ViT-B/16) (State-of-the-art attention-based model for comparison against CNNs)

1. **Setup Environment:** Use the PyTorch environment established in Phase 1.
2. **Transfer Learning Preparation:** For all three models, load their ImageNet pre-trained weights and freeze the base layers.
3. **Modify Classifiers:** Replace the final classification layer of each model to output 101 classes (matching Food-101) instead of the default 1000 ImageNet classes.
4. **Define Hyperparameters:** Standardize the training setup across all 3 models: use `CrossEntropyLoss`, the `Adam` optimizer, and the exact same batch size and learning rate to ensure a fair comparison.
5. **Execute Training:** Run the training loop for each model independently for the same number of epochs (e.g., 15 epochs).
6. **Save Checkpoints:** Save the best weights for each architecture (e.g., `resnet50_best.pth`, `efficientnet_best.pth`, `vit_best.pth`).

---

## 📊 PHASE 3: Model Evaluation & Comparative Analysis
**Objective:** Rigorously test the three trained models, compare their performance visually, and justify the selection of the final "winning" model for the project report.

1. **Test Set Evaluation:** Pass the unseen `test/` data through all three saved models.
2. **Comparative Metrics Table:** Calculate and compare overall Accuracy, Precision, Recall, F1-Score, **Model Size (MB)**, and **Inference Time (ms per image)** for all three models.
3. **Comparative Graphs for Report:** 
   - **Accuracy Curves:** Plot validation accuracy over epochs for all 3 models on the *same graph* to show which learned fastest.
   - **Loss Curves:** Plot validation loss overlaid on one graph.
   - **Inference vs Accuracy Trade-off:** A scatter plot showing inference speed vs accuracy to visually justify your model choice.
4. **Confusion Matrices:** Generate a confusion matrix for the winning model to analyze specific misclassifications (e.g., confusing hot dog with sausage).
5. **Final Selection:** Choose the best model based on the testing data (usually the one with the best balance of high accuracy and fast inference time) to proceed to Phase 4.

---

## ⚙️ PHASE 4: Backend API Development
**Objective:** Host the trained model on a server so the app can communicate with it.
**Recommended Framework:** Flask or FastAPI.

1. **Create Python Server:** Initialize a basic Python web server.
2. **Load Winning Model:** Write code to load the selected best model (e.g., `efficientnet_best.pth`) into memory on server startup.
3. **Create Prediction Endpoint:** Create a `POST /predict` route that accepts an image file as form data.
4. **Pre-processing in Server:** Have the endpoint convert the incoming image to the 224x224 tensor format the model expects.
5. **Run Inference:** Pass the tensor to the model and get the predicted class name (e.g., "pizza").
6. **Nutritional Mapping:** Utilize the **USDA FoodData Central** database. You can either query their API or download a subset of their CSV/JSON data to create a local lookup table that maps the 101 food classes to their official nutritional macros (Calories, Protein, Carbs, Fat).
7. **Semantic Recommendations:** Use embeddings generated from the **Recipe1M+ dataset** to provide recipe and similarity-based food recommendations for the recognized dish.
8. **Return Response:** Return the predicted class, nutritional data from USDA, and recommendations as a JSON response to the app.
8. **Host the Server:** Run the server locally (using Ngrok to expose it) or host it on a service like Render or Heroku.

---

## 📱 PHASE 5: React Native App Integration
**Objective:** Connect the TasteTwin app to the new Custom Backend.

1. **Update Dependencies:** Remove the `@google/generative-ai` library as we are no longer using Gemini.
2. **Refactor `useAnalyze.ts`:** Change the API call in this hook. Instead of sending the image to Google, use `fetch` or `axios` to POST the image to your Custom Python API's `/predict` endpoint.
3. **Handle New Response:** Ensure the `PredictionResultScreen` correctly parses the JSON format returned by your Custom API instead of the Gemini format.
4. **End-to-End Testing:** Take a photo using the app, verify it hits your Python server, the model makes a prediction, and the result is displayed in the app UI.

---

## 🛠️ EXECUTION ORDER

| Order | Phase | Priority | Est. Effort | Focus |
|-------|-------|----------|-------------|-------|
| 1 | Phase 1: Data Preparation | 🔴 Blocker | Medium | Python/Data Science |
| 2 | Phase 2: Model Training | 🔴 Blocker | Very Large | PyTorch/Deep Learning |
| 3 | Phase 3: Model Evaluation | 🟡 Required | Small | Metrics/Reporting |
| 4 | Phase 4: Backend API | 🔴 Blocker | Medium | Flask/Python Web |
| 5 | Phase 5: App Integration | 🟡 Required | Small | React Native |

> **Next Step:** To begin, you should set up your Python environment and start downloading the Food-101 dataset. Let me know if you need Python scripts to automate Phase 1 and 2!

---

## 📚 REFERENCES & DATASETS

1. **Food-101 Dataset**
   - **Purpose:** Used to train the core Convolutional Neural Network (CNN) for food image classification so the app can recognize user-uploaded photos.
   - **Link:** [https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/)

2. **Recipe1M+ Dataset**
   - **Purpose:** Large-scale dataset containing food images, ingredient lists, and instructions. Used to build semantic understanding of dishes and power the similarity-based food recommendation engine.
   - **Link:** [http://pic2recipe.csail.mit.edu/](http://pic2recipe.csail.mit.edu/)

3. **USDA FoodData Central**
   - **Purpose:** Official nutrition database used to map recognized dishes to accurate macro-nutrients (calories, protein, carbohydrates, fat) for the nutritional display in the app.
   - **Link:** [https://fdc.nal.usda.gov/](https://fdc.nal.usda.gov/)

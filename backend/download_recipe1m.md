# How to Download the Recipe1M+ Dataset

> **Important:** The Recipe1M+ dataset is strictly controlled by MIT for academic research purposes. It **cannot** be downloaded automatically via a script.

To obtain the dataset for the semantic recommendation engine of the TasteTwin project, you must follow these manual steps:

## Step 1: Register on the Portal
1. Go to the official dataset portal: [http://pic2recipe.csail.mit.edu/](http://pic2recipe.csail.mit.edu/)
2. Look for the "Dataset" or "Download" section.
3. You will be required to fill out a registration form.
4. **Crucial:** You must use an official university/academic email address (e.g., ending in `.edu` or your university's domain). Commercial emails (like `@gmail.com` or `@yahoo.com`) are typically rejected automatically.

## Step 2: Await Approval
1. Once you submit the form, the dataset maintainers will review your request.
2. This can take anywhere from a few minutes (if automated) to a few days.
3. Once approved, you will receive an email containing a secure download link.

## Step 3: Download and Extract
1. The dataset is extremely large. Ensure you have at least 50GB-100GB of free space.
2. Download the compressed archives provided in the email.
3. Extract the contents into the following directory in your TasteTwin project:
   `TasteTwin/backend/data/recipe1m/`

## Step 4: Verify the Data
You should see files containing the images, the JSON files for ingredients, and the instructions. Once you have these files in the `data/recipe1m/` directory, you can begin Phase 4 (building the recommendation engine embeddings).

import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import json
import os
import random
import timm

# ==================== MODEL LOADING ====================
MODEL_PATH = "models/agrilink_model.pth"
CLASSES_PATH = "models/classes.json"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = None
classes = None

def load_model():
    global model, classes
    
    if model is None:
        try:
            # Check if model exists
            if not os.path.exists(MODEL_PATH):
                print(f"❌ Model not found: {MODEL_PATH}")
                return None, None
            
            # Load classes
            with open(CLASSES_PATH, 'r') as f:
                classes = json.load(f)
            
            # Create model architecture
            model = timm.create_model('efficientnet_b0', pretrained=False)
            in_features = model.classifier.in_features
            model.classifier = nn.Sequential(
                nn.Dropout(0.2),
                nn.Linear(in_features, 512),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(512, len(classes))
            )
            
            # Load trained weights
            checkpoint = torch.load(MODEL_PATH, map_location=device)
            model.load_state_dict(checkpoint['model_state_dict'])
            model.eval()
            model.to(device)
            
            print(f"✅ Model loaded! ({len(classes)} classes)")
            return model, classes
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return None, None
    
    return model, classes

# ==================== COMPLETE TREATMENT INFO ====================
TREATMENT_INFO = {
    # ==================== PEPPER DISEASES ====================
    'Pepper__bell___Bacterial_spot': {
        'treatment': 'Apply copper-based bactericide. Remove infected leaves. Practice crop rotation.',
        'description': 'Bacterial spot causes dark spots with yellow halos on pepper leaves and fruit.',
        'prevention': 'Use disease-free seeds. Avoid overhead watering. Remove infected plants.'
    },
    'Pepper__bell___healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Pepper plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    
    # ==================== POTATO DISEASES ====================
    'Potato___Early_blight': {
        'treatment': 'Apply fungicide (Chlorothalonil or Mancozeb). Remove infected leaves. Mulch around plants.',
        'description': 'Early blight causes dark spots with concentric rings on potato leaves. Can reduce yield.',
        'prevention': 'Practice crop rotation. Use disease-free seed potatoes. Water at base of plant.'
    },
    'Potato___Late_blight': {
        'treatment': 'Apply fungicide (Mancozeb or Chlorothalonil) immediately. Remove infected plants.',
        'description': 'Late blight causes dark spots and wilting on potato plants. Can destroy entire crop quickly.',
        'prevention': 'Use certified seed potatoes. Practice crop rotation. Apply preventative fungicides.'
    },
    'Potato___healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Potato plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    
    # ==================== TOMATO DISEASES ====================
    'Tomato_Bacterial_spot': {
        'treatment': 'Apply copper-based bactericide. Remove infected leaves. Practice crop rotation.',
        'description': 'Bacterial spot causes dark spots with yellow halos on tomato leaves and fruit.',
        'prevention': 'Use disease-free seeds. Avoid overhead watering. Remove infected plants.'
    },
    'Tomato_Early_blight': {
        'treatment': 'Apply fungicide (Chlorothalonil or Mancozeb). Remove infected leaves. Mulch around plants.',
        'description': 'Early blight causes dark spots with concentric rings on tomato leaves. Common in warm, wet conditions.',
        'prevention': 'Practice crop rotation. Water at base of plant. Remove infected plant debris.'
    },
    'Tomato_Late_blight': {
        'treatment': 'Apply fungicide (Mancozeb or Chlorothalonil) immediately. Remove infected plants.',
        'description': 'Late blight causes dark spots and wilting on tomato plants. Can destroy entire crop quickly.',
        'prevention': 'Use resistant varieties. Practice crop rotation. Apply preventative fungicides.'
    },
    'Tomato_Leaf_Mold': {
        'treatment': 'Improve air circulation. Apply fungicide (Chlorothalonil). Remove infected leaves.',
        'description': 'Leaf mold causes yellow spots on leaves with gray mold on undersides. Common in high humidity.',
        'prevention': 'Space plants properly. Avoid overhead watering. Ensure good ventilation.'
    },
    'Tomato_Septoria_leaf_spot': {
        'treatment': 'Apply fungicide (Chlorothalonil). Remove infected leaves. Improve air circulation.',
        'description': 'Septoria leaf spot causes small circular spots with dark borders on tomato leaves.',
        'prevention': 'Practice crop rotation. Water at base of plant. Remove infected plant debris.'
    },
    'Tomato_Spider_mites_Two_spotted_spider_mite': {
        'treatment': 'Apply miticide or insecticidal soap. Increase humidity. Remove heavily infested leaves.',
        'description': 'Spider mites cause stippling and webbing on tomato leaves. Common in hot, dry conditions.',
        'prevention': 'Keep plants well-watered. Use predatory mites. Regularly monitor plants.'
    },
    'Tomato_Target_Spot': {
        'treatment': 'Apply fungicide (Chlorothalonil). Remove infected leaves. Improve air circulation.',
        'description': 'Target spot causes dark spots with concentric rings on tomato leaves and fruit.',
        'prevention': 'Practice crop rotation. Avoid overhead watering. Remove infected plant debris.'
    },
    'Tomato_Tomato_mosaic_virus': {
        'treatment': 'No cure. Remove infected plants. Control insect vectors. Use resistant varieties.',
        'description': 'Mosaic virus causes mottled yellow-green patterns on tomato leaves. Stunts plant growth.',
        'prevention': 'Use resistant varieties. Control insects. Disinfect tools between plants.'
    },
    'Tomato_Tomato_YellowLeaf_Curl_Virus': {
        'treatment': 'No cure. Remove infected plants. Control whiteflies. Use resistant varieties.',
        'description': 'Yellow leaf curl virus causes upward curling and yellowing of tomato leaves. Reduces fruit production.',
        'prevention': 'Use resistant varieties. Control whiteflies. Use reflective mulches.'
    },
    'Tomato_healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Tomato plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    
    # ==================== GRAPE DISEASES ====================
    'Grape_Black_rot': {
        'treatment': 'Apply fungicide (Myclobutanil or Captan). Remove infected leaves and canes.',
        'description': 'Black rot causes dark spots on grape leaves and fruit. Fruit becomes shriveled and dark.',
        'prevention': 'Remove infected plant debris. Practice good air circulation. Apply protective fungicides.'
    },
    'Grape_Esca': {
        'treatment': 'No effective treatment. Remove infected vines. Practice good vineyard hygiene.',
        'description': 'Esca causes leaf discoloration, wilting, and vine decline. Affects grape quality.',
        'prevention': 'Use healthy planting material. Minimize pruning wounds. Good vineyard management.'
    },
    'Grape_Leaf_blight': {
        'treatment': 'Apply copper-based fungicide. Remove infected leaves. Improve air circulation.',
        'description': 'Leaf blight causes brown spots and leaf drop on grapevines.',
        'prevention': 'Avoid overhead watering. Practice good vineyard hygiene.'
    },
    'Grape_healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Grape plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good vineyard management.'
    }
}

def get_treatment_info(disease_name):
    """Get treatment information for a disease with fallback."""
    # Try exact match first
    if disease_name in TREATMENT_INFO:
        return TREATMENT_INFO[disease_name]
    
    # Try with underscores replaced (e.g., "Grape Leaf Blight" -> "Grape_Leaf_blight")
    disease_key = disease_name.replace(' ', '_')
    if disease_key in TREATMENT_INFO:
        return TREATMENT_INFO[disease_key]
    
    # If disease not found, provide a helpful fallback
    return {
        'treatment': f'For {disease_name}, consult a local agricultural expert for proper diagnosis and treatment.',
        'description': f'{disease_name} detected in the crop. Please consult an expert for proper diagnosis.',
        'prevention': 'Practice good agricultural practices. Maintain proper spacing and irrigation. Monitor regularly.'
    }

# ==================== PREDICTION ====================
def predict_disease(image_path):
    """Predict disease from image using trained model."""
    model, classes = load_model()
    
    if model is None or classes is None:
        return get_mock_prediction()
    
    try:
        # Preprocess image
        transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        image = Image.open(image_path).convert('RGB')
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        # Predict
        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.nn.functional.softmax(output, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
        
        disease_name = classes[predicted.item()]
        confidence_percent = confidence.item() * 100
        
        # Format disease name for display (replace underscores with spaces)
        display_name = disease_name.replace('_', ' ').replace('___', ' ')
        
        # Get treatment info
        info = get_treatment_info(disease_name)
        
        # Determine if healthy
        is_healthy = 'healthy' in disease_name.lower()
        
        return {
            'disease': display_name,
            'confidence': confidence_percent,
            'treatment': info.get('treatment', 'Consult local expert.'),
            'description': info.get('description', 'Disease detected. Please consult an expert.'),
            'prevention': info.get('prevention', 'Practice good agricultural practices.'),
            'is_healthy': is_healthy,
            'model_type': 'trained_efficientnet',
            'model_confidence': confidence_percent
        }
        
    except Exception as e:
        print(f'❌ Prediction error: {e}')
        return get_mock_prediction()

def get_mock_prediction():
    """Fallback mock prediction for testing."""
    mock_diseases = [
        {
            'disease': 'Potato Late Blight',
            'confidence': 87.5,
            'treatment': 'Apply fungicide (Mancozeb). Remove infected plants.',
            'description': 'Late blight causes dark spots and wilting on potato plants.',
            'prevention': 'Use certified seed potatoes. Practice crop rotation.',
            'is_healthy': False
        },
        {
            'disease': 'Tomato Healthy',
            'confidence': 95.1,
            'treatment': 'No treatment needed.',
            'description': 'Tomato plant appears healthy.',
            'prevention': 'Maintain regular monitoring.',
            'is_healthy': True
        }
    ]
    return random.choice(mock_diseases)
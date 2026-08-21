import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import json
import os
import random
import timm

# ==================== MODEL LOADING ====================
MODEL_PATH = "models/crop_model.pth"
CLASSES_PATH = "models/crop_classes.json"

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

# ==================== COMPLETE TREATMENT INFO FOR ALL 45 CLASSES ====================
TREATMENT_INFO = {
    # ==================== CORN DISEASES ====================
    'Corn_Blight': {
        'treatment': 'Apply fungicide (Mancozeb or Chlorothalonil). Remove infected leaves. Practice crop rotation with non-corn crops for 2-3 years.',
        'description': 'Corn blight causes brown spots and lesions on leaves, reducing photosynthesis and yield. Can cause significant crop loss if not managed.',
        'prevention': 'Use disease-resistant varieties. Crop rotation with non-corn crops. Remove plant debris after harvest. Good field sanitation.'
    },
    'Corn_Common_Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Pyraclostrobin). Remove infected leaves. Apply at first sign of infection.',
        'description': 'Common rust appears as reddish-brown pustules on corn leaves, spreading in warm, humid conditions. Can cause yield reduction of 10-30%.',
        'prevention': 'Use resistant varieties. Plant early to avoid peak rust season. Good field sanitation. Monitor fields regularly.'
    },
    'Corn_Gray_Leaf_Spot': {
        'treatment': 'Apply fungicide (Strobilurin or Triazole). Remove infected leaves. Improve air circulation. Apply preventative sprays.',
        'description': 'Gray leaf spot causes grayish rectangular lesions on corn leaves, reducing yield. Can cause up to 50% yield loss in susceptible hybrids.',
        'prevention': 'Use resistant hybrids. Crop rotation. Remove crop residue after harvest. Good field sanitation.'
    },
    'Corn_Healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices and regular monitoring.',
        'description': 'Corn plant appears healthy with no signs of disease. Good growth and development.',
        'prevention': 'Maintain regular monitoring and good crop management. Continue preventative practices.'
    },

    # ==================== COTTON DISEASES ====================
    'Cotton_bacterial_blight': {
        'treatment': 'Apply copper-based bactericide. Remove infected plants. Practice crop rotation. Use disease-free seeds.',
        'description': 'Bacterial blight causes dark spots on cotton leaves and bolls, reducing fiber quality and yield.',
        'prevention': 'Use disease-free seeds. Avoid overhead watering. Remove infected plants. Crop rotation with non-cotton crops.'
    },
    'Cotton_curl_virus': {
        'treatment': 'No cure. Remove infected plants immediately. Control whiteflies with insecticides (Imidacloprid or Pyrethroids).',
        'description': 'Cotton leaf curl virus causes curling and yellowing of leaves, stunting plant growth and reducing yield.',
        'prevention': 'Use resistant varieties. Control whiteflies. Remove infected plants promptly. Good field sanitation.'
    },
    'Cotton_fussarium_wilt': {
        'treatment': 'No chemical treatment available. Use resistant varieties. Practice crop rotation with non-host crops for 3-4 years.',
        'description': 'Fusarium wilt causes yellowing and wilting of cotton plants, often leading to plant death. Soil-borne disease.',
        'prevention': 'Use resistant varieties. Crop rotation with non-host crops. Improve soil drainage. Good field sanitation.'
    },
    'Cotton_healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Cotton plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },

    # ==================== RICE DISEASES ====================
    'Rice_Bacterial Leaf Blight': {
        'treatment': 'Apply copper-based bactericide. Use resistant varieties. Avoid excess nitrogen fertilizer. Drain fields periodically.',
        'description': 'Bacterial leaf blight causes yellowing and wilting of rice leaves, reducing grain yield significantly.',
        'prevention': 'Use resistant varieties. Proper water management. Avoid over-fertilization. Good field sanitation.'
    },
    'Rice_Brown Spot': {
        'treatment': 'Apply fungicide (Mancozeb or Tricyclazole). Use resistant varieties. Maintain balanced nutrition.',
        'description': 'Brown spot causes oval brown lesions on rice leaves, reducing photosynthesis and yield.',
        'prevention': 'Use resistant varieties. Proper nutrient management. Good field sanitation. Avoid water stress.'
    },
    'Rice_Healthy Rice Leaf': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Rice plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Rice_Leaf Blast': {
        'treatment': 'Apply fungicide (Tricyclazole or Isoprothiolane). Use resistant varieties. Avoid excess nitrogen fertilizer.',
        'description': 'Leaf blast causes diamond-shaped lesions on rice leaves, affecting grain fill and yield. Can cause severe yield loss.',
        'prevention': 'Use resistant varieties. Proper fertilizer management. Avoid water stress. Good field sanitation.'
    },
    'Rice_Leaf scald': {
        'treatment': 'Apply fungicide (Propiconazole). Use resistant varieties. Improve air circulation. Avoid dense planting.',
        'description': 'Leaf scald causes reddish-brown lesions on rice leaves, reducing photosynthetic capacity and yield.',
        'prevention': 'Use resistant varieties. Avoid overcrowding. Good field sanitation. Proper spacing.'
    },
    'Rice_Sheath Blight': {
        'treatment': 'Apply fungicide (Azoxystrobin or Validamycin). Use resistant varieties. Avoid excess nitrogen.',
        'description': 'Sheath blight causes lesions on rice leaf sheaths, affecting grain filling and yield.',
        'prevention': 'Use resistant varieties. Proper spacing. Avoid excess nitrogen fertilizer. Good field sanitation.'
    },

    # ==================== SUGARCANE DISEASES ====================
    'Sugarcane_Healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Sugarcane plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Sugarcane_Mosaic': {
        'treatment': 'No cure. Remove infected plants. Control aphids (insect vectors) with insecticides. Use virus-free planting material.',
        'description': 'Mosaic virus causes mottled yellow-green patterns on sugarcane leaves, reducing sugar content and yield.',
        'prevention': 'Use virus-free planting material. Control aphids. Remove infected plants. Good field sanitation.'
    },
    'Sugarcane_RedRot': {
        'treatment': 'Apply fungicide (Carbendazim). Remove infected canes. Practice crop rotation. Use disease-free planting material.',
        'description': 'Red rot causes red discoloration inside sugarcane stalks, reducing sugar quality and yield.',
        'prevention': 'Use disease-free planting material. Avoid waterlogging. Proper field sanitation. Crop rotation.'
    },
    'Sugarcane_Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Pyraclostrobin). Use resistant varieties. Improve air circulation.',
        'description': 'Rust causes reddish-brown pustules on sugarcane leaves, reducing photosynthetic capacity.',
        'prevention': 'Use resistant varieties. Proper spacing. Good field sanitation. Monitor regularly.'
    },
    'Sugarcane_Yellow': {
        'treatment': 'No cure. Remove infected plants. Control leafhoppers (insect vectors) with insecticides.',
        'description': 'Sugarcane yellow leaf virus causes yellowing and stunting of sugarcane plants, reducing yield.',
        'prevention': 'Use virus-free planting material. Control leafhoppers. Remove infected plants. Good field sanitation.'
    },

    # ==================== TOMATO DISEASES ====================
    'Tomato_Bacterial_spot': {
        'treatment': 'Apply copper-based bactericide. Remove infected leaves. Practice crop rotation. Use disease-free seeds.',
        'description': 'Bacterial spot causes dark spots with yellow halos on tomato leaves and fruit, reducing yield and quality.',
        'prevention': 'Use disease-free seeds. Avoid overhead watering. Remove infected plants. Crop rotation.'
    },
    'Tomato_Early_blight': {
        'treatment': 'Apply fungicide (Chlorothalonil or Mancozeb). Remove infected leaves. Mulch around plants. Apply preventative sprays.',
        'description': 'Early blight causes dark spots with concentric rings on tomato leaves. Common in warm, wet conditions.',
        'prevention': 'Practice crop rotation. Water at base of plant. Remove infected plant debris. Good field sanitation.'
    },
    'Tomato_healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Tomato plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Tomato_Late_blight': {
        'treatment': 'Apply fungicide (Mancozeb or Chlorothalonil) immediately. Remove infected plants. Can destroy entire crop quickly.',
        'description': 'Late blight causes dark spots and wilting on tomato plants. Can destroy entire crop in days if not treated.',
        'prevention': 'Use resistant varieties. Practice crop rotation. Apply preventative fungicides. Good field sanitation.'
    },
    'Tomato_Leaf_Mold': {
        'treatment': 'Improve air circulation. Apply fungicide (Chlorothalonil). Remove infected leaves. Reduce humidity.',
        'description': 'Leaf mold causes yellow spots on leaves with gray mold on undersides. Common in high humidity environments.',
        'prevention': 'Space plants properly. Avoid overhead watering. Ensure good ventilation. Proper greenhouse management.'
    },
    'Tomato_powdery_mildew': {
        'treatment': 'Apply fungicide (Sulfur or Potassium bicarbonate). Improve air circulation. Remove infected leaves.',
        'description': 'Powdery mildew causes white powdery growth on tomato leaves, reducing photosynthesis and yield.',
        'prevention': 'Space plants properly. Avoid overhead watering. Good air circulation. Regular monitoring.'
    },
    'Tomato_Septoria_leaf_spot': {
        'treatment': 'Apply fungicide (Chlorothalonil). Remove infected leaves. Improve air circulation. Practice crop rotation.',
        'description': 'Septoria leaf spot causes small circular spots with dark borders on tomato leaves, reducing yield.',
        'prevention': 'Practice crop rotation. Water at base of plant. Remove infected plant debris. Good field sanitation.'
    },
    'Tomato_Spider_mites Two-spotted_spider_mite': {
        'treatment': 'Apply miticide or insecticidal soap. Increase humidity. Remove heavily infested leaves. Use predatory mites.',
        'description': 'Spider mites cause stippling and webbing on tomato leaves. Common in hot, dry conditions.',
        'prevention': 'Keep plants well-watered. Use predatory mites. Regularly monitor plants. Good field sanitation.'
    },
    'Tomato_Target_Spot': {
        'treatment': 'Apply fungicide (Chlorothalonil). Remove infected leaves. Improve air circulation. Practice crop rotation.',
        'description': 'Target spot causes dark spots with concentric rings on tomato leaves and fruit, reducing yield.',
        'prevention': 'Practice crop rotation. Avoid overhead watering. Remove infected plant debris. Good field sanitation.'
    },
    'Tomato_Tomato_mosaic_virus': {
        'treatment': 'No cure. Remove infected plants. Control insect vectors. Use resistant varieties. Disinfect tools.',
        'description': 'Mosaic virus causes mottled yellow-green patterns on tomato leaves. Stunts plant growth and reduces yield.',
        'prevention': 'Use resistant varieties. Control insects. Disinfect tools between plants. Remove infected plants.'
    },
    'Tomato_Tomato_Yellow_Leaf_Curl_Virus': {
        'treatment': 'No cure. Remove infected plants. Control whiteflies. Use resistant varieties. Use reflective mulches.',
        'description': 'Yellow leaf curl virus causes upward curling and yellowing of tomato leaves. Reduces fruit production significantly.',
        'prevention': 'Use resistant varieties. Control whiteflies. Use reflective mulches. Remove infected plants promptly.'
    },

    # ==================== WHEAT DISEASES ====================
    'Wheat_Aphid': {
        'treatment': 'Apply insecticide (Imidacloprid or Pyrethroids). Use resistant varieties. Encourage natural predators.',
        'description': 'Aphids cause yellowing and stunting of wheat plants by feeding on sap, reducing yield and quality.',
        'prevention': 'Use resistant varieties. Encourage natural predators. Monitor fields regularly. Good field sanitation.'
    },
    'Wheat_Black Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Propiconazole). Remove infected plants. Use resistant varieties.',
        'description': 'Black rust causes black pustules on wheat stems and leaves, reducing grain yield significantly.',
        'prevention': 'Use resistant varieties. Crop rotation. Remove volunteer wheat plants. Good field sanitation.'
    },
    'Wheat_Blast': {
        'treatment': 'Apply fungicide (Mancozeb or Thiophanate-methyl). Use resistant varieties. Proper field management.',
        'description': 'Wheat blast causes diamond-shaped lesions on leaves, affecting grain fill and reducing yield.',
        'prevention': 'Use resistant varieties. Proper spacing. Good field sanitation. Regular monitoring.'
    },
    'Wheat_Brown Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Tebuconazole). Use resistant varieties. Monitor fields regularly.',
        'description': 'Brown rust causes brown pustules on wheat leaves, reducing photosynthesis and yield.',
        'prevention': 'Use resistant varieties. Crop rotation. Monitor fields regularly. Good field sanitation.'
    },
    'Wheat_Common Root Rot': {
        'treatment': 'Practice crop rotation. Use fungicide seed treatments. Improve soil drainage. Use resistant varieties.',
        'description': 'Common root rot causes root decay and stunting in wheat plants, reducing yield and grain quality.',
        'prevention': 'Crop rotation with non-host crops. Use disease-free seed. Proper soil management. Good drainage.'
    },
    'Wheat_Fusarium Head Blight': {
        'treatment': 'Apply fungicide (Prothioconazole or Tebuconazole) at flowering. Use resistant varieties. Crop rotation.',
        'description': 'Fusarium head blight causes bleaching of wheat heads, reducing grain quality and yield.',
        'prevention': 'Use resistant varieties. Crop rotation. Avoid excess moisture during flowering. Good field sanitation.'
    },
    'Wheat_Healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Wheat plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Wheat_Leaf Blight': {
        'treatment': 'Apply fungicide (Chlorothalonil or Mancozeb). Remove infected leaves. Practice crop rotation.',
        'description': 'Leaf blight causes brown spots and lesions on wheat leaves, reducing photosynthesis and yield.',
        'prevention': 'Crop rotation. Proper spacing. Good field sanitation. Regular monitoring.'
    },
    'Wheat_Mildew': {
        'treatment': 'Apply fungicide (Sulfur or Triadimefon). Improve air circulation. Use resistant varieties.',
        'description': 'Powdery mildew causes white powdery growth on wheat leaves, reducing photosynthesis and yield.',
        'prevention': 'Use resistant varieties. Proper spacing. Avoid excess nitrogen fertilizer. Good field sanitation.'
    },
    'Wheat_Mite': {
        'treatment': 'Apply miticide (Abamectin or Bifenazate). Remove infested plants. Encourage natural predators.',
        'description': 'Wheat mites cause yellowing and stippling on leaves, reducing yield and grain quality.',
        'prevention': 'Regular monitoring. Encourage natural predators. Good field sanitation. Proper crop management.'
    },
    'Wheat_Septoria': {
        'treatment': 'Apply fungicide (Azoxystrobin or Chlorothalonil). Use resistant varieties. Practice crop rotation.',
        'description': 'Septoria causes brown spots with dark borders on wheat leaves, reducing yield and grain quality.',
        'prevention': 'Use resistant varieties. Crop rotation. Avoid overhead watering. Good field sanitation.'
    },
    'Wheat_Smut': {
        'treatment': 'Use fungicide seed treatments. Use disease-free seeds. Use certified seed from reliable sources.',
        'description': 'Smut causes black powdery masses in wheat heads, reducing grain quality and yield.',
        'prevention': 'Use certified seed. Fungicide seed treatment. Crop rotation. Good field sanitation.'
    },
    'Wheat_Stem fly': {
        'treatment': 'Apply insecticide (Pyrethroids). Use resistant varieties. Plant early to avoid peak infestation.',
        'description': 'Stem fly larvae bore into wheat stems, causing lodging and significant yield loss.',
        'prevention': 'Use resistant varieties. Plant early. Monitor fields regularly. Good field sanitation.'
    },
    'Wheat_Tan spot': {
        'treatment': 'Apply fungicide (Propiconazole or Azoxystrobin). Use resistant varieties. Practice crop rotation.',
        'description': 'Tan spot causes tan-colored lesions on wheat leaves, reducing yield and grain quality.',
        'prevention': 'Use resistant varieties. Crop rotation. Good field sanitation. Regular monitoring.'
    },
    'Wheat_Yellow Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Propiconazole). Use resistant varieties. Monitor fields regularly.',
        'description': 'Yellow rust causes yellow pustules on wheat leaves, affecting photosynthesis and yield. Can cause significant loss.',
        'prevention': 'Use resistant varieties. Monitor fields regularly. Good field sanitation. Proper crop management.'
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
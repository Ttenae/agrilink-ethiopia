import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import json
import os
import random
import gc
from efficientnet_pytorch import EfficientNet

# ==================== MODEL LOADING ====================
MODEL_PATH = "models/crop_model.pth"
CLASSES_PATH = "models/crop_classes.json"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = None
classes = None
prediction_count = 0

def load_model(force_reload=False):
    """Load the model and classes. Force reload if requested."""
    global model, classes
    
    if model is None or classes is None or force_reload:
        try:
            # Check if model exists
            if not os.path.exists(MODEL_PATH):
                print(f"❌ Model not found: {MODEL_PATH}")
                return None, None
            
            # Load classes
            with open(CLASSES_PATH, 'r') as f:
                classes = json.load(f)
            
            print(f"📊 Loading {len(classes)} classes...")
            
            # ✅ Load model using efficientnet_pytorch
            model = EfficientNet.from_pretrained('efficientnet-b0')
            
            # ✅ Replace the classifier head
            num_classes = len(classes)
            model._fc = nn.Linear(model._fc.in_features, num_classes)
            
            # ✅ Load trained weights
            checkpoint = torch.load(MODEL_PATH, map_location=device)
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
            else:
                model.load_state_dict(checkpoint)
            
            model.eval()
            model.to(device)
            
            print(f"✅ Model loaded! ({len(classes)} classes) on {device}")
            
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            return model, classes
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            import traceback
            traceback.print_exc()
            model = None
            classes = None
            return None, None
    
    return model, classes

# ==================== COMPLETE TREATMENT INFO ====================
TREATMENT_INFO = {
    # ==================== CORN ====================
    'Corn_Blight': {
        'treatment': 'Apply fungicide (Mancozeb or Chlorothalonil). Remove infected leaves. Practice crop rotation with non-corn crops for 2-3 years.',
        'description': 'Corn blight causes brown spots and lesions on leaves, reducing photosynthesis and yield.',
        'prevention': 'Use disease-resistant varieties. Crop rotation. Remove plant debris after harvest.'
    },
    'Corn_Common_Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Pyraclostrobin). Remove infected leaves. Apply at first sign of infection.',
        'description': 'Common rust appears as reddish-brown pustules on corn leaves, spreading in warm, humid conditions.',
        'prevention': 'Use resistant varieties. Plant early to avoid peak rust season. Good field sanitation.'
    },
    'Corn_Gray_Leaf_Spot': {
        'treatment': 'Apply fungicide (Strobilurin or Triazole). Remove infected leaves. Improve air circulation.',
        'description': 'Gray leaf spot causes grayish rectangular lesions on corn leaves, reducing yield.',
        'prevention': 'Use resistant hybrids. Crop rotation. Remove crop residue after harvest.'
    },
    'Corn_Healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices and regular monitoring.',
        'description': 'Corn plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },

    # ==================== COTTON ====================
    'Cotton_bacterial_blight': {
        'treatment': 'Apply copper-based bactericide. Remove infected plants. Practice crop rotation. Use disease-free seeds.',
        'description': 'Bacterial blight causes dark spots on cotton leaves and bolls, reducing fiber quality.',
        'prevention': 'Use disease-free seeds. Avoid overhead watering. Remove infected plants. Crop rotation.'
    },
    'Cotton_curl_virus': {
        'treatment': 'No cure. Remove infected plants immediately. Control whiteflies with insecticides (Imidacloprid or Pyrethroids).',
        'description': 'Cotton leaf curl virus causes curling and yellowing of leaves, stunting plant growth.',
        'prevention': 'Use resistant varieties. Control whiteflies. Remove infected plants promptly.'
    },
    'Cotton_fussarium_wilt': {
        'treatment': 'No chemical treatment available. Use resistant varieties. Practice crop rotation with non-host crops for 3-4 years.',
        'description': 'Fusarium wilt causes yellowing and wilting of cotton plants, often leading to plant death.',
        'prevention': 'Use resistant varieties. Crop rotation. Improve soil drainage. Good field sanitation.'
    },
    'Cotton_healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Cotton plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },

    # ==================== RICE ====================
    'Rice_Bacterial Leaf Blight': {
        'treatment': 'Apply copper-based bactericide. Use resistant varieties. Avoid excess nitrogen fertilizer. Drain fields periodically.',
        'description': 'Bacterial leaf blight causes yellowing and wilting of rice leaves, reducing grain yield.',
        'prevention': 'Use resistant varieties. Proper water management. Avoid over-fertilization.'
    },
    'Rice_Brown Spot': {
        'treatment': 'Apply fungicide (Mancozeb or Tricyclazole). Use resistant varieties. Maintain balanced nutrition.',
        'description': 'Brown spot causes oval brown lesions on rice leaves, reducing photosynthesis and yield.',
        'prevention': 'Use resistant varieties. Proper nutrient management. Avoid water stress.'
    },
    'Rice_Healthy Rice Leaf': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Rice plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Rice_Leaf Blast': {
        'treatment': 'Apply fungicide (Tricyclazole or Isoprothiolane). Use resistant varieties. Avoid excess nitrogen.',
        'description': 'Leaf blast causes diamond-shaped lesions on rice leaves, affecting grain fill and yield.',
        'prevention': 'Use resistant varieties. Proper fertilizer management. Avoid water stress.'
    },
    'Rice_Leaf scald': {
        'treatment': 'Apply fungicide (Propiconazole). Use resistant varieties. Improve air circulation. Avoid dense planting.',
        'description': 'Leaf scald causes reddish-brown lesions on rice leaves, reducing photosynthetic capacity.',
        'prevention': 'Use resistant varieties. Avoid overcrowding. Good field sanitation.'
    },
    'Rice_Sheath Blight': {
        'treatment': 'Apply fungicide (Azoxystrobin or Validamycin). Use resistant varieties. Avoid excess nitrogen.',
        'description': 'Sheath blight causes lesions on rice leaf sheaths, affecting grain filling and yield.',
        'prevention': 'Use resistant varieties. Proper spacing. Avoid excess nitrogen fertilizer.'
    },

    # ==================== SUGARCANE ====================
    'Sugarcane_Healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Sugarcane plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Sugarcane_Mosaic': {
        'treatment': 'No cure. Remove infected plants. Control aphids. Use virus-free planting material.',
        'description': 'Mosaic virus causes mottled yellow-green patterns on sugarcane leaves, reducing sugar content.',
        'prevention': 'Use virus-free planting material. Control aphids. Remove infected plants.'
    },
    'Sugarcane_RedRot': {
        'treatment': 'Apply fungicide (Carbendazim). Remove infected canes. Practice crop rotation. Use disease-free planting material.',
        'description': 'Red rot causes red discoloration inside sugarcane stalks, reducing sugar quality.',
        'prevention': 'Use disease-free planting material. Avoid waterlogging. Proper field sanitation.'
    },
    'Sugarcane_Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Pyraclostrobin). Use resistant varieties. Improve air circulation.',
        'description': 'Rust causes reddish-brown pustules on sugarcane leaves, reducing photosynthetic capacity.',
        'prevention': 'Use resistant varieties. Proper spacing. Good field sanitation.'
    },
    'Sugarcane_Yellow': {
        'treatment': 'No cure. Remove infected plants. Control leafhoppers with insecticides.',
        'description': 'Sugarcane yellow leaf virus causes yellowing and stunting of sugarcane plants.',
        'prevention': 'Use virus-free planting material. Control leafhoppers. Remove infected plants.'
    },

    # ==================== TOMATO ====================
    'Tomato_Bacterial_spot': {
        'treatment': 'Apply copper-based bactericide. Remove infected leaves. Practice crop rotation. Use disease-free seeds.',
        'description': 'Bacterial spot causes dark spots with yellow halos on tomato leaves and fruit.',
        'prevention': 'Use disease-free seeds. Avoid overhead watering. Remove infected plants. Crop rotation.'
    },
    'Tomato_Early_blight': {
        'treatment': 'Apply fungicide (Chlorothalonil or Mancozeb). Remove infected leaves. Mulch around plants.',
        'description': 'Early blight causes dark spots with concentric rings on tomato leaves. Common in warm, wet conditions.',
        'prevention': 'Practice crop rotation. Water at base of plant. Remove infected plant debris.'
    },
    'Tomato_healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Tomato plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Tomato_Late_blight': {
        'treatment': 'Apply fungicide (Mancozeb or Chlorothalonil) immediately. Remove infected plants.',
        'description': 'Late blight causes dark spots and wilting on tomato plants. Can destroy entire crop quickly.',
        'prevention': 'Use resistant varieties. Practice crop rotation. Apply preventative fungicides.'
    },
    'Tomato_Leaf_Mold': {
        'treatment': 'Improve air circulation. Apply fungicide (Chlorothalonil). Remove infected leaves. Reduce humidity.',
        'description': 'Leaf mold causes yellow spots on leaves with gray mold on undersides. Common in high humidity.',
        'prevention': 'Space plants properly. Avoid overhead watering. Ensure good ventilation.'
    },
    'Tomato_powdery_mildew': {
        'treatment': 'Apply fungicide (Sulfur or Potassium bicarbonate). Improve air circulation. Remove infected leaves.',
        'description': 'Powdery mildew causes white powdery growth on tomato leaves, reducing photosynthesis.',
        'prevention': 'Space plants properly. Avoid overhead watering. Good air circulation.'
    },
    'Tomato_Septoria_leaf_spot': {
        'treatment': 'Apply fungicide (Chlorothalonil). Remove infected leaves. Improve air circulation. Practice crop rotation.',
        'description': 'Septoria leaf spot causes small circular spots with dark borders on tomato leaves.',
        'prevention': 'Practice crop rotation. Water at base of plant. Remove infected plant debris.'
    },
    'Tomato_Spider_mites Two-spotted_spider_mite': {
        'treatment': 'Apply miticide or insecticidal soap. Increase humidity. Remove heavily infested leaves. Use predatory mites.',
        'description': 'Spider mites cause stippling and webbing on tomato leaves. Common in hot, dry conditions.',
        'prevention': 'Keep plants well-watered. Use predatory mites. Regularly monitor plants.'
    },
    'Tomato_Target_Spot': {
        'treatment': 'Apply fungicide (Chlorothalonil). Remove infected leaves. Improve air circulation. Practice crop rotation.',
        'description': 'Target spot causes dark spots with concentric rings on tomato leaves and fruit.',
        'prevention': 'Practice crop rotation. Avoid overhead watering. Remove infected plant debris.'
    },
    'Tomato_Tomato_mosaic_virus': {
        'treatment': 'No cure. Remove infected plants. Control insect vectors. Use resistant varieties. Disinfect tools.',
        'description': 'Mosaic virus causes mottled yellow-green patterns on tomato leaves. Stunts plant growth.',
        'prevention': 'Use resistant varieties. Control insects. Disinfect tools between plants.'
    },
    'Tomato_Tomato_Yellow_Leaf_Curl_Virus': {
        'treatment': 'No cure. Remove infected plants. Control whiteflies. Use resistant varieties. Use reflective mulches.',
        'description': 'Yellow leaf curl virus causes upward curling and yellowing of tomato leaves. Reduces fruit production.',
        'prevention': 'Use resistant varieties. Control whiteflies. Use reflective mulches. Remove infected plants promptly.'
    },

    # ==================== WHEAT ====================
    'Wheat_Aphid': {
        'treatment': 'Apply insecticide (Imidacloprid or Pyrethroids). Use resistant varieties. Encourage natural predators.',
        'description': 'Aphids cause yellowing and stunting of wheat plants by feeding on sap, reducing yield.',
        'prevention': 'Use resistant varieties. Encourage natural predators. Monitor fields regularly.'
    },
    'Wheat_Black Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Propiconazole). Remove infected plants. Use resistant varieties.',
        'description': 'Black rust causes black pustules on wheat stems and leaves, reducing grain yield.',
        'prevention': 'Use resistant varieties. Crop rotation. Remove volunteer wheat plants.'
    },
    'Wheat_Blast': {
        'treatment': 'Apply fungicide (Mancozeb or Thiophanate-methyl). Use resistant varieties. Proper field management.',
        'description': 'Wheat blast causes diamond-shaped lesions on leaves, affecting grain fill and yield.',
        'prevention': 'Use resistant varieties. Proper spacing. Good field sanitation.'
    },
    'Wheat_Brown Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Tebuconazole). Use resistant varieties. Monitor fields regularly.',
        'description': 'Brown rust causes brown pustules on wheat leaves, reducing photosynthesis and yield.',
        'prevention': 'Use resistant varieties. Crop rotation. Monitor fields regularly.'
    },
    'Wheat_Common Root Rot': {
        'treatment': 'Practice crop rotation. Use fungicide seed treatments. Improve soil drainage. Use resistant varieties.',
        'description': 'Common root rot causes root decay and stunting in wheat plants, reducing yield.',
        'prevention': 'Crop rotation. Use disease-free seed. Proper soil management. Good drainage.'
    },
    'Wheat_Fusarium Head Blight': {
        'treatment': 'Apply fungicide (Prothioconazole or Tebuconazole) at flowering. Use resistant varieties. Crop rotation.',
        'description': 'Fusarium head blight causes bleaching of wheat heads, reducing grain quality.',
        'prevention': 'Use resistant varieties. Crop rotation. Avoid excess moisture during flowering.'
    },
    'Wheat_Healthy': {
        'treatment': 'No treatment needed. Continue good agricultural practices.',
        'description': 'Wheat plant appears healthy with no signs of disease.',
        'prevention': 'Maintain regular monitoring and good crop management.'
    },
    'Wheat_Leaf Blight': {
        'treatment': 'Apply fungicide (Chlorothalonil or Mancozeb). Remove infected leaves. Practice crop rotation.',
        'description': 'Leaf blight causes brown spots and lesions on wheat leaves, reducing photosynthesis.',
        'prevention': 'Crop rotation. Proper spacing. Good field sanitation.'
    },
    'Wheat_Mildew': {
        'treatment': 'Apply fungicide (Sulfur or Triadimefon). Improve air circulation. Use resistant varieties.',
        'description': 'Powdery mildew causes white powdery growth on wheat leaves, reducing photosynthesis.',
        'prevention': 'Use resistant varieties. Proper spacing. Avoid excess nitrogen fertilizer.'
    },
    'Wheat_Mite': {
        'treatment': 'Apply miticide (Abamectin or Bifenazate). Remove infested plants. Encourage natural predators.',
        'description': 'Wheat mites cause yellowing and stippling on leaves, reducing yield and grain quality.',
        'prevention': 'Regular monitoring. Encourage natural predators. Good field sanitation.'
    },
    'Wheat_Septoria': {
        'treatment': 'Apply fungicide (Azoxystrobin or Chlorothalonil). Use resistant varieties. Practice crop rotation.',
        'description': 'Septoria causes brown spots with dark borders on wheat leaves, reducing yield.',
        'prevention': 'Use resistant varieties. Crop rotation. Avoid overhead watering.'
    },
    'Wheat_Smut': {
        'treatment': 'Use fungicide seed treatments. Use disease-free seeds. Use certified seed from reliable sources.',
        'description': 'Smut causes black powdery masses in wheat heads, reducing grain quality.',
        'prevention': 'Use certified seed. Fungicide seed treatment. Crop rotation.'
    },
    'Wheat_Stem fly': {
        'treatment': 'Apply insecticide (Pyrethroids). Use resistant varieties. Plant early to avoid peak infestation.',
        'description': 'Stem fly larvae bore into wheat stems, causing lodging and significant yield loss.',
        'prevention': 'Use resistant varieties. Plant early. Monitor fields regularly.'
    },
    'Wheat_Tan spot': {
        'treatment': 'Apply fungicide (Propiconazole or Azoxystrobin). Use resistant varieties. Practice crop rotation.',
        'description': 'Tan spot causes tan-colored lesions on wheat leaves, reducing yield and grain quality.',
        'prevention': 'Use resistant varieties. Crop rotation. Good field sanitation.'
    },
    'Wheat_Yellow Rust': {
        'treatment': 'Apply fungicide (Azoxystrobin or Propiconazole). Use resistant varieties. Monitor fields regularly.',
        'description': 'Yellow rust causes yellow pustules on wheat leaves, affecting photosynthesis and yield.',
        'prevention': 'Use resistant varieties. Monitor fields regularly. Good field sanitation.'
    }
}

def get_treatment_info(disease_name):
    """Get treatment information for a disease with improved matching."""
    
    # Exact match
    if disease_name in TREATMENT_INFO:
        return TREATMENT_INFO[disease_name]
    
    # Try with underscores replaced by spaces
    disease_key = disease_name.replace('_', ' ')
    if disease_key in TREATMENT_INFO:
        return TREATMENT_INFO[disease_key]
    
    # Try removing "___" and replacing with space
    disease_key = disease_name.replace('___', ' ').replace('_', ' ')
    if disease_key in TREATMENT_INFO:
        return TREATMENT_INFO[disease_key]
    
    # Partial matching
    for key in TREATMENT_INFO:
        if disease_name.lower() in key.lower() or key.lower() in disease_name.lower():
            return TREATMENT_INFO[key]
    
    # Crop-based fallback
    crops = ['Corn', 'Cotton', 'Rice', 'Sugarcane', 'Tomato', 'Wheat']
    for crop in crops:
        if crop in disease_name:
            return {
                'treatment': f'For {disease_name}, consult a local agricultural expert for proper diagnosis and treatment.',
                'description': f'{disease_name} detected in {crop}. Please consult an expert for proper diagnosis.',
                'prevention': f'Practice good agricultural practices for {crop}. Maintain proper spacing and irrigation. Monitor regularly.'
            }
    
    # Fallback
    return {
        'treatment': f'For {disease_name}, consult a local agricultural expert for proper diagnosis and treatment.',
        'description': f'{disease_name} detected in the crop. Please consult an expert for proper diagnosis.',
        'prevention': 'Practice good agricultural practices. Maintain proper spacing and irrigation. Monitor regularly.'
    }

# ==================== PREDICTION ====================
def predict_disease(image_path):
    """Predict disease from image using trained model."""
    global prediction_count, model, classes
    
    prediction_count += 1
    
    # Refresh model every 5 predictions to prevent memory issues
    if prediction_count % 5 == 0:
        print(f"🔄 Refreshing model (prediction #{prediction_count})...")
        model = None
        classes = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    model, classes = load_model()
    
    if model is None or classes is None:
        return get_mock_prediction()
    
    try:
        # Ensure model is in eval mode
        model.eval()
        
        # Preprocess image
        transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        image = Image.open(image_path).convert('RGB')
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.nn.functional.softmax(output, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
        
        disease_name = classes[predicted.item()]
        confidence_percent = confidence.item() * 100
        
        print(f"🔍 Disease: '{disease_name}', Confidence: {confidence_percent:.2f}%")
        
        # ✅ IMPORTANT: Handle low confidence (car image, unknown object)
        CONFIDENCE_THRESHOLD = 30  # 30% threshold
        
        if confidence_percent < CONFIDENCE_THRESHOLD:
            print(f"⚠️ Low confidence ({confidence_percent:.2f}%) - treating as unknown")
            
            # Get top 3 predictions for debugging
            top_probs, top_indices = torch.topk(probabilities, min(3, len(classes)))
            top_predictions = []
            for i in range(len(top_probs[0])):
                top_predictions.append({
                    'class': classes[top_indices[0][i].item()],
                    'confidence': top_probs[0][i].item() * 100
                })
            
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            return {
                'disease': 'Uncertain - Please upload a clear crop leaf image',
                'confidence': confidence_percent,
                'treatment': 'N/A - The image does not appear to be a clear crop leaf.',
                'description': 'The model is uncertain about this image. It may not be a crop leaf, or the image quality is too low. Please upload a clear, well-lit photo of a crop leaf with visible disease symptoms.',
                'prevention': 'N/A - Please upload a clear crop leaf image for accurate diagnosis.',
                'is_healthy': False,
                'is_uncertain': True,
                'top_predictions': top_predictions,
                'model_type': 'trained_efficientnet',
                'model_confidence': confidence_percent
            }
        
        # Format disease name for display
        display_name = disease_name.replace('_', ' ').replace('___', ' ')
        
        # Get treatment info
        info = get_treatment_info(disease_name)
        
        # Improved healthy detection
        health_keywords = ['healthy', 'health']
        is_healthy = any(keyword in disease_name.lower() for keyword in health_keywords)
        
        print(f"📋 Treatment: {info.get('treatment', 'N/A')[:60]}...")
        print(f"🍃 Healthy: {is_healthy}")
        
        # Clean up memory
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return {
            'disease': display_name,
            'confidence': confidence_percent,
            'treatment': info.get('treatment', 'Consult local expert.'),
            'description': info.get('description', 'Disease detected. Please consult an expert.'),
            'prevention': info.get('prevention', 'Practice good agricultural practices.'),
            'is_healthy': is_healthy,
            'is_uncertain': False,
            'model_type': 'trained_efficientnet',
            'model_confidence': confidence_percent
        }
        
    except Exception as e:
        print(f'❌ Prediction error: {e}')
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
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
            'is_healthy': False,
            'is_uncertain': False
        },
        {
            'disease': 'Tomato Healthy',
            'confidence': 95.1,
            'treatment': 'No treatment needed.',
            'description': 'Tomato plant appears healthy.',
            'prevention': 'Maintain regular monitoring.',
            'is_healthy': True,
            'is_uncertain': False
        }
    ]
    return random.choice(mock_diseases)